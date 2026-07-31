import { POST as subscribe } from "@/app/api/subscribe/route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return subscribe(request);
}
