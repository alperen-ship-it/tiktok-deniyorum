'use strict';
/**
 * guard.js — preload (-r). Bridge sureci loopback disina HICBIR baglanti
 * acamaz. Deneme olursa engellenir ve DANISMAN_GUARD_LOG dosyasina yazilir.
 * (TikTok / EulerStream'e asla baglanma kuralinin emniyet kemeri.)
 */
const net = require('net');
const dns = require('dns');
const fs = require('fs');

const LOG = process.env.DANISMAN_GUARD_LOG;
const LOOP = /^(localhost|127\.\d+\.\d+\.\d+|::1|\[::1\]|0\.0\.0\.0|::|::ffff:127\.\d+\.\d+\.\d+)$/i;

function note(kind, host) {
  const line = `${new Date().toISOString()} ${kind} ${host}\n`;
  try { if (LOG) fs.appendFileSync(LOG, line); } catch { /* yoksay */ }
  process.stderr.write('[guard] ENGELLENDI ' + kind + ' ' + host + '\n');
}

const origConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  let o = args[0];
  if (Array.isArray(o)) o = o[0];
  let host = 'localhost';
  if (o && typeof o === 'object') {
    if (o.path) return origConnect.apply(this, args);       // unix soketi
    host = o.host || 'localhost';
  } else if (typeof args[1] === 'string') host = args[1];
  if (!LOOP.test(String(host))) {
    note('connect', host);
    const err = Object.assign(new Error('danisman guard: disari baglanti yasak: ' + host), { code: 'ECONNREFUSED' });
    process.nextTick(() => this.destroy(err));
    return this;
  }
  return origConnect.apply(this, args);
};

const origLookup = dns.lookup;
dns.lookup = function (hostname, options, cb) {
  if (typeof options === 'function') { cb = options; options = {}; }
  if (!LOOP.test(String(hostname))) {
    note('dns', hostname);
    const err = Object.assign(new Error('danisman guard: dns yasak: ' + hostname), { code: 'ENOTFOUND' });
    return process.nextTick(() => cb(err));
  }
  return origLookup.call(dns, hostname, options, cb);
};
