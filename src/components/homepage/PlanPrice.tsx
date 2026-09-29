interface PlanPriceProps {
  amount: string;
  period: string;
  note: string;
}

export function PlanPrice({ amount, period, note }: PlanPriceProps) {
  return (
    <div className="mb-6">
      <p className="mb-1.5 flex items-baseline justify-center gap-1 md:justify-start">
        <span className="text-5xl font-extrabold tracking-tight">{amount}</span>
        <span className="text-muted-foreground">{period}</span>
      </p>
      <p className="text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
