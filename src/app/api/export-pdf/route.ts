import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { documents, annotations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PDFDocument, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json({ error: "documentId required" }, { status: 400 });
  }

  // Get document
  const doc = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));

  if (!doc[0]) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Get all annotations for this document
  const allAnnotations = await db
    .select()
    .from(annotations)
    .where(eq(annotations.documentId, documentId));

  // Fetch original PDF
  const pdfResponse = await fetch(doc[0].blobUrl);
  const pdfBytes = await pdfResponse.arrayBuffer();

  // Load with pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  // Bake annotations onto pages
  for (const annotation of allAnnotations) {
    const page = pages[annotation.pageNumber - 1];
    if (!page || !annotation.fabricJson) continue;

    const fabricData = annotation.fabricJson as { objects?: Array<{
      type: string;
      left?: number;
      top?: number;
      width?: number;
      height?: number;
      radius?: number;
      stroke?: string;
      strokeWidth?: number;
      text?: string;
      fontSize?: number;
      fill?: string;
      path?: Array<Array<string | number>>;
      x1?: number;
      y1?: number;
      x2?: number;
      y2?: number;
    }> };
    
    if (!fabricData.objects) continue;
    const { height: pageHeight } = page.getSize();

    for (const obj of fabricData.objects) {
      const x = obj.left ?? 0;
      // Fabric.js y is from top; pdf-lib y is from bottom
      const y = pageHeight - (obj.top ?? 0);

      if (obj.type === "rect" && obj.width && obj.height) {
        page.drawRectangle({
          x,
          y: y - obj.height,
          width: obj.width,
          height: obj.height,
          borderColor: parseColor(obj.stroke),
          borderWidth: obj.strokeWidth ?? 1,
        });
      } else if (obj.type === "circle" && obj.radius) {
        page.drawCircle({
          x: x + obj.radius,
          y: y - obj.radius,
          size: obj.radius,
          borderColor: parseColor(obj.stroke),
          borderWidth: obj.strokeWidth ?? 1,
        });
      } else if ((obj.type === "i-text" || obj.type === "text") && obj.text) {
        page.drawText(obj.text, {
          x,
          y: y - (obj.fontSize ?? 12),
          size: obj.fontSize ?? 12,
          color: parseColor(obj.fill),
        });
      }
    }
  }

  const outputBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(outputBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${doc[0].filename.replace(".pdf", "")}-annotated.pdf"`,
    },
  });
}

function parseColor(colorStr?: string) {
  if (!colorStr) return rgb(0, 0, 0);
  if (colorStr.startsWith("#")) {
    const hex = colorStr.slice(1, 7);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return rgb(r, g, b);
  }
  return rgb(0, 0, 0);
}
