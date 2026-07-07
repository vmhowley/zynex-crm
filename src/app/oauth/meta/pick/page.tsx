"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageChoice {
  pageId: string;
  pageName: string;
  accessToken: string;
  igAccount?: { id: string; username: string };
}

function MetaPickContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const channel = searchParams.get("channel") ?? "instagram";
  const pagesRaw = searchParams.get("pages") ?? "[]";
  const accountId = searchParams.get("accountId") ?? "";
  const userId = searchParams.get("userId") ?? "";

  let pages: PageChoice[] = [];
  try {
    pages = JSON.parse(pagesRaw);
  } catch {
    pages = [];
  }

  const [selected, setSelected] = useState<PageChoice | null>(
    pages.length === 1 ? pages[0] : null,
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (!selected) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/oauth/meta/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          pageId: selected.pageId,
          pageName: selected.pageName,
          accessToken: selected.accessToken,
          igBusinessAccountId: selected.igAccount?.id,
          accountId,
          userId,
        }),
      });

      if (!res.ok) throw new Error("Pick failed");
      router.push("/settings?tab=channels");
    } catch {
      toast.error("Error al conectar canal");
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle>
          {channel === "instagram"
            ? "Selecciona tu cuenta de Instagram"
            : "Selecciona tu página de Facebook"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pages.map((page) => (
          <button
            key={page.pageId}
            onClick={() => setSelected(page)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
              selected?.pageId === page.pageId
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{page.pageName}</p>
                {channel === "instagram" && page.igAccount && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    @{page.igAccount.username}
                  </p>
                )}
              </div>
              {selected?.pageId === page.pageId && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </div>
          </button>
        ))}

        <Button
          className="w-full mt-4"
          onClick={handleConfirm}
          disabled={!selected || submitting}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Conectar"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MetaPickPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense
        fallback={
          <Card className="max-w-md w-full flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </Card>
        }
      >
        <MetaPickContent />
      </Suspense>
    </div>
  );
}
