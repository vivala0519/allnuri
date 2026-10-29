import { handleLocalSearch } from '../../server/onnuri/localSearch.mjs';

export default async function handler(request, response) {
  const allowedOrigins = ['https://allnuri.apps.tossmini.com', 'https://allnuri.private-apps.tossmini.com'];
  if (allowedOrigins.includes(request.headers?.origin)) {
    response.setHeader('Access-Control-Allow-Origin', request.headers.origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  }
  if (request.method === 'OPTIONS') {
    response.statusCode = allowedOrigins.includes(request.headers?.origin) ? 204 : 403;
    response.end();
    return;
  }
  return handleLocalSearch(request, response);
}
