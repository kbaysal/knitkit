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

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "patternstore-read",
    state: userId,
  });

  return NextResponse.redirect(
    `https://www.ravelry.com/oauth2/auth?${params.toString()}`
  );
}
