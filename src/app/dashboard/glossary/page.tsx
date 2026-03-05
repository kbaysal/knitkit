import { getCustomGlossaryEntries } from "@/app/actions/glossary";
import { GlossaryClient } from "@/components/glossary-client";

export default async function GlossaryPage() {
  const customEntries = await getCustomGlossaryEntries();

  return <GlossaryClient customEntries={customEntries} />;
}
