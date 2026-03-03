"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

export default function Home() {
  const [url, setUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview(null);
    }
  }

  async function handleGenerate() {
    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }
    setError(null);
    setLoading(true);
    setQrResult(null);

    try {
      const formData = new FormData();
      formData.append("url", url.trim());
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await fetch("/api/generate-qr", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to generate QR code.");
      }

      const blob = await res.blob();
      setQrResult(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!qrResult) return;
    const a = document.createElement("a");
    a.href = qrResult;
    a.download = "qr-code.png";
    a.click();
  }

  function handleClearLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-6">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">QR Code Generator</h1>
        <p className="text-muted-foreground text-sm">
          Palaro 2026 &mdash; Generate a QR code with your logo
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left — inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Enter the URL to encode and optionally upload a custom logo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo (optional)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  className="flex-1"
                />
                {logoPreview && (
                  <button
                    onClick={handleClearLogo}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Clear logo"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="relative size-12 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
                  <Image
                    src={logoPreview ?? "/logo.png"}
                    alt="Logo preview"
                    fill
                    className="object-cover"
                    unoptimized={!!logoPreview}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {logoPreview ? "Custom logo selected" : "Using default logo"}
                </p>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? "Generating..." : "Generate QR Code"}
            </Button>
          </CardContent>
        </Card>

        {/* Right — output */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>
              {qrResult ? "Your QR code is ready." : "Your QR code will appear here."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 flex-1">
            {qrResult ? (
              <>
                <Image
                  src={qrResult}
                  alt="Generated QR code"
                  width={280}
                  height={280}
                  className="rounded-xl border"
                  unoptimized
                />
                <Button onClick={handleDownload} variant="outline" className="w-full">
                  Download PNG
                </Button>
              </>
            ) : (
              <div className="w-full aspect-square rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {loading ? "Generating..." : "No QR code yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
