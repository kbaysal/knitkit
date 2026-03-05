"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Needle size data
const needleSizes = [
  { us: "0", metric: 2.0, uk: "14" },
  { us: "1", metric: 2.25, uk: "13" },
  { us: "1.5", metric: 2.5, uk: "—" },
  { us: "2", metric: 2.75, uk: "12" },
  { us: "3", metric: 3.25, uk: "10" },
  { us: "4", metric: 3.5, uk: "—" },
  { us: "5", metric: 3.75, uk: "9" },
  { us: "6", metric: 4.0, uk: "8" },
  { us: "7", metric: 4.5, uk: "7" },
  { us: "8", metric: 5.0, uk: "6" },
  { us: "9", metric: 5.5, uk: "5" },
  { us: "10", metric: 6.0, uk: "4" },
  { us: "10.5", metric: 6.5, uk: "3" },
  { us: "11", metric: 8.0, uk: "0" },
  { us: "13", metric: 9.0, uk: "00" },
  { us: "15", metric: 10.0, uk: "000" },
  { us: "17", metric: 12.75, uk: "—" },
  { us: "19", metric: 15.0, uk: "—" },
];

// Yarn weight data
const yarnWeights = [
  { name: "Lace", ply: "1-2 ply", wpi: "18+", gauge: "32-34 sts" },
  { name: "Fingering", ply: "4 ply", wpi: "14-17", gauge: "27-32 sts" },
  { name: "Sport", ply: "5 ply", wpi: "12-14", gauge: "23-26 sts" },
  { name: "DK", ply: "8 ply", wpi: "11-12", gauge: "21-24 sts" },
  { name: "Worsted", ply: "10 ply", wpi: "9-11", gauge: "16-20 sts" },
  { name: "Aran", ply: "10 ply", wpi: "8-9", gauge: "16-18 sts" },
  { name: "Bulky", ply: "12 ply", wpi: "6-7", gauge: "12-15 sts" },
  { name: "Super Bulky", ply: "14+ ply", wpi: "5-6", gauge: "7-11 sts" },
];

export default function ConverterPage() {
  const [measurement, setMeasurement] = useState("");
  const [fromUnit, setFromUnit] = useState("in");
  const [toUnit, setToUnit] = useState("cm");

  const val = parseFloat(measurement);
  let converted: number | null = null;

  if (!isNaN(val)) {
    // Convert everything to cm first, then to target
    const toCm: Record<string, number> = {
      in: 2.54,
      cm: 1,
      mm: 0.1,
      m: 100,
      yd: 91.44,
      ft: 30.48,
    };
    if (toCm[fromUnit] && toCm[toUnit]) {
      converted = (val * toCm[fromUnit]) / toCm[toUnit];
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Unit Converter</h1>

      <Tabs defaultValue="measurement">
        <TabsList>
          <TabsTrigger value="measurement">Measurements</TabsTrigger>
          <TabsTrigger value="needles">Needle Sizes</TabsTrigger>
          <TabsTrigger value="yarn">Yarn Weights</TabsTrigger>
        </TabsList>

        <TabsContent value="measurement" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Measurement Converter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
                <div className="space-y-2">
                  <Label>From</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={measurement}
                      onChange={(e) => setMeasurement(e.target.value)}
                      placeholder="Enter value"
                    />
                    <Select value={fromUnit} onValueChange={setFromUnit}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">in</SelectItem>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="mm">mm</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="yd">yd</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <span className="pb-2 text-lg font-bold">=</span>

                <div className="space-y-2">
                  <Label>To</Label>
                  <div className="flex gap-2">
                    <div className="flex h-9 flex-1 items-center rounded-md border bg-muted px-3 text-lg font-semibold tabular-nums">
                      {converted !== null ? converted.toFixed(2) : "—"}
                    </div>
                    <Select value={toUnit} onValueChange={setToUnit}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in">in</SelectItem>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="mm">mm</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="yd">yd</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="needles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Needle Size Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <div className="grid grid-cols-3 gap-3 border-b bg-muted/50 px-4 py-2 text-sm font-medium">
                  <span>US</span>
                  <span>Metric (mm)</span>
                  <span>UK</span>
                </div>
                <div className="divide-y">
                  {needleSizes.map((n) => (
                    <div
                      key={n.us}
                      className="grid grid-cols-3 gap-3 px-4 py-2 text-sm"
                    >
                      <span className="font-medium">US {n.us}</span>
                      <span>{n.metric} mm</span>
                      <span className="text-muted-foreground">{n.uk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yarn" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Yarn Weight Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <div className="grid grid-cols-4 gap-3 border-b bg-muted/50 px-4 py-2 text-sm font-medium">
                  <span>Weight</span>
                  <span>Ply</span>
                  <span>WPI</span>
                  <span>Gauge (4&quot;)</span>
                </div>
                <div className="divide-y">
                  {yarnWeights.map((y) => (
                    <div
                      key={y.name}
                      className="grid grid-cols-4 gap-3 px-4 py-2 text-sm"
                    >
                      <span className="font-medium">{y.name}</span>
                      <span>{y.ply}</span>
                      <span>{y.wpi}</span>
                      <span className="text-muted-foreground">{y.gauge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
