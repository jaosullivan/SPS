import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  openAdminSession,
  sealAdminSession,
  type AdminSession,
} from "@/lib/crm/access";

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
