"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2 } from "lucide-react";
import { DEFAULT_GLOSSARY } from "@/lib/glossary-data";
import { addGlossaryEntry, deleteGlossaryEntry } from "@/app/actions/glossary";
import { useRouter } from "next/navigation";

interface GlossaryClientProps {
  customEntries: {
    id: string;
    abbreviation: string;
    description: string;
  }[];
}

export function GlossaryClient({ customEntries }: GlossaryClientProps) {
  const [search, setSearch] = useState("");
  const [newAbbr, setNewAbbr] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  const allEntries = [
    ...DEFAULT_GLOSSARY.map((e) => ({ ...e, isCustom: false, id: e.abbreviation })),
    ...customEntries.map((e) => ({ ...e, isCustom: true })),
  ];

  const filtered = allEntries.filter(
    (e) =>
      e.abbreviation.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newAbbr.trim() || !newDesc.trim()) return;
    setAdding(true);
    try {
      await addGlossaryEntry({
        abbreviation: newAbbr.trim(),
        description: newDesc.trim(),
      });
      setNewAbbr("");
      setNewDesc("");
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteGlossaryEntry(id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stitch Glossary</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search stitches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Add custom entry */}
      <form onSubmit={handleAdd} className="flex items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="abbr">Abbreviation</Label>
          <Input
            id="abbr"
            value={newAbbr}
            onChange={(e) => setNewAbbr(e.target.value)}
            placeholder="e.g. SK2P"
            className="w-32"
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="desc">Description</Label>
          <Input
            id="desc"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="e.g. Slip 1, Knit 2 Together..."
          />
        </div>
        <Button type="submit" disabled={adding}>
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </form>

      {/* Glossary list */}
      <div className="rounded-lg border">
        <div className="grid grid-cols-[120px_1fr_auto] gap-3 border-b bg-muted/50 px-4 py-2 text-sm font-medium">
          <span>Abbreviation</span>
          <span>Description</span>
          <span></span>
        </div>
        <div className="divide-y">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[120px_1fr_auto] items-center gap-3 px-4 py-2 text-sm"
            >
              <span className="font-mono font-semibold">
                {entry.abbreviation}
                {entry.isCustom && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    Custom
                  </Badge>
                )}
              </span>
              <span className="text-muted-foreground">{entry.description}</span>
              <span>
                {entry.isCustom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-muted-foreground">
              No matching stitches found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
