"use client";

import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

const SIZE_OPTIONS = [
  { value: "300", label: "Small · 300×300 · Web thumbnail" },
  { value: "500", label: "Medium · 500×500 · General web" },
  { value: "1000", label: "Large · 1000×1000 · Print-ready" },
  { value: "2000", label: "XL · 2000×2000 · High-res print" },
] as const;

type SizeValue = (typeof SIZE_OPTIONS)[number]["value"];

const PROTOCOL_RE = /^([a-zA-Z][a-zA-Z0-9+\-.]*:\/\/)(.*)/;

function validateUrl(protocol: string, path: string): string | undefined {
  const trimmed = path.trim();
  if (!trimmed) return "URL is required.";
  const result = z.string().url("Please enter a valid URL.").safeParse(`${protocol}${trimmed}`);
  return result.success ? undefined : result.error.issues[0]?.message;
}

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const [protocol, setProtocol] = useState("https://");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      url: "",
      size: "500" as SizeValue,
      logo: null as File | null,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      setQrResult(null);

      try {
        const formData = new FormData();
        formData.append("url", `${protocol}${value.url.trim()}`);
        formData.append("size", value.size);
        if (value.logo) {
          formData.append("logo", value.logo);
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
        setSubmitError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      }
    },
  });

  function handleDownload() {
    if (!qrResult) return;
    const a = document.createElement("a");
    a.href = qrResult;
    a.download = "qr-code.png";
    a.click();
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-6 relative">
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>

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
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              {/* URL */}
              <form.Field
                name="url"
                validators={{
                  onBlur: ({ value }) => validateUrl(protocol, value),
                  onSubmit: ({ value }) => validateUrl(protocol, value),
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="url">URL</FieldLabel>
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>{protocol}</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="url"
                        type="text"
                        placeholder="example.com"
                        value={field.state.value}
                        onChange={(e) => {
                          const v = e.target.value;
                          const match = v.match(PROTOCOL_RE);
                          if (match) {
                            setProtocol(match[1]);
                            field.handleChange(match[2]);
                          } else {
                            field.handleChange(v);
                          }
                        }}
                        onBlur={field.handleBlur}
                        aria-invalid={field.state.meta.errors.length > 0 || undefined}
                      />
                    </InputGroup>
                    <FieldError>
                      {field.state.meta.errors[0] as string | undefined}
                    </FieldError>
                  </Field>
                )}
              </form.Field>

              {/* Resolution */}
              <form.Field name="size">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="size">Resolution</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) =>
                        field.handleChange(v as SizeValue)
                      }
                    >
                      <SelectTrigger id="size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SIZE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              {/* Logo */}
              <form.Field name="logo">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo (optional)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          field.handleChange(file);
                          setLogoPreview(
                            file ? URL.createObjectURL(file) : null
                          );
                        }}
                        className="flex-1"
                      />
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            field.handleChange(null);
                            setLogoPreview(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
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
                        {logoPreview
                          ? "Custom logo selected"
                          : "Using default logo"}
                      </p>
                    </div>
                  </div>
                )}
              </form.Field>

              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}

              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Generating..." : "Generate QR Code"}
                  </Button>
                )}
              </form.Subscribe>
            </form>
          </CardContent>
        </Card>

        {/* Right — output */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>
              {qrResult
                ? "Your QR code is ready."
                : "Your QR code will appear here."}
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
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full"
                >
                  Download PNG
                </Button>
              </>
            ) : (
              <div className="w-full aspect-square rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 flex items-center justify-center">
                <form.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <p className="text-sm text-muted-foreground">
                      {isSubmitting ? "Generating..." : "No QR code yet"}
                    </p>
                  )}
                </form.Subscribe>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
