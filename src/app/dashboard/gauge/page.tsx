"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function GaugePage() {
  const [swatchWidth, setSwatchWidth] = useState("");
  const [swatchHeight, setSwatchHeight] = useState("");
  const [swatchStitches, setSwatchStitches] = useState("");
  const [swatchRows, setSwatchRows] = useState("");
  const [targetWidth, setTargetWidth] = useState("");
  const [targetHeight, setTargetHeight] = useState("");

  const w = parseFloat(swatchWidth);
  const h = parseFloat(swatchHeight);
  const sts = parseFloat(swatchStitches);
  const rows = parseFloat(swatchRows);

  const stitchesPerUnit = w > 0 && sts > 0 ? sts / w : 0;
  const rowsPerUnit = h > 0 && rows > 0 ? rows / h : 0;

  const tw = parseFloat(targetWidth);
  const th = parseFloat(targetHeight);

  const projectedStitches = tw > 0 && stitchesPerUnit > 0 ? Math.round(tw * stitchesPerUnit) : null;
  const projectedRows = th > 0 && rowsPerUnit > 0 ? Math.round(th * rowsPerUnit) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gauge Calculator</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Swatch input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Swatch Measurements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sw">Swatch Width (cm/in)</Label>
                <Input
                  id="sw"
                  type="number"
                  step="0.1"
                  min="0"
                  value={swatchWidth}
                  onChange={(e) => setSwatchWidth(e.target.value)}
                  placeholder="e.g. 10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sh">Swatch Height (cm/in)</Label>
                <Input
                  id="sh"
                  type="number"
                  step="0.1"
                  min="0"
                  value={swatchHeight}
                  onChange={(e) => setSwatchHeight(e.target.value)}
                  placeholder="e.g. 10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sst">Stitches in Swatch</Label>
                <Input
                  id="sst"
                  type="number"
                  min="0"
                  value={swatchStitches}
                  onChange={(e) => setSwatchStitches(e.target.value)}
                  placeholder="e.g. 20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sr">Rows in Swatch</Label>
                <Input
                  id="sr"
                  type="number"
                  min="0"
                  value={swatchRows}
                  onChange={(e) => setSwatchRows(e.target.value)}
                  placeholder="e.g. 28"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gauge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted p-4 text-center">
                <div className="text-3xl font-bold tabular-nums">
                  {stitchesPerUnit ? stitchesPerUnit.toFixed(1) : "—"}
                </div>
                <div className="text-sm text-muted-foreground">sts/unit</div>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <div className="text-3xl font-bold tabular-nums">
                  {rowsPerUnit ? rowsPerUnit.toFixed(1) : "—"}
                </div>
                <div className="text-sm text-muted-foreground">rows/unit</div>
              </div>
            </div>

            <Separator />

            <p className="text-sm font-medium">Target Dimensions</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tw">Width (cm/in)</Label>
                <Input
                  id="tw"
                  type="number"
                  step="0.1"
                  min="0"
                  value={targetWidth}
                  onChange={(e) => setTargetWidth(e.target.value)}
                  placeholder="e.g. 50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="th">Height (cm/in)</Label>
                <Input
                  id="th"
                  type="number"
                  step="0.1"
                  min="0"
                  value={targetHeight}
                  onChange={(e) => setTargetHeight(e.target.value)}
                  placeholder="e.g. 60"
                />
              </div>
            </div>

            {(projectedStitches || projectedRows) && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-lg bg-primary/10 p-4 text-center">
                  <div className="text-3xl font-bold tabular-nums text-primary">
                    {projectedStitches ?? "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    stitches needed
                  </div>
                </div>
                <div className="rounded-lg bg-primary/10 p-4 text-center">
                  <div className="text-3xl font-bold tabular-nums text-primary">
                    {projectedRows ?? "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    rows needed
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
