"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageChoice {
  page_id: string;
  page_name: string;
  instagram_username?: string | null;
}

function MetaPickContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") ?? "";
  const [channel, setChannel] = useState<"instagram" | "messenger">("instagram");
  const [pages, setPages] = useState<PageChoice[]>([]);
  const [selected, setSelected] = useState<PageChoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      toast.error("Sesión de Meta inválida");
      router.replace("/settings?tab=channels");
      return;
    }

    let active = true;
    fetch(`/api/oauth/meta/pick?session=${encodeURIComponent(sessionId)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "No se pudieron cargar las páginas");
        if (!active) return;
        setChannel(body.channel === "messenger" ? "messenger" : "instagram");
        setPages(body.pages || []);
        if (body.pages?.length === 1) setSelected(body.pages[0]);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : "Sesión de Meta inválida");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router, sessionId]);

  async function handleConfirm() {
    if (!selected || !sessionId) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/oauth/meta/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          page_id: selected.page_id,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "No se pudo conectar la página");
      toast.success(
        `${channel === "instagram" ? "Instagram" : "Messenger"} conectado correctamente`,
      );
      router.replace("/settings?tab=channels");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al conectar canal");
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {channel === "instagram"
            ? "Selecciona tu cuenta de Instagram"
            : "Selecciona tu página de Facebook"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No encontramos páginas disponibles en esta sesión de Meta.
          </p>
        ) : (
          pages.map((page) => (
            <button
              key={page.page_id}
              type="button"
              onClick={() => setSelected(page)}
              className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                selected?.page_id === page.page_id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{page.page_name}</p>
                  {channel === "instagram" && page.instagram_username && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      @{page.instagram_username}
                    </p>
                  )}
                </div>
                {selected?.page_id === page.page_id && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </div>
            </button>
          ))
        )}

        <Button
          className="mt-4 w-full"
          onClick={handleConfirm}
          disabled={!selected || submitting || loading}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conectar"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MetaPickPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense
        fallback={
          <Card className="flex w-full max-w-md items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </Card>
        }
      >
        <MetaPickContent />
      </Suspense>
    </div>
  );
}
