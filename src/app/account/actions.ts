"use server";

import { redirect } from "next/navigation";
import { websiteClub } from "@/lib/crm/fixtures";
import { clearMemberSession, writeMemberSession } from "@/lib/crm/session";

export async function signInToAccount(
  _previous: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = websiteClub().signInAsMember(email, password);
  if (result.outcome !== "signedIn") {
    return { error: "Incorrect email or password" };
  }

  await writeMemberSession(result.session);
  redirect("/account");
}

export async function signOutOfAccount() {
  await clearMemberSession();
  redirect("/account");
}
