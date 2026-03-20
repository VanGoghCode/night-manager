import { loadWebPublicEnvironment } from "@night-manager/config";
import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME } from "../../../../lib/auth";

interface LoginSuccessResponse {
  accessToken: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
  };
}

interface ApiErrorResponse {
  message?: string;
}

export async function POST(request: Request) {
  const env = loadWebPublicEnvironment();
  const body = await request.json();

  const apiResponse = await fetch(new URL("/auth/login", env.NEXT_PUBLIC_API_BASE_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!apiResponse.ok) {
    const errorBody = (await apiResponse.json().catch(() => ({}))) as ApiErrorResponse;

    return NextResponse.json(
      {
        message: errorBody.message ?? "Login failed."
      },
      {
        status: apiResponse.status
      }
    );
  }

  const payload = (await apiResponse.json()) as LoginSuccessResponse;
  const response = NextResponse.json({
    user: payload.user,
    expiresAt: payload.expiresAt
  });

  response.cookies.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: payload.accessToken,
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(payload.expiresAt)
  });

  return response;
}
