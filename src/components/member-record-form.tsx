import { saveMemberRecord } from "@/app/crm/actions";
import type { MemberAccount } from "@/lib/crm/access";

const statuses = ["active", "lapsed", "complimentary"] as const;

export function MemberRecordForm({ member }: { member: MemberAccount }) {
  const fieldId = (name: string) => `${name}-${member.id}`;

  return (
    <form
      key={`${member.id}-${member.firstName}-${member.lastName}-${member.email}-${member.phone ?? ""}-${member.companyName ?? ""}-${member.status}-${member.greenCardNumber ?? ""}`}
      action={saveMemberRecord}
      className="rounded-2xl border border-gold/20 bg-forest/30 p-6"
    >
      <h2 className="font-display text-3xl text-cream">
        {member.firstName} {member.lastName}
      </h2>
      <input type="hidden" name="id" value={member.id} />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field id={fieldId("firstName")} label="First name" name="firstName" defaultValue={member.firstName} required />
        <Field id={fieldId("lastName")} label="Last name" name="lastName" defaultValue={member.lastName} required />
        <Field id={fieldId("email")} label="Email" name="email" type="email" defaultValue={member.email} required />
        <Field id={fieldId("phone")} label="Phone" name="phone" defaultValue={member.phone ?? ""} />
        <Field id={fieldId("company")} label="Company" name="companyName" defaultValue={member.companyName ?? ""} />
        <Field id={fieldId("greenCard")} label="Green card" name="greenCardNumber" defaultValue={member.greenCardNumber ?? ""} />
        <div>
          <label htmlFor={fieldId("status")} className="text-sm text-cream/80">
            Status
          </label>
          <select
            id={fieldId("status")}
            name="status"
            defaultValue={member.status}
            className="mt-2 w-full rounded-xl border border-gold/30 bg-ink px-3 py-3 text-cream"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        className="mt-5 inline-flex min-h-11 items-center rounded-full bg-saffron px-5 text-sm font-semibold text-ink hover:bg-gold"
      >
        Save
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm text-cream/80">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="mt-2 w-full rounded-xl border border-gold/30 bg-ink px-3 py-3 text-cream"
      />
    </div>
  );
}