"use server";

import { redirect } from "next/navigation";
import { clubDirectory } from "@/lib/crm/fixtures";
import { clearAdminSession, writeAdminSession } from "@/lib/crm/session";

export async function signInToCrm(
  _previous: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = clubDirectory().signIn(email, password);
  if (result.outcome !== "signedIn") {
    return { error: "Incorrect email or password" };
  }

  await writeAdminSession(result.session);
  redirect("/crm");
}

export async function signOutOfCrm() {
  await clearAdminSession();
  redirect("/crm/login");
}
