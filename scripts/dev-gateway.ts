import http from 'node:http';
import * as HttpProxy from 'http-proxy'; 
// Note: We use 'HttpProxy' as the namespace, then create via '.createProxyServer'

const BOT_PORT = 8686;
const FRONTEND_PORT = 5174;
const PROXY_PORT = 3000;

// Create the proxy instance
// @ts-ignore - sometimes the type definition export differs from runtime
const proxy = (HttpProxy.default || HttpProxy).createProxyServer({ ws: true }); 

const server = http.createServer((req, res) => {
  const url = req.url || '';

  if (url.startsWith('/bot/webhook')) {
    console.log(`🤖 Bot: ${url}`);
    proxy.web(req, res, { target: `http://localhost:${BOT_PORT}` }, (err) => {
        console.error('Bot Proxy Error:', err);
    });
  } else {
    proxy.web(req, res, { target: `http://localhost:${FRONTEND_PORT}` }, (err) => {
        console.error('Frontend Proxy Error:', err);
    });
  }
});

server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head, { target: `http://localhost:${FRONTEND_PORT}` });
});

console.log(`🚀 Gateway running at http://localhost:${PROXY_PORT}`);
server.listen(PROXY_PORT);