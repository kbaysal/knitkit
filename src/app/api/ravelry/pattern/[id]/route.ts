import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const patternId = parseInt(id, 10);
  if (isNaN(patternId)) {
    return NextResponse.json({ error: "Invalid pattern ID" }, { status: 400 });
  }

  const ravelryRes = await fetch(
    `https://api.ravelry.com/patterns/${patternId}.json`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!ravelryRes.ok) {
    return NextResponse.json(
      { error: "Ravelry API error" },
      { status: ravelryRes.status }
    );
  }

  const data = await ravelryRes.json();
  const p = data.pattern;

  // Enrich each pack with detailed yarn info
  interface YarnDetail {
    yarn_name: string | null;
    yarn_company: string | null;
    yarn_id: number | null;
    yarn_permalink: string | null;
    colorway: string | null;
    quantity_description: string | null;
    skeins: number | null;
    total_grams: number | null;
    total_yards: number | null;
    total_meters: number | null;
    yarn_weight: string | null;
    min_gauge: number | null;
    max_gauge: number | null;
    gauge_divisor: number | null;
    grams: number | null;
    yardage: number | null;
    suggested_needles: string[];
  }

  const packs: YarnDetail[] = [];
  if (Array.isArray(p.packs)) {
    const yarnIds = [...new Set(
      p.packs
        .map((pack: { yarn?: { id?: number } }) => pack.yarn?.id)
        .filter((id: number | undefined): id is number => id != null)
    )] as number[];

    // Fetch yarn details in parallel
    const yarnDetailsMap = new Map<number, Record<string, unknown>>();
    if (yarnIds.length > 0) {
      const yarnFetches = yarnIds.map(async (yarnId) => {
        try {
          const res = await fetch(
            `https://api.ravelry.com/yarns/${yarnId}.json`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.ok) {
            const yarnData = await res.json();
            yarnDetailsMap.set(yarnId, yarnData.yarn ?? {});
          }
        } catch {
          // skip failed yarn fetches
        }
      });
      await Promise.all(yarnFetches);
    }

    for (const pack of p.packs as Array<{
      yarn?: { id?: number; name?: string; permalink?: string; yarn_company_name?: string };
      colorway?: string;
      quantity_description?: string;
      total_grams?: number;
      total_yards?: number;
      total_meters?: number;
      skeins?: number;
    }>) {
      const yarnId = pack.yarn?.id ?? null;
      const detail = yarnId ? yarnDetailsMap.get(yarnId) : undefined;
      const yarnWeight = detail?.yarn_weight as { name?: string } | undefined;
      const minGauge = detail?.min_gauge as number | undefined;
      const maxGauge = detail?.max_gauge as number | undefined;
      const gaugeDivisor = detail?.gauge_divisor as number | undefined;
      const grams = detail?.grams as number | undefined;
      const detailYardage = detail?.yardage as number | undefined;
      const needles = Array.isArray(detail?.yarn_needle_sizes)
        ? (detail.yarn_needle_sizes as Array<{ name?: string; us?: string; metric?: number }>).map(
            (n) => (n.us ? `US ${n.us} (${n.metric}mm)` : n.name ?? "")
          ).filter(Boolean)
        : [];

      packs.push({
        yarn_name: pack.yarn?.name ?? null,
        yarn_company: pack.yarn?.yarn_company_name ?? null,
        yarn_id: yarnId,
        yarn_permalink: pack.yarn?.permalink ?? null,
        colorway: pack.colorway ?? null,
        quantity_description: pack.quantity_description ?? null,
        skeins: pack.skeins ?? null,
        total_grams: pack.total_grams ?? null,
        total_yards: pack.total_yards ?? null,
        total_meters: pack.total_meters ?? null,
        yarn_weight: yarnWeight?.name ?? null,
        min_gauge: minGauge ?? null,
        max_gauge: maxGauge ?? null,
        gauge_divisor: gaugeDivisor ?? null,
        grams: grams ?? null,
        yardage: detailYardage ?? null,
        suggested_needles: needles,
      });
    }
  }

  return NextResponse.json({
    id: p.id,
    name: p.name,
    permalink: p.permalink,
    introduction_html: p.notes_html || p.notes,
    sizes_available: p.sizes_available,
    designer: p.pattern_author?.name,
    gauge: p.gauge,
    gauge_divisor: p.gauge_divisor,
    gauge_description: p.gauge_description,
    gauge_pattern: p.gauge_pattern,
    yarn_weight: p.yarn_weight?.name,
    packs,
    yardage: p.yardage,
    yardage_max: p.yardage_max,
    needle_sizes: p.pattern_needle_sizes?.map(
      (n: { id: number; name: string; us: string; metric: number; hook: string }) => ({
        name: n.name,
        us: n.us,
        metric: n.metric,
      })
    ),
    craft: p.craft?.name,
    free: p.free,
    difficulty_average: p.difficulty_average,
    difficulty_count: p.difficulty_count,
    rating_average: p.rating_average,
    rating_count: p.rating_count,
    photo_url: p.photos?.[0]?.medium_url,
  });
}
