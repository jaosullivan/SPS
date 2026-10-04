"use client";

import { useActionState } from "react";
import { signInToAccount } from "@/app/account/actions";

export function AccountSignInForm() {
  const [state, action, pending] = useActionState(signInToAccount, {
    error: null,
  });

  return (
    <form
      action={action}
      className="mt-8 space-y-4"
      aria-describedby={state.error ? "account-login-error" : undefined}
    >
      <div>
        <label htmlFor="email" className="text-sm text-cream/80">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-2 w-full rounded-xl border border-gold/30 bg-ink px-3 py-3 text-cream"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm text-cream/80">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-xl border border-gold/30 bg-ink px-3 py-3 text-cream"
        />
      </div>
      {state.error ? (
        <p
          id="account-login-error"
          role="alert"
          className="rounded-xl border border-bauhinia/40 bg-bauhinia/10 px-3 py-2 text-sm text-cream"
        >
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-saffron px-6 text-sm font-semibold text-ink hover:bg-gold disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
