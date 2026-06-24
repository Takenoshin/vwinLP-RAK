#!/usr/bin/env node
import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const markets = [
  { id: "my", port: 4174 },
  { id: "sg", port: 4175 },
  { id: "vn", port: 4176 },
];

const children = [];

for (const { id, port } of markets) {
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
