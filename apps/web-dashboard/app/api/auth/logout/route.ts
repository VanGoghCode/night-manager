import { loadWebPublicEnvironment } from "@night-manager/config";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME } from "../../../../lib/auth";

export async function POST() {
  const env = loadWebPublicEnvironment();
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;

  if (token) {
    await fetch(new URL("/auth/logout", env.NEXT_PUBLIC_API_BASE_URL), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    }).catch(() => undefined);
  }

  const response = NextResponse.json({
    success: true
  });

  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });

  return response;
}
