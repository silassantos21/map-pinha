import { cn } from "cn";

interface BadgeProps {
  count: number;
  max?: number;
  className?: string;
}

/** Badge numérico genérico (contador de notificações não lidas, Fase 7) —
 * não existia nenhum componente de badge reutilizável antes disso. */
export function Badge({ count, max = 9, className }: BadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "absolute -top-1 -right-1 flex min-w-[1.1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white",
        className,
      )}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}
