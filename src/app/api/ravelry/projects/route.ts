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
  const page = searchParams.get("page") || "1";

  const meRes = await fetch("https://api.ravelry.com/current_user.json", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!meRes.ok) {
    return NextResponse.json(
      { error: "Could not fetch Ravelry user" },
      { status: meRes.status }
    );
  }

  const meData = await meRes.json();
  const username = meData.user?.username;
  if (!username) {
    return NextResponse.json(
      { error: "Could not determine Ravelry username" },
      { status: 500 }
    );
  }

  const projRes = await fetch(
    `https://api.ravelry.com/people/${encodeURIComponent(username)}/projects/list.json?page_size=20&page=${encodeURIComponent(page)}&sort=updated_desc`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!projRes.ok) {
    return NextResponse.json(
      { error: "Ravelry API error" },
      { status: projRes.status }
    );
  }

  const data = await projRes.json();
  return NextResponse.json(data);
}
