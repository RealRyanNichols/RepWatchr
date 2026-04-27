import { handleFarettaChatRequest } from "@/lib/faretta-api";

export async function POST(request: Request) {
  return handleFarettaChatRequest(request);
}
