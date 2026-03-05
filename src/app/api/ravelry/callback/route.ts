import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const clientId = process.env.RAVELRY_CLIENT_ID!;
  const clientSecret = process.env.RAVELRY_CLIENT_SECRET!;
  const redirectUri = process.env.RAVELRY_REDIRECT_URI!;

  // Exchange code for token
  const tokenRes = await fetch("https://www.ravelry.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL("/dashboard?ravelry=error", request.url)
    );
  }

  const tokenData = await tokenRes.json();

  // Store token in a cookie (httpOnly for security)
  const response = NextResponse.redirect(
    new URL("/dashboard?ravelry=connected", request.url)
  );
  response.cookies.set("ravelry_token", tokenData.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: tokenData.expires_in ?? 3600,
    path: "/",
  });

  return response;
}
