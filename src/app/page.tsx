import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calculator,
  FileText,
  Layers,
  Ruler,
  Timer,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "PDF Pattern Viewer",
    description:
      "View your knitting patterns with a draggable row-focus ruler to keep your place.",
  },
  {
    icon: Layers,
    title: "Annotations",
    description:
      "Draw, highlight, and annotate directly on your PDF patterns with freehand and shape tools.",
  },
  {
    icon: Timer,
    title: "Project Tracking",
    description:
      "Track your row count, project time, and progress with persistent timers and counters.",
  },
  {
    icon: BookOpen,
    title: "Stitch Glossary",
    description:
      "Quick reference for stitch abbreviations, plus add your own custom entries.",
  },
  {
    icon: Calculator,
    title: "Gauge Calculator",
    description:
      "Calculate stitches and rows per unit from your swatch measurements.",
  },
  {
    icon: Ruler,
    title: "Unit Converter",
    description:
      "Convert needle sizes, yarn weights, and measurements between different systems.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <span className="text-xl font-bold">KnitKit</span>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Your knitting projects,
          <br />
          <span className="text-primary">organized &amp; annotated</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          KnitKit helps you manage knitting projects, view and annotate PDF
          patterns with a row-focus ruler, track your progress, and access
          handy knitting utilities — all in one place.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/sign-up">
            <Button size="lg">Start for Free</Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              See Features
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Everything you need for your knitting
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border bg-background p-6"
              >
                <f.icon className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold">Ready to get knitting?</h2>
          <p className="mt-4 text-muted-foreground">
            Create your free account and start managing your knitting projects
            today.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="mt-8">
              Sign Up — It&apos;s Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} KnitKit. Free &amp; open source.
        </div>
      </footer>
    </div>
  );
}
