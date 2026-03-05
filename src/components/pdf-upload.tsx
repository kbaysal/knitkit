"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { createDocument } from "@/app/actions/documents";
import { useRouter } from "next/navigation";

export function PdfUpload({ projectId }: { projectId: string }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");

      const { url, filename } = await res.json();

      await createDocument({
        projectId,
        blobUrl: url,
        filename,
        pageCount: 0, // will be updated when PDF loads
      });

      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to upload PDF");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
      <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
      <p className="mb-4 text-muted-foreground">Upload a PDF pattern</p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleUpload}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? "Uploading..." : "Choose PDF"}
      </Button>
    </div>
  );
}
