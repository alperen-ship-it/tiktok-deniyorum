'use strict';
/**
 * build-fake.js [2.5.0|2.4.3]
 *
 * Gercek tiktok-live-connector paketinin METNINDEN (calistirmadan) sahte bir
 * paket uretir: danisman/node_modules/tiktok-live-connector
 *   - ayni package.json "exports" haritasi (".", "./legacy"), ayni ESM tipi
 *   - index.js: gercek paketin export ettigi BUTUN adlar
 *   - hata siniflari, ControlEvent/WebcastEvent/ConnectState, RoomIdRouteConfig,
 *     IsLiveRouteConfig: gercek kaynaktan BIREBIR kopya
 *   - TikTokLiveConnection: ayni yuzey, ama connect() senaryodan okur
 *     (globalThis.__TLC), aga hic cikmaz.
 */
const fs = require('fs');
const path = require('path');

const SURUM = process.argv[2] || '2.5.0';
const KAYNAK = path.join(__dirname, '..', 'repo-arastirma', 's4-baglanti', 'npm', 'tlc-' + SURUM, 'package');
const HEDEF = path.join(__dirname, 'node_modules', 'tiktok-live-connector');

const dist = path.join(KAYNAK, 'dist');
const libAd = fs.readdirSync(dist).find((f) => /^lib-.*\.js$/.test(f));
const lib = fs.readFileSync(path.join(dist, libAd), 'utf8');
const index = fs.readFileSync(path.join(dist, 'index.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(KAYNAK, 'package.json'), 'utf8'));

function arasi(bas, son) {
  const i = lib.indexOf(bas);
  if (i < 0) throw new Error('bulunamadi: ' + bas);
  const j = lib.indexOf(son, i);
  if (j < 0) throw new Error('son bulunamadi: ' + son);
  return lib.slice(i, j + son.length);
}

const hatalar = arasi('//#region src/types/errors.ts', '//#endregion');
const controlEvent = arasi('let ControlEvent = ', '}({});');
const webcastEvent = arasi('let WebcastEvent = ', '}({});');
const connectState = arasi('let ConnectState = ', '}({});');
const roomIdCfg = arasi('const RoomIdRouteConfig = {', '};');
const isLiveCfg = arasi('const IsLiveRouteConfig = {', '};');

// export listesi (son "export { ... };")
const m = index.match(/export \{([^}]*)\};\s*(\/\/# sourceMappingURL.*)?\s*$/);
if (!m) throw new Error('export listesi bulunamadi');
const adlar = m[1].split(',').map((s) => s.trim()).filter(Boolean);

const GERCEK = new Set([
  // hatalar bolgesinden
  'AlreadyConnectedError', 'AlreadyConnectingError', 'AuthenticatedWebSocketConnectionError',
  'ConnectTimeoutError', 'ErrorReason', 'InvalidRequestError', 'InvalidResponseCompositeError',
  'InvalidResponseError', 'InvalidSchemaNameError', 'InvalidUniqueIdError', 'PremiumFeatureError',
  'SchemaDecodeError', 'SignAPIError', 'SignatureMissingTokensError', 'SignatureRateLimitError',
  'TikTokLiveError', 'UserOfflineError',
  'ControlEvent', 'WebcastEvent', 'ConnectState', 'RoomIdRouteConfig', 'IsLiveRouteConfig',
  'SignConfig', 'RouteConfig', 'VERSION', 'LIBRARY_IDENTITY', 'TikTokLiveConnection',
]);
const eksik = [...GERCEK].filter((a) => !adlar.includes(a));
if (eksik.length) throw new Error('gercek pakette olmayan ad: ' + eksik.join(', '));
const taslak = adlar.filter((a) => !GERCEK.has(a));

const sinif = fs.readFileSync(path.join(__dirname, 'fake-connection.js.txt'), 'utf8');

const cikti = `// URETILDI: build-fake.js — tiktok-live-connector@${pkg.version} SAHTESI. Aga cikmaz.
import { EventEmitter } from "node:events";
${hatalar}
${controlEvent}
${webcastEvent}
${connectState}
${roomIdCfg}
${isLiveCfg}
const VERSION = ${JSON.stringify(pkg.version)};
const LIBRARY_IDENTITY = "ttlive-node";
const SignConfig = { basePath: "http://127.0.0.1:9/sahte", apiKey: process.env.SIGN_API_KEY, baseOptions: { headers: {}, validateStatus: () => true }, cachedInstance: void 0 };
const __T = (globalThis.__TLC ||= { script: [], connects: [], instances: [], calls: [], opts: {} });
const __taslak = (ad) => function sahteTaslak() { __T.calls.push({ t: Date.now(), ad }); throw new Error("SAHTE PAKET: " + ad + " uygulanmadi (danisman harness)"); };
const RouteConfig = new Proxy({}, { get: (_, ad) => (typeof ad === 'string' ? __taslak('RouteConfig.' + ad) : undefined) });
${taslak.map((a) => `const ${a} = __taslak(${JSON.stringify(a)});`).join('\n')}
${sinif}
export { ${adlar.join(', ')} };
`;

fs.rmSync(HEDEF, { recursive: true, force: true });
fs.mkdirSync(path.join(HEDEF, 'dist'), { recursive: true });
fs.writeFileSync(path.join(HEDEF, 'dist', 'index.js'), cikti);
fs.writeFileSync(path.join(HEDEF, 'dist', 'legacy.js'),
  `import { TikTokLiveConnection } from "./index.js";
const t = (ad) => () => { throw new Error("SAHTE legacy: " + ad); };
class WebcastPushConnection extends TikTokLiveConnection {}
const getEventAttributes = t('getEventAttributes'), getPreferredPictureFormat = t('getPreferredPictureFormat'), getTopViewerAttributes = t('getTopViewerAttributes'), mapBadges = t('mapBadges'), simplifyObject = t('simplifyObject');
export { WebcastPushConnection, getEventAttributes, getPreferredPictureFormat, getTopViewerAttributes, mapBadges, simplifyObject };
`);
fs.writeFileSync(path.join(HEDEF, 'package.json'), JSON.stringify({
  name: pkg.name, version: pkg.version, description: 'SAHTE — danisman harness',
  main: pkg.main, type: pkg.type, exports: { '.': { default: './dist/index.js' }, './legacy': { default: './dist/legacy.js' }, './package.json': './package.json' },
  engines: pkg.engines,
}, null, 2));
console.log(`sahte paket: ${HEDEF}  (surum ${pkg.version}, ${adlar.length} export; ${taslak.length} taslak, ${GERCEK.size} gercek/uygulanmis)`);
console.log('NOT: gercek paket ayrica `export * from "tiktok-live-proto/v3"` yapiyor; sahtede YOK.');
