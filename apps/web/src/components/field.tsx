export function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const display =
    value === undefined || value === null || value === ""
      ? "Not provided"
      : String(value);

  return (
    <div className="min-w-0">
      <dt className="tdc-label">{label}</dt>
      <dd
        className={
          display === "Not provided"
            ? "mt-0.5 text-sm italic text-muted-foreground/80"
            : "mt-0.5 text-sm text-foreground"
        }
      >
        {display}
      </dd>
    </div>
  );
}