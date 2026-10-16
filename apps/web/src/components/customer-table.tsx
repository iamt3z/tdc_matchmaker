import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CustomerStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEnum } from "@/lib/format";
import type { CustomerListItem } from "./types";

export function CustomerTable({
  customers,
}: {
  customers: CustomerListItem[];
}) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Marital status</TableHead>
            <TableHead>Journey</TableHead>
            <TableHead className="pr-5 text-right">
              <span className="sr-only">Open</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id} className="group">
              <TableCell className="pl-5 font-medium">
                <Link
                  href={`/customers/${customer.id}`}
                  className="text-foreground hover:text-primary hover:underline"
                >
                  {customer.firstName} {customer.lastName}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {customer.age}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {customer.city}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatEnum(customer.maritalStatus)}
              </TableCell>
              <TableCell>
                <CustomerStatusBadge status={customer.status} />
              </TableCell>
              <TableCell className="pr-5 text-right">
                <Button variant="ghost" size="sm">
                  <Link href={`/customers/${customer.id}`}>
                    View
                    <ChevronRight className="ml-1 size-3.5" aria-hidden />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}