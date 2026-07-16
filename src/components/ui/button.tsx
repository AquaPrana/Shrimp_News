import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-full border text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses = {
  primary:
    "border-cyan-400/40 bg-cyan-500 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:bg-cyan-400",
  secondary:
    "border-slate-700/80 bg-slate-900/80 text-slate-100 hover:border-cyan-400/50 hover:bg-slate-800",
  ghost:
    "border-transparent bg-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white",
};

const sizeClasses = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}
