import { handleLocalSearch } from '../../server/onnuri/localSearch.mjs';

export default async function handler(request, response) {
  return handleLocalSearch(request, response);
}
