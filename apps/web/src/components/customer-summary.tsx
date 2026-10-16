type Props = {
  total: number;
  ready: number;
  suggested: number;
};

export function CustomerSummary({ total, ready, suggested }: Props) {
  return (
    <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
      <span>
        <strong className="font-semibold text-foreground">{total}</strong>{" "}
        assigned
      </span>
      <span className="hidden text-border sm:inline" aria-hidden>
        ·
      </span>
      <span>
        <strong className="font-semibold text-foreground">{ready}</strong> ready
        on this page
      </span>
      <span className="hidden text-border sm:inline" aria-hidden>
        ·
      </span>
      <span>
        <strong className="font-semibold text-foreground">{suggested}</strong>{" "}
        with suggestions on this page
      </span>
    </div>
  );
}