import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CustomerStatusBadge } from "@/components/status-badge";
import { formatEnum } from "@/lib/format";
import type { CustomerListItem } from "./types";

export function CustomerMobileList({
  customers,
}: {
  customers: CustomerListItem[];
}) {
  return (
    <ul className="space-y-3 md:hidden" role="list">
      {customers.map((customer) => (
        <li key={customer.id}>
          <Link
            href={`/customers/${customer.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm transition-colors hover:border-primary/25 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <div className="min-w-0 space-y-1.5">
              <p className="truncate font-medium text-foreground">
                {customer.firstName} {customer.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {customer.age} · {customer.city} ·{" "}
                {formatEnum(customer.maritalStatus)}
              </p>
              <CustomerStatusBadge status={customer.status} />
            </div>
            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span className="sr-only">View profile</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}