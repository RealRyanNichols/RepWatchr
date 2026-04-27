import { handleFarettaCollectRequest } from "@/lib/faretta-api";

export async function POST(request: Request) {
  return handleFarettaCollectRequest(request);
}
