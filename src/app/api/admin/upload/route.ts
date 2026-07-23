import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const UPLOAD_TIMEOUT_MS = 30_000;

function extensionFromName(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

function getUploadConfig() {
  const endpoint = [
    process.env.HOSTINGER_UPLOAD_ENDPOINT,
    process.env.HOSTINGER_UPLOAD_URL,
    process.env.UPLOAD_API_URL,
    process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL,
    process.env.NEXT_PUBLIC_UPLOAD_URL,
  ]
    .find((value) => value?.trim())
    ?.trim();
  const secret = process.env.HOSTINGER_UPLOAD_SECRET?.trim();

  if (!endpoint || !secret) {
    console.error("[admin-upload:configuration]", {
      endpointConfigured: Boolean(endpoint),
      secretConfigured: Boolean(secret),
      expected:
        "HOSTINGER_UPLOAD_ENDPOINT and HOSTINGER_UPLOAD_SECRET",
    });
    return {
      ok: false as const,
      error:
        "Image uploads are temporarily unavailable. Please contact the website administrator.",
    };
  }

  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    console.error("[admin-upload:configuration] Invalid upload endpoint URL.");
    return {
      ok: false as const,
      error:
        "Image uploads are temporarily unavailable. Please contact the website administrator.",
    };
  }

  if (endpointUrl.protocol !== "https:") {
    console.error("[admin-upload:configuration] Upload endpoint must use HTTPS.");
    return {
      ok: false as const,
      error:
        "Image uploads are temporarily unavailable. Please contact the website administrator.",
    };
  }

  return { ok: true as const, endpoint: endpointUrl.toString(), secret };
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
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
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
      console.error("[admin-upload:upstream]", {
        status: upstream.status,
        success: payload.success === true,
        hasUrl: Boolean(payload.url),
        error: payload.error,
      });
      const publicError =
        upstream.status === 401 || upstream.status === 403
          ? "Image uploads are temporarily unavailable. Please contact the website administrator."
          : payload.error || "Image upload failed. Please try again.";
      return NextResponse.json(
        { error: publicError },
        { status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502 },
      );
    }

    let publicUrl: URL;
    try {
      publicUrl = new URL(payload.url);
    } catch {
      return NextResponse.json(
        { error: "Upload service returned an invalid image URL." },
        { status: 502 },
      );
    }

    if (publicUrl.protocol !== "https:") {
      return NextResponse.json(
        { error: "Upload service returned an invalid image URL." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      url: publicUrl.toString(),
      filename: payload.filename ?? null,
      message: "Upload successful.",
    });
  } catch (error) {
    console.error("[admin-upload]", error);
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      {
        error: timedOut
          ? "The image upload server took too long to respond. Please try again."
          : "The image upload server is unavailable. Please try again shortly.",
      },
      { status: 502 },
    );
  }
}
