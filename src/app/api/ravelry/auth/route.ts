import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.RAVELRY_CLIENT_ID;
  const redirectUri = process.env.RAVELRY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Ravelry not configured" },
      { status: 500 }
    );
  }

  const authUrl = new URL("https://www.ravelry.com/oauth2/auth");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "offline");

  return NextResponse.redirect(authUrl.toString());
}
