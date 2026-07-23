import { POST as uploadImage } from "@/app/api/admin/upload/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return uploadImage(request);
}
