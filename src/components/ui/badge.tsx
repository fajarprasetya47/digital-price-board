type Tone = "default" | "success" | "danger" | "warn" | "inactive";

const toneStyles: Record<Tone, string> = {
  default: "bg-zinc-100 text-zinc-700",
  success: "bg-emerald-100 text-emerald-700",
  danger: "bg-red-100 text-red-700",
  warn: "bg-amber-100 text-amber-800",
  inactive: "bg-zinc-200 text-zinc-500",
};

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneStyles[tone]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}