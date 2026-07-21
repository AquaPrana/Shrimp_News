import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function extensionFromName(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

function getUploadConfig() {
  const endpoint = process.env.HOSTINGER_UPLOAD_ENDPOINT?.trim();
  const secret = process.env.HOSTINGER_UPLOAD_SECRET?.trim();
  if (!endpoint || !secret) {
    return {
      ok: false as const,
      error: "Image upload is not configured on the server.",
    };
  }
  return { ok: true as const, endpoint, secret };
}

export async function POST(request: Request) {
  if (!await verifyAdminApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const config = getUploadConfig();
  if (!config.ok) {
    return NextResponse.json({ error: config.error }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please choose an image file." }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "The selected file is empty." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 400 });
    }

    const extension = extensionFromName(file.name);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: "Only JPG, JPEG, PNG, and WebP images are allowed." },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, JPEG, PNG, and WebP images are allowed." },
        { status: 400 },
      );
    }

    const forward = new FormData();
    forward.append("file", file, file.name);

    const upstream = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "X-Upload-Secret": config.secret,
      },
      body: forward,
      cache: "no-store",
    });

    let payload: {
      success?: boolean;
      url?: string;
      error?: string;
      filename?: string;
    } = {};
    try {
      payload = await upstream.json() as {
        success?: boolean;
        url?: string;
        error?: string;
        filename?: string;
      };
    } catch {
      return NextResponse.json(
        { error: "Upload service returned an invalid response." },
        { status: 502 },
      );
    }

    if (!upstream.ok || payload.success !== true || !payload.url) {
      return NextResponse.json(
        { error: payload.error || "Image upload failed. Please try again." },
        { status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502 },
      );
    }

    return NextResponse.json({
      url: payload.url,
      filename: payload.filename ?? null,
      message: "Upload successful.",
    });
  } catch (error) {
    console.error("[admin-upload]", error);
    return NextResponse.json(
      { error: "Image upload failed. Please try again." },
      { status: 500 },
    );
  }
}
