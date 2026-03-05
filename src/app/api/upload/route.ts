import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;

  if (!file || !projectId) {
    return NextResponse.json(
      { error: "File and projectId are required" },
      { status: 400 }
    );
  }

  const blob = await put(`projects/${projectId}/${file.name}`, file, {
    access: "public",
  });

  return NextResponse.json({ url: blob.url, filename: file.name });
}
