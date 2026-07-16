import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export function Card({
  className = "",
  hover = true,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-[28px] border border-slate-800/80 bg-slate-950/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_80px_rgba(2,8,23,0.55)] backdrop-blur-sm ${hover ? "transition-transform duration-200 hover:-translate-y-1 hover:border-cyan-400/40" : ""} ${className}`}
      {...props}
    />
  );
}
