import { NextResponse } from "next/server";
import { verifyAdminApi } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const UPLOAD_TIMEOUT_MS = 30_000;

function jsonError(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status });
}

function extensionFromName(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

function getUploadConfig() {
  const endpoint = process.env.HOSTINGER_UPLOAD_ENDPOINT?.trim();
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
        "Image upload is not configured on the server. Please contact the website administrator.",
      code: "UPLOAD_NOT_CONFIGURED",
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
        "The image upload server address is invalid. Please contact the website administrator.",
      code: "UPLOAD_ENDPOINT_INVALID",
    };
  }

  if (endpointUrl.protocol !== "https:") {
    console.error("[admin-upload:configuration] Upload endpoint must use HTTPS.");
    return {
      ok: false as const,
      error:
        "The image upload server must use HTTPS. Please contact the website administrator.",
      code: "UPLOAD_ENDPOINT_INSECURE",
    };
  }

  return { ok: true as const, endpoint: endpointUrl.toString(), secret };
}

export async function POST(request: Request) {
  if (!await verifyAdminApi(request)) {
    return jsonError(
      "Your admin session has expired. Please sign in and try again.",
      "ADMIN_AUTH_REQUIRED",
      401,
    );
  }

  const config = getUploadConfig();
  if (!config.ok) {
    return jsonError(config.error, config.code, 503);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return jsonError(
      "The upload request must contain an image file.",
      "INVALID_MULTIPART_REQUEST",
      400,
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("Please choose an image file.", "FILE_REQUIRED", 400);
    }

    if (file.size <= 0) {
      return jsonError("The selected file is empty.", "FILE_EMPTY", 400);
    }

    if (file.size > MAX_BYTES) {
      return jsonError("Image must be 5 MB or smaller.", "FILE_TOO_LARGE", 400);
    }

    const extension = extensionFromName(file.name);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return jsonError(
        "Only JPG, JPEG, PNG, and WebP images are allowed.",
        "FILE_TYPE_NOT_ALLOWED",
        400,
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return jsonError(
        "Only JPG, JPEG, PNG, and WebP images are allowed.",
        "FILE_TYPE_NOT_ALLOWED",
        400,
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
      return jsonError(
        "The image upload server returned an invalid response. Please try again.",
        "UPLOAD_INVALID_RESPONSE",
        502,
      );
    }

    if (!upstream.ok || payload.success !== true || !payload.url) {
      console.error("[admin-upload:upstream]", {
        status: upstream.status,
        success: payload.success === true,
        hasUrl: Boolean(payload.url),
        error: payload.error,
      });
      if (upstream.status === 401 || upstream.status === 403) {
        return jsonError(
          "The image upload server rejected its credentials. Please contact the website administrator.",
          "UPLOAD_SERVER_UNAUTHORIZED",
          502,
        );
      }
      return jsonError(
        payload.error || "Image upload failed. Please try again.",
        "UPLOAD_SERVER_ERROR",
        upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502,
      );
    }

    let publicUrl: URL;
    try {
      publicUrl = new URL(payload.url);
    } catch {
      return jsonError(
        "The image upload server returned an invalid image URL.",
        "UPLOAD_URL_INVALID",
        502,
      );
    }

    if (publicUrl.protocol !== "https:") {
      return jsonError(
        "The image upload server returned an invalid image URL.",
        "UPLOAD_URL_INVALID",
        502,
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
    return jsonError(
      timedOut
        ? "The image upload server took too long to respond. Please try again."
        : "The image upload server is unavailable. Please try again shortly.",
      timedOut ? "UPLOAD_TIMEOUT" : "UPLOAD_SERVER_UNAVAILABLE",
      502,
    );
  }
}
