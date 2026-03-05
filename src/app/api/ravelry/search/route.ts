import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("ravelry_token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Not connected to Ravelry" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const ravelryRes = await fetch(
    `https://api.ravelry.com/patterns/search.json?query=${encodeURIComponent(query)}&page_size=10`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!ravelryRes.ok) {
    return NextResponse.json(
      { error: "Ravelry API error" },
      { status: ravelryRes.status }
    );
  }

  const data = await ravelryRes.json();
  return NextResponse.json(data);
}
