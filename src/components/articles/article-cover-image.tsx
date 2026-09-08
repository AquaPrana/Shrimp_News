/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { isRemoteArticleImageUrl } from "@/lib/validation";

const FALLBACK = "/images/articles/ArticleImage.jpeg";

type FitMode = "cover" | "contain";

type FillProps = {
  src: string | null | undefined;
  alt: string;
  fill: true;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Defaults to cover. Use contain for small thumbnails that must show the full cover. */
  fit?: FitMode;
};

type FixedProps = {
  src: string | null | undefined;
  alt: string;
  fill?: false;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fit?: FitMode;
};

/**
 * Renders local public paths with next/image and remote CDN URLs with a
 * plain <img>, so Hostinger/CDN covers work without remotePatterns gaps.
 */
export function ArticleCoverImage(props: FillProps | FixedProps) {
  const resolved = props.src?.trim() || FALLBACK;
  const remote = isRemoteArticleImageUrl(resolved);
  const fit: FitMode = props.fit === "contain" ? "contain" : "cover";
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  if (props.fill) {
    if (remote) {
      return (
        // Remote CDN/Hostinger URLs — avoid Next image host allowlist failures.
        <img
          src={resolved}
          alt={props.alt}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: fit,
            objectPosition: "center center",
          }}
          className={`absolute inset-0 h-full w-full ${fitClass} object-center ${props.className || ""}`}
        />
      );
    }

    return (
      <Image
        src={resolved}
        alt={props.alt}
        fill
        style={{
          objectFit: fit,
          objectPosition: "center center",
        }}
        sizes={props.sizes}
        priority={props.priority}
        className={`${fitClass} object-center ${props.className || ""}`}
      />
    );
  }

  if (remote) {
    return (
      <img
        src={resolved}
        alt={props.alt}
        width={props.width}
        height={props.height}
        style={{
          width: "100%",
          height: "100%",
          objectFit: fit,
          objectPosition: "center center",
          display: "block",
        }}
        className={`${fitClass} object-center ${props.className || ""}`}
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={props.alt}
      width={props.width}
      height={props.height}
      sizes={props.sizes}
      priority={props.priority}
      style={{
        width: "100%",
        height: "100%",
        objectFit: fit,
        objectPosition: "center center",
        display: "block",
      }}
      className={`${fitClass} object-center ${props.className || ""}`}
    />
  );
}
