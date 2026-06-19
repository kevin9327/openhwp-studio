const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const serviceWorkerPath = path.join(root, "service-worker.js");
const serviceWorker = fs.existsSync(serviceWorkerPath) ? fs.readFileSync(serviceWorkerPath, "utf8") : "";

const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const selectorIds = [...app.matchAll(/\$\("([^"]+)"\)/g)]
  .map((match) => match[1])
  .filter((selector) => /^#[A-Za-z][\w-]*$/.test(selector))
  .map((selector) => selector.slice(1));

const missingIds = [...new Set(selectorIds)].filter((id) => !htmlIds.has(id));
if (missingIds.length) {
  console.error(`Missing DOM ids referenced by app.js: ${missingIds.join(", ")}`);
  process.exitCode = 1;
}

const functionNames = new Set([...app.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1]));
const constNames = new Set([...app.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=/g)].map((match) => match[1]));
const listenerCallbacks = [...app.matchAll(/addEventListener\([^,]+,\s*([A-Za-z_$][\w$]*)\s*\)/g)].map((match) => match[1]);
const missingCallbacks = [...new Set(listenerCallbacks)].filter((name) => !functionNames.has(name) && !constNames.has(name));
if (missingCallbacks.length) {
  console.error(`Missing event callbacks referenced by app.js: ${missingCallbacks.join(", ")}`);
  process.exitCode = 1;
}

const localAssets = [
  ...[...html.matchAll(/(?:href|src)="\.\/([^"]+)"/g)].map((match) => match[1]),
  ...[...app.matchAll(/fetch\("\.\/([^"]+)"\)/g)].map((match) => match[1]),
  ...[...serviceWorker.matchAll(/"\.\/([^"]+)"/g)].map((match) => match[1]),
];
const missingAssets = localAssets.filter((asset) => !fs.existsSync(path.join(root, asset)));
if (missingAssets.length) {
  console.error(`Missing local assets referenced by index.html: ${missingAssets.join(", ")}`);
  process.exitCode = 1;
}

if (!html.includes("install-app-button")) {
  console.error("Missing PWA install buttons in index.html");
  process.exitCode = 1;
}

if (!app.includes("navigator.serviceWorker.register(\"./service-worker.js\")")) {
  console.error("Missing service worker registration in app.js");
  process.exitCode = 1;
}

if (!serviceWorker.includes("openhwp-studio-") || !serviceWorker.includes("samples/openhwp-broken-rel.hwpx")) {
  console.error("Missing expected app-shell cache entries in service-worker.js");
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log("Static app contract OK");
}
