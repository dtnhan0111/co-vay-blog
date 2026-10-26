import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  kicker,
  action,
  className,
}: {
  title: string;
  kicker?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div>
        {kicker && <p className="mb-0.5 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{kicker}</p>}
        <h2 className="text-2xl leading-none font-semibold sm:text-[1.7rem]">{title}</h2>
      </div>
      {action}
    </div>
  );
}
