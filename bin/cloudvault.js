#!/usr/bin/env node

"use strict";

const path = require("path");
const fs = require("fs");
const { randomBytes } = require("crypto");

const MIN_NODE_MAJOR = 24;
const nodeVersion = process.versions.node;
const major = parseInt(nodeVersion.split(".")[0], 10);
if (major < MIN_NODE_MAJOR) {
  console.error(
    `CloudVault requires Node.js ${MIN_NODE_MAJOR}+ (found v${nodeVersion}).`
  );
  process.exit(1);
}

const standaloneDir = path.join(__dirname, "..", "build", "standalone");

if (!fs.existsSync(path.join(standaloneDir, "server.js"))) {
  console.error(
    "Error: standalone build not found. Ensure the package was built correctly."
  );
  process.exit(1);
}

const dataDir = process.env.CLOUDVAULT_DATA_DIR || path.join(require("os").homedir(), ".cloudvault");

if (!process.env.PORT) process.env.PORT = "3000";
if (!process.env.STORAGE_DIR) process.env.STORAGE_DIR = path.join(dataDir, "uploads");
if (!process.env.DB_PATH) process.env.DB_PATH = path.join(dataDir, "cloudvault.db");

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "CHANGE_ME_TO_RANDOM_SECRET") {
  process.env.SESSION_SECRET = randomBytes(32).toString("hex");
}

fs.mkdirSync(process.env.STORAGE_DIR, { recursive: true });
fs.mkdirSync(path.dirname(process.env.DB_PATH), { recursive: true });

const isFirstRun = !fs.existsSync(process.env.DB_PATH);
const port = process.env.PORT;

function getLanIp() {
  const os = require("os");
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

const lanIp = getLanIp();

console.log("");
console.log("  CloudVault v" + require(path.join(standaloneDir, "package.json")).version);
console.log("  http://localhost:" + port);
if (lanIp) {
  console.log("  http://" + lanIp + ":" + port);
}
if (isFirstRun) {
  console.log("  First run — admin credentials will be printed below.");
}
console.log("");

require(path.join(standaloneDir, "server.js"));
