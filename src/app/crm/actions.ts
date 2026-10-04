"use server";

import { redirect } from "next/navigation";
import { clubDirectory, websiteClub } from "@/lib/crm/fixtures";
import { clearAdminSession, readAdminSession, writeAdminSession } from "@/lib/crm/session";

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

export async function saveMemberRecord(formData: FormData) {
  const session = await readAdminSession();
  const memberId = Number(formData.get("id"));
  const result = websiteClub().updateMember(
    session ? { role: "admin", session } : { role: "anonymous" },
    memberId,
    {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      companyName: String(formData.get("companyName") ?? ""),
      status: String(formData.get("status") ?? ""),
      greenCardNumber: String(formData.get("greenCardNumber") ?? ""),
    },
  );
  if (result.outcome !== "updated") {
    redirect(`/crm/members?error=denied&member=${memberId}`);
  }
  redirect("/crm/members");
}
