// Local stand-in for the hosted home config: serves demo/home-config.json with CORS and no caching,
// so editing the file and pulling to refresh in the app shows the new order without a redeploy.
//   node scripts/serve-home-config.js [port]
// Then point the app at it, e.g. in .env.local: EXPO_PUBLIC_HOME_CONFIG_URL=http://localhost:8090/home-config.json
// (Android emulator: http://10.0.2.2:8090/home-config.json · phone on the same Wi-Fi: http://<PC IP>:8090/home-config.json)
const fs = require('fs');
const http = require('http');
const path = require('path');

const port = Number(process.argv[2]) || 8090;
const file = path.join(__dirname, '..', 'demo', 'home-config.json');

http
  .createServer((req, res) => {
    const headers = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };
    if (!req.url || !req.url.startsWith('/home-config.json')) {
      res.writeHead(404, headers).end('Not found');
      return;
    }
    fs.readFile(file, (err, body) => {
      if (err) {
        res.writeHead(500, headers).end(String(err));
        return;
      }
      res.writeHead(200, { ...headers, 'Content-Type': 'application/json' }).end(body);
    });
  })
  .listen(port, () => console.log(`Serving ${file} at http://localhost:${port}/home-config.json`));
