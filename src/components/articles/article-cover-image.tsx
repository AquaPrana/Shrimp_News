/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { isRemoteArticleImageUrl } from "@/lib/validation";

const FALLBACK = "/images/articles/ArticleImage.jpeg";

type FillProps = {
  src: string | null | undefined;
  alt: string;
  fill: true;
  className?: string;
  sizes?: string;
  priority?: boolean;
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
};

/**
 * Renders local public paths with next/image and remote CDN URLs with a
 * plain <img>, so Hostinger/CDN covers work without remotePatterns gaps.
 */
export function ArticleCoverImage(props: FillProps | FixedProps) {
  const resolved = props.src?.trim() || FALLBACK;
  const remote = isRemoteArticleImageUrl(resolved);

  if (props.fill) {
    if (remote) {
      return (
        // Remote CDN/Hostinger URLs — avoid Next image host allowlist failures.
        <img
          src={resolved}
          alt={props.alt}
          className={`absolute inset-0 h-full w-full ${props.className || ""}`}
        />
      );
    }

    return (
      <Image
        src={resolved}
        alt={props.alt}
        fill
        sizes={props.sizes}
        priority={props.priority}
        className={props.className}
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
        className={props.className}
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
      className={props.className}
    />
  );
}
