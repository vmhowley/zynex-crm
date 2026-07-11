"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Cable,
  CheckCircle2,
  Loader2,
  XCircle,
  Unplug,
  ExternalLink,
  MessageSquare,
  Keyboard,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsPanelHead } from "./settings-panel-head";
import type { ChannelType } from "@/types/channel";

interface ChannelConfig {
  id: string;
  channel: ChannelType;
  channel_id: string | null;
  status: string;
  connected_at: string | null;
  ig_business_account_id: string | null;
}

const CHANNEL_META: Record<
  ChannelType,
  { label: string; color: string; description: string; docsUrl: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    color: "bg-green-500",
    description: "Mensajes directos de WhatsApp",
    docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
  },
  instagram: {
    label: "Instagram",
    color: "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400",
    description: "Mensajes directos de Instagram Business",
    docsUrl: "https://developers.facebook.com/docs/instagram-api/overview",
  },
  messenger: {
    label: "Messenger",
    color: "bg-blue-500",
    description: "Mensajes de Facebook Messenger",
    docsUrl: "https://developers.facebook.com/docs/messenger-platform",
  },
};

function SetupInstructions({
  channel,
}: {
  channel: "instagram" | "messenger";
}) {
  const meta = CHANNEL_META[channel];

  const instagramSteps = [
    {
      n: 1,
      title: "Crea una app de Meta",
      content: (
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            Ve a{" "}
            <span className="text-primary">developers.facebook.com</span> → My Apps → Create App
          </li>
          <li>Selecciona el tipo &quot;Business&quot;</li>
          <li>Completa los datos y crea la app</li>
          <li>
            En el dashboard de tu app, busca &quot;Instagram&quot; en Add Product y haz clic en &quot;Set Up&quot;
          </li>
        </ol>
      ),
    },
    {
      n: 2,
      title: "Agrega permisos de Instagram",
      content: (
        <>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Ve a App Review → Permissions and Features</li>
            <li>
              Solicita estos permisos:{" "}
              <code className="text-xs bg-muted px-1 rounded">instagram_basic</code>,{" "}
              <code className="text-xs bg-muted px-1 rounded">instagram_manage_messages</code>,{" "}
              <code className="text-xs bg-muted px-1 rounded">pages_messaging</code>
            </li>
            <li>
              Si tu app está en{" "}
              <strong className="text-foreground">Development</strong>, los permisos
              funcionan automáticamente. Para producción necesitas App Review.
            </li>
          </ol>
          <p className="text-xs text-muted-foreground mt-2 italic">
            App Review para <code className="bg-muted px-1 rounded">instagram_manage_messages</code>{" "}
            puede tomar 2-4 semanas. Mientras tanto puedes probar en modo Development.
          </p>
        </>
      ),
    },
    {
      n: 3,
      title: "Vincula tu cuenta de Instagram Business",
      content: (
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            Asegúrate de que tu cuenta de Instagram sea{" "}
            <strong className="text-foreground">Business o Creator</strong>
          </li>
          <li>
            Vincula tu Instagram Business a una Página de Facebook desde Instagram → Settings → Page
          </li>
          <li>
            Cuando hagas clic en &quot;Conectar Instagram&quot; abajo, Meta te pedirá seleccionar
            la Página y la cuenta de Instagram a conectar
          </li>
        </ol>
      ),
    },
    {
      n: 4,
      title: "Conecta desde Zynex CRM",
      content: (
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            Haz clic en{" "}
            <strong className="text-foreground">
              &quot;Conectar {meta.label}&quot;
            </strong>{" "}
            abajo
          </li>
          <li>
            Inicia sesión con la cuenta de Facebook que administra la Página
          </li>
          <li>
            Concede los permisos solicitados (pages_messaging, instagram_basic, etc.)
          </li>
          <li>
            Si tienes varias Páginas, selecciona la correcta en el picker
          </li>
          <li>
            Listo — serás redirigido automáticamente a Zynex CRM
          </li>
        </ol>
      ),
    },
  ];

  const messengerSteps = [
    {
      n: 1,
      title: "Crea una app de Meta",
      content: (
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            Ve a{" "}
            <span className="text-primary">developers.facebook.com</span> → My Apps → Create App
          </li>
          <li>Selecciona el tipo &quot;Business&quot;</li>
          <li>Completa los datos y crea la app</li>
          <li>
            En el dashboard, busca &quot;Messenger&quot; en Add Product y haz clic en &quot;Set Up&quot;
          </li>
        </ol>
      ),
    },
    {
      n: 2,
      title: "Agrega el producto Messenger",
      content: (
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>Una vez añadido el producto Messenger, ve a App Review → Permissions and Features</li>
          <li>
            Solicita el permiso{" "}
            <code className="text-xs bg-muted px-1 rounded">pages_messaging</code>
          </li>
          <li>
            En modo Development el permiso está activo automáticamente. Para producción necesitas App Review.
          </li>
        </ol>
      ),
    },
    {
      n: 3,
      title: "Conecta desde Zynex CRM",
      content: (
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>
            Haz clic en{" "}
            <strong className="text-foreground">
              &quot;Conectar {meta.label}&quot;
            </strong>{" "}
            abajo
          </li>
          <li>
            Inicia sesión con la cuenta de Facebook que administra la Página
          </li>
          <li>
            Concede los permisos de Messenger (pages_messaging)
          </li>
          <li>
            Selecciona la Página de Facebook que tiene Messenger configurado
          </li>
          <li>
            Zynex CRM recibirá los mensajes entrantes automáticamente
          </li>
        </ol>
      ),
    },
  ];

  const steps = channel === "instagram" ? instagramSteps : messengerSteps;

  return (
    <Accordion className="w-full">
      <AccordionItem className="border-border">
        <AccordionTrigger className="text-muted-foreground hover:text-foreground hover:no-underline">
          <span className="flex items-center gap-2 text-sm">
            <MessageSquare className="size-4" />
            ¿Cómo configurar {meta.label}?
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-2">
            {steps.map((step) => (
              <div key={step.n}>
                <div className="flex items-start gap-2 mb-1">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0 mt-0.5">
                    {step.n}
                  </span>
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                </div>
                <div className="ml-7">{step.content}</div>
              </div>
            ))}

            <a
              href={meta.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors mt-2"
            >
              <ExternalLink className="size-3.5" />
              Documentación oficial de {meta.label}
            </a>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function ChannelsPanel() {
  const { accountId, canEditSettings, profileLoading } = useAuth();
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<ChannelType | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  
  // Manual connection form
  const [showManualForm, setShowManualForm] = useState<ChannelType | null>(null);
  const [manualForm, setManualForm] = useState({
    pageId: "",
    accessToken: "",
    verifyToken: "",
    igBusinessAccountId: "",
  });
  const [savingManual, setSavingManual] = useState(false);

  const canEdit = canEditSettings && !profileLoading;

  useEffect(() => {
    if (accountId) fetchChannels();
  }, [accountId]);

  async function fetchChannels() {
    try {
      const res = await fetch("/api/channels");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setChannels(data.channels || []);
    } catch {
      toast.error("Error al cargar canales");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(channel: ChannelType) {
    setConnecting(channel);
    window.location.href = `/api/oauth/meta/start?channel=${channel}`;
  }

  async function handleDisconnect(channelId: string) {
    if (!confirm("¿Seguro que quieres desconectar este canal?")) return;
    setDisconnecting(channelId);
    try {
      const res = await fetch(`/api/channels/${channelId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      toast.success("Canal desconectado");
      await fetchChannels();
    } catch {
      toast.error("Error al desconectar canal");
    } finally {
      setDisconnecting(null);
    }
  }

  async function handleManualSave(channel: ChannelType) {
    if (!manualForm.pageId || !manualForm.accessToken) {
      toast.error("Page ID y Access Token son requeridos");
      return;
    }
    
    setSavingManual(true);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          page_id: manualForm.pageId,
          access_token: manualForm.accessToken,
          verify_token: manualForm.verifyToken || undefined,
          ig_business_account_id: channel === "instagram" ? manualForm.igBusinessAccountId || undefined : undefined,
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      
      toast.success(`${channel === "instagram" ? "Instagram" : "Messenger"} conectado correctamente`);
      setShowManualForm(null);
      setManualForm({ pageId: "", accessToken: "", verifyToken: "", igBusinessAccountId: "" });
      await fetchChannels();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al conectar");
    } finally {
      setSavingManual(false);
    }
  }

  const connectedChannels = channels.filter((c) => c.status === "connected");
  const whatsappConnected = connectedChannels.some((c) => c.channel === "whatsapp");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <section className="max-w-2xl animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title="Canales"
        description="Conecta WhatsApp, Instagram y Messenger para recibir mensajes de tus clientes."
      />

      <div className="space-y-4">
        {connectedChannels.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                Aún no has conectado ningún canal.
              </p>
            </CardContent>
          </Card>
        )}

        {(["whatsapp", "instagram", "messenger"] as ChannelType[]).map((channel) => {
          const meta = CHANNEL_META[channel];
          const connected = connectedChannels.find((c) => c.channel === channel);
          const isConnecting = connecting === channel;
          const isDisconnecting = disconnecting === connected?.id;

          return (
            <Card key={channel}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg ${meta.color} text-white`}
                    >
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{meta.label}</CardTitle>
                      <p className="text-sm text-muted-foreground">{meta.description}</p>
                    </div>
                  </div>
                  {connected ? (
                    <Badge
                      variant="default"
                      className="bg-green-500/10 text-green-600 border-green-500/20 gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Conectado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      No conectado
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                {channel === "whatsapp" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      (window.location.href = "/settings?tab=whatsapp")
                    }
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {whatsappConnected ? "Administrar WhatsApp" : "Configurar WhatsApp"}
                  </Button>
                ) : (
                  <>
                    <div className="flex gap-2 flex-wrap">
                      {connected ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleDisconnect(connected.id)}
                            disabled={!canEdit || isDisconnecting}
                          >
                            {isDisconnecting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Unplug className="h-3.5 w-3.5" />
                            )}
                            Desconectar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => window.open(meta.docsUrl, "_blank")}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Docs
                          </Button>
                        </>
                      ) : showManualForm === channel ? (
                        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                          <div className="grid gap-2">
                            <Label className="text-xs">Page ID</Label>
                            <Input
                              placeholder="Tu Facebook Page ID"
                              value={manualForm.pageId}
                              onChange={(e) => setManualForm({ ...manualForm, pageId: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-xs">Access Token</Label>
                            <Input
                              type="password"
                              placeholder="Tu Page Access Token"
                              value={manualForm.accessToken}
                              onChange={(e) => setManualForm({ ...manualForm, accessToken: e.target.value })}
                            />
                          </div>
                          {channel === "instagram" && (
                            <div className="grid gap-2">
                              <Label className="text-xs">Instagram Business Account ID</Label>
                              <Input
                                placeholder="IG Business Account ID (opcional)"
                                value={manualForm.igBusinessAccountId}
                                onChange={(e) => setManualForm({ ...manualForm, igBusinessAccountId: e.target.value })}
                              />
                            </div>
                          )}
                          <div className="grid gap-2">
                            <Label className="text-xs">Webhook Verify Token (opcional)</Label>
                            <Input
                              placeholder="Token para verificar webhook"
                              value={manualForm.verifyToken}
                              onChange={(e) => setManualForm({ ...manualForm, verifyToken: e.target.value })}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleManualSave(channel)}
                              disabled={savingManual || !manualForm.pageId || !manualForm.accessToken}
                            >
                              {savingManual ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowManualForm(null);
                                setManualForm({ pageId: "", accessToken: "", verifyToken: "", igBusinessAccountId: "" });
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleConnect(channel)}
                            disabled={!canEdit || isConnecting}
                          >
                            {isConnecting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Cable className="h-3.5 w-3.5" />
                            )}
                            Conectar {meta.label}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setShowManualForm(channel)}
                            disabled={!canEdit}
                          >
                            <Keyboard className="h-3.5 w-3.5" />
                            Manual
                          </Button>
                        </div>
                      )}
                    </div>

                    {showManualForm !== channel && <SetupInstructions channel={channel} />}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!canEdit && (
        <p className="text-xs text-muted-foreground mt-3">
          Solo los administradores pueden gestionar los canales.
        </p>
      )}
    </section>
  );
}
