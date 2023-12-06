const SmeeClient = require("smee-client");

const smee = new SmeeClient({
  source: process.env.WEBHOOK_PROXY_URL,
  target: "http://localhost:3000/api/webhooks",
  logger: console,
});

smee.start();
