'use strict';
/**
 * Bagimliliksiz minik WebSocket sunucusu (RFC 6455, sadece localhost icin).
 *
 * Neden kendi implementasyonumuz var?  Cunku `npm install` calistiramadigin
 * durumda bile (offline PC, kisitli ag, kurumsal proxy) overlay'lerin mock
 * modda calismasini istiyoruz.  Sifir bagimlilik = her yerde calisir.
 *
 * Desteklenen: text frame gonderme, ping/pong, close, maskeli client frame'leri
 * cozme.  Desteklenmeyen: permessage-deflate, fragmentasyon (localhost'ta gerek yok),
 * binary frame.
 */

const crypto = require('crypto');
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const OP = { CONT: 0x0, TEXT: 0x1, BIN: 0x2, CLOSE: 0x8, PING: 0x9, PONG: 0xa };

function encodeFrame(data, opcode = OP.TEXT) {
  const payload = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
  const len = payload.length;
  let header;

  if (len < 126) {
    header = Buffer.alloc(2);
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeUInt32BE(Math.floor(len / 2 ** 32), 2);
    header.writeUInt32BE(len >>> 0, 6);
  }
  header[0] = 0x80 | opcode; // FIN + opcode

  return Buffer.concat([header, payload]);
}

/** Gelen byte akisindan tam frame'leri sokup cikarir. */
function drainFrames(state) {
  const out = [];

  for (;;) {
    const buf = state.buf;
    if (buf.length < 2) break;

    const fin = (buf[0] & 0x80) !== 0;
    const opcode = buf[0] & 0x0f;
    const masked = (buf[1] & 0x80) !== 0;
    let len = buf[1] & 0x7f;
    let offset = 2;

    if (len === 126) {
      if (buf.length < offset + 2) break;
      len = buf.readUInt16BE(offset);
      offset += 2;
    } else if (len === 127) {
      if (buf.length < offset + 8) break;
      const hi = buf.readUInt32BE(offset);
      const lo = buf.readUInt32BE(offset + 4);
      len = hi * 2 ** 32 + lo;
      offset += 8;
    }

    let mask = null;
    if (masked) {
      if (buf.length < offset + 4) break;
      mask = buf.subarray(offset, offset + 4);
      offset += 4;
    }

    if (buf.length < offset + len) break;

    const payload = Buffer.from(buf.subarray(offset, offset + len));
    if (mask) {
      for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
    }

    state.buf = buf.subarray(offset + len);
    out.push({ fin, opcode, payload });
  }

  return out;
}

/**
 * Var olan bir http.Server'a WebSocket yetenegi ekler.
 * @param {import('http').Server} httpServer
 * @param {{ path?: string, onConnect?: (client) => void }} opts
 * @returns {{ clients: Set, broadcast: (obj) => number, close: () => void }}
 */
function attach(httpServer, opts = {}) {
  const path = opts.path || '/ws';
  const clients = new Set();

  httpServer.on('upgrade', (req, socket) => {
    const url = (req.url || '').split('?')[0];
    if (url !== path) {
      socket.destroy();
      return;
    }

    const key = req.headers['sec-websocket-key'];
    if (!key || (req.headers.upgrade || '').toLowerCase() !== 'websocket') {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');

    // Istemci alt protokol istediyse ilkini kabul et. RFC'ye gore sunucu hic
    // cevap vermeyebilir, ama bazi istemciler (undici dahil) secilmis protokol
    // gormek istiyor — echo etmek her iki tarafi da memnun ediyor.
    let protoHeader = '';
    const wanted = req.headers['sec-websocket-protocol'];
    if (wanted) {
      const first = String(wanted).split(',')[0].trim();
      if (first && (!opts.protocols || opts.protocols.includes(first))) {
        protoHeader = `Sec-WebSocket-Protocol: ${first}\r\n`;
      }
    }

    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        protoHeader +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
    );

    socket.setNoDelay(true);

    const state = { buf: Buffer.alloc(0) };
    const client = {
      socket,
      alive: true,
      send(obj) {
        if (!this.alive) return;
        const text = typeof obj === 'string' ? obj : JSON.stringify(obj);
        try {
          socket.write(encodeFrame(text, OP.TEXT));
        } catch {
          this.alive = false;
        }
      },
      close() {
        if (!this.alive) return;
        this.alive = false;
        try {
          socket.write(encodeFrame(Buffer.alloc(0), OP.CLOSE));
          socket.end();
        } catch {
          /* zaten kapali */
        }
      },
    };

    const drop = () => {
      client.alive = false;
      clients.delete(client);
    };

    socket.on('data', (chunk) => {
      state.buf = Buffer.concat([state.buf, chunk]);
      for (const frame of drainFrames(state)) {
        if (frame.opcode === OP.CLOSE) {
          client.close();
          drop();
        } else if (frame.opcode === OP.PING) {
          try {
            socket.write(encodeFrame(frame.payload, OP.PONG));
          } catch {
            drop();
          }
        }
        // TEXT/PONG: overlay'ler bize bir sey gondermiyor, yok sayiyoruz
      }
    });

    socket.on('error', drop);
    socket.on('close', drop);

    clients.add(client);
    if (opts.onConnect) opts.onConnect(client);
  });

  // 30 sn'de bir ping -> olu baglantilari temizle
  const heartbeat = setInterval(() => {
    for (const c of clients) {
      if (!c.alive) {
        clients.delete(c);
        continue;
      }
      try {
        c.socket.write(encodeFrame(Buffer.alloc(0), OP.PING));
      } catch {
        c.alive = false;
        clients.delete(c);
      }
    }
  }, 30000);
  heartbeat.unref?.();

  return {
    clients,
    broadcast(obj) {
      const text = typeof obj === 'string' ? obj : JSON.stringify(obj);
      let n = 0;
      for (const c of clients) {
        if (c.alive) {
          c.send(text);
          n++;
        }
      }
      return n;
    },
    close() {
      clearInterval(heartbeat);
      for (const c of clients) c.close();
      clients.clear();
    },
  };
}

module.exports = { attach, encodeFrame };
