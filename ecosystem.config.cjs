module.exports = {
  apps: [
    {
      name: "lyalina-frontend",
      script: "scripts/pm2-app.js",
      args: "pnpm.cmd dev --port 3000",
      cwd: "D:\\ERP-Projects\\lyalina-ads\\frontend",
      autorestart: true,
      max_restarts: 5,
      kill_timeout: 5000,
    },
    {
      name: "gemini-proxy",
      script: "scripts/pm2-app.js",
      args: "npx.cmd wrangler dev --port 8787",
      cwd: "D:\\ERP-Projects\\lyalina-ads\\gemini-proxy",
      autorestart: true,
      max_restarts: 5,
      kill_timeout: 5000,
    },
  ],
};