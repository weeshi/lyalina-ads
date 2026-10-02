const path = require("path");

const WRAPPER_PATH = path.join(__dirname, "scripts", "pm2-app.js");

module.exports = {
  apps: [
    {
      name: "lyalina-frontend",
      script: WRAPPER_PATH,
      args: "pnpm.cmd dev --port 3000",
      cwd: path.join(__dirname, "frontend"),
      autorestart: true,
      max_restarts: 5,
      kill_timeout: 5000,
    },
    {
      name: "gemini-proxy",
      script: WRAPPER_PATH,
      args: "npx.cmd wrangler dev --port 8787",
      cwd: path.join(__dirname, "gemini-proxy"),
      autorestart: true,
      max_restarts: 5,
      kill_timeout: 5000,
    },
  ],
};