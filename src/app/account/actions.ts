"use server";

import { redirect } from "next/navigation";
import { websiteEarnings } from "@/lib/crm/earnings";
import { websiteClub } from "@/lib/crm/fixtures";
import {
  clearMemberSession,
  readMemberSession,
  writeMemberSession,
} from "@/lib/crm/session";

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

export async function saveOwnDetails(formData: FormData) {
  const session = await readMemberSession();
  if (!session) {
    redirect("/account");
  }

  const result = websiteClub().updateOwnDetails(session, Number(formData.get("id")), {
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    companyName: String(formData.get("companyName") ?? ""),
  });
  if (result.outcome !== "updated") {
    redirect("/account?error=denied");
  }

  await writeMemberSession(result.session);
  redirect("/account");
}

export async function earnOfferAtPlace(formData: FormData) {
  const session = await readMemberSession();
  if (!session) {
    redirect("/account");
  }

  const place = String(formData.get("place") ?? "");
  const result = websiteEarnings().earn(
    websiteClub(),
    { role: "member", account: session.account },
    Number(formData.get("memberId")),
    place,
  );
  if (result.outcome !== "earned") {
    redirect(`/account/partners?error=denied&place=${encodeURIComponent(place)}`);
  }
  redirect(`/account/partners?earned=${encodeURIComponent(place)}`);
}
