import { saveOwnDetails } from "@/app/account/actions";
import type { MemberAccount } from "@/lib/crm/access";

export function OwnDetailsForm({ member }: { member: MemberAccount }) {
  return (
    <form action={saveOwnDetails} className="mt-8 space-y-4">
      <input type="hidden" name="id" value={member.id} />
      <div>
        <label htmlFor="email" className="text-sm text-cream/80">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={member.email}
          className="mt-2 w-full rounded-xl border border-gold/30 bg-ink px-3 py-3 text-cream"
        />
      </div>
      <div>
        <label htmlFor="phone" className="text-sm text-cream/80">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={member.phone ?? ""}
          className="mt-2 w-full rounded-xl border border-gold/30 bg-ink px-3 py-3 text-cream"
        />
      </div>
      <div>
        <label htmlFor="companyName" className="text-sm text-cream/80">
          Company
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          autoComplete="organization"
          defaultValue={member.companyName ?? ""}
          className="mt-2 w-full rounded-xl border border-gold/30 bg-ink px-3 py-3 text-cream"
        />
      </div>
      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-saffron px-6 text-sm font-semibold text-ink hover:bg-gold"
      >
        Save
      </button>
    </form>
  );
}
