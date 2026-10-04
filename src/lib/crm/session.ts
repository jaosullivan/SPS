import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  MEMBER_SESSION_COOKIE,
  openAdminSession,
  openMemberSession,
  sealAdminSession,
  sealMemberSession,
  type AdminSession,
  type MemberSession,
} from "@/lib/crm/access";
import { websiteClub } from "@/lib/crm/fixtures";

const COOKIE_PATH = "/crm";
const DAY_SECONDS = 60 * 60 * 24;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: COOKIE_PATH,
    maxAge,
  };
}

export async function readAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return openAdminSession(store.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function writeAdminSession(session: AdminSession) {
  const store = await cookies();
  store.set(
    ADMIN_SESSION_COOKIE,
    sealAdminSession(session),
    cookieOptions(DAY_SECONDS),
  );
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, "", cookieOptions(0));
}

function memberCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function readMemberSession(): Promise<MemberSession | null> {
  const store = await cookies();
  return openMemberSession(store.get(MEMBER_SESSION_COOKIE)?.value, websiteClub());
}

export async function writeMemberSession(session: MemberSession) {
  const store = await cookies();
  store.set(
    MEMBER_SESSION_COOKIE,
    sealMemberSession(session),
    memberCookieOptions(DAY_SECONDS),
  );
}

export async function clearMemberSession() {
  const store = await cookies();
  store.set(MEMBER_SESSION_COOKIE, "", memberCookieOptions(0));
}
