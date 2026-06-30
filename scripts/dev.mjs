#!/usr/bin/env node
import { readFileSync } from "fs";
import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createServer } from "net";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const config = JSON.parse(readFileSync(join(root, "config", "site.json"), "utf8"));

const defaultPorts = {
  my: 4174,
  sg: 4175,
  vn: 4176,
};

const markets = Object.keys(config.markets).map((id) => ({
  id,
  port: defaultPorts[id] || 4176,
}));

const children = [];

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const server = createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port);
  });

for (const { id, port } of markets) {
  if (!(await isPortAvailable(port))) {
    console.log(`${id.toUpperCase()}: http://127.0.0.1:${port}/ (already running)`);
    continue;
  }

  const cwd = join(root, "dist", id);
  const child = spawn("python3", ["-m", "http.server", String(port)], {
    cwd,
    stdio: "inherit",
  });
  children.push(child);
  console.log(`${id.toUpperCase()}: http://127.0.0.1:${port}/`);
}

const shutdown = () => {
  children.forEach((child) => child.kill("SIGTERM"));
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
