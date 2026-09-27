const { spawn } = require("node:child_process");

const command = process.argv[2];
const args = process.argv.slice(3);

if (!command) {
  console.error("usage: node pm2-app.js <command> [args...]");
  process.exit(1);
}

const child = spawn(command, args, {
  shell: true,
  stdio: "inherit",
  windowsHide: true,
});

child.on("close", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});

child.on("error", (err) => {
  console.error("[pm2-app] spawn error:", err.message);
  process.exitCode = 1;
});