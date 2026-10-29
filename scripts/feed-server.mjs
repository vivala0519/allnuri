import { createServer } from 'node:http';
import { handleLocalSearch } from '../server/onnuri/localSearch.mjs';

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== '/api/onnuri/products') {
    res.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  await handleLocalSearch(req, res);
}).listen(8787, '127.0.0.1', () => console.log('Personal search API on http://127.0.0.1:8787'));
