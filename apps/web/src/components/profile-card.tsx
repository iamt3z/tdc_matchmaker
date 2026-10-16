import { SourceLabel } from "@/components/feedback";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Customer } from "@/lib/api/types";
import { formatEnum } from "@/lib/format";
import { Field } from "./field";

export function ProfileCard({ customer }: { customer: Customer }) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">Profile</CardTitle>
          <SourceLabel source="profile" />
        </div>
        <CardDescription>
          Personal details shared for matchmaking. Missing fields are marked
          honestly — they are not assumed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-medium text-foreground">Basics</h3>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Date of birth" value={customer.dateOfBirth} />
            <Field
              label="Height"
              value={customer.heightCm ? `${customer.heightCm} cm` : undefined}
            />
            <Field
              label="Marital status"
              value={formatEnum(customer.maritalStatus)}
            />
            <Field label="Email" value={customer.email} />
            <Field label="Phone" value={customer.phoneNumber} />
          </dl>
        </section>
        <Separator />
        <section>
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Education & work
          </h3>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="College"
              value={customer.education?.undergraduateCollege}
            />
            <Field
              label="Qualification"
              value={
                customer.education?.degree ??
                customer.education?.highestQualification
              }
            />
            <Field
              label="Company"
              value={customer.employment?.currentCompany}
            />
            <Field label="Role" value={customer.employment?.designation} />
            <Field
              label="Income"
              value={
                customer.employment?.annualIncome
                  ? `${customer.employment.annualIncome.amount.toLocaleString()} ${customer.employment.annualIncome.currency}`
                  : undefined
              }
            />
          </dl>
        </section>
        <Separator />
        <section>
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Family & preferences
          </h3>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Languages"
              value={customer.languagesKnown?.join(", ")}
            />
            <Field label="Religion" value={customer.religion} />
            <Field label="Community" value={customer.casteOrCommunity} />
            <Field label="Siblings" value={customer.family?.numberOfSiblings} />
            <Field
              label="Children"
              value={formatEnum(customer.wantsChildren)}
            />
            <Field
              label="Relocation"
              value={formatEnum(customer.openToRelocation)}
            />
            <Field label="Pets" value={formatEnum(customer.openToPets)} />
          </dl>
        </section>
        {customer.introduction && (
          <>
            <Separator />
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">
                Their words
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {customer.introduction}
              </p>
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}