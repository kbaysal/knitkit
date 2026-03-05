"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Trash2, X } from "lucide-react";
import { addProgressPhoto, deleteProgressPhoto } from "@/app/actions/photos";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProgressPhotosProps {
  projectId: string;
  initialPhotos: {
    id: string;
    blobUrl: string;
    caption: string | null;
    takenAt: Date;
  }[];
}

export function ProgressPhotos({ projectId, initialPhotos }: ProgressPhotosProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
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

      const { url } = await res.json();
      const photo = await addProgressPhoto({
        projectId,
        blobUrl: url,
        caption: caption || undefined,
      });

      setPhotos((prev) => [...prev, photo]);
      setCaption("");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this photo?")) return;
    await deleteProgressPhoto(id, projectId);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-4">
      {/* Upload section */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Camera className="mr-2 h-4 w-4" />
          {uploading ? "Uploading..." : "Add Photo"}
        </Button>
      </div>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No progress photos yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative">
              <button
                className="block w-full overflow-hidden rounded-lg border"
                onClick={() => setLightbox(photo.blobUrl)}
              >
                <Image
                  src={photo.blobUrl}
                  alt={photo.caption || "Progress photo"}
                  width={300}
                  height={300}
                  className="aspect-square w-full object-cover"
                />
              </button>
              {photo.caption && (
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {photo.caption}
                </p>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(photo.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-3xl p-0">
          <DialogTitle className="sr-only">Photo preview</DialogTitle>
          {lightbox && (
            <Image
              src={lightbox}
              alt="Progress photo"
              width={1200}
              height={900}
              className="w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
