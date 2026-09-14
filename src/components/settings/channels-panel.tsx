"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Cable,
  CheckCircle2,
  Crown,
  ExternalLink,
  Keyboard,
  Loader2,
  MessageSquare,
  Plus,
  Unplug,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsPanelHead } from "./settings-panel-head";
import type { ChannelType } from "@/types/channel";

interface ChannelConfig {
  id: string;
  channel: ChannelType;
  channel_id: string | null;
  display_name?: string | null;
  is_primary: boolean;
  status: "connected" | "disconnected";
  connected_at: string | null;
  ig_business_account_id: string | null;
  waba_id?: string | null;
}

const CHANNEL_META: Record<
  ChannelType,
  { label: string; color: string; description: string; docsUrl: string }
> = {
  whatsapp: {
    label: "WhatsApp",
    color: "bg-green-500",
    description: "Números de WhatsApp Business conectados al CRM",
    docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
  },
  instagram: {
    label: "Instagram",
    color: "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400",
    description: "Cuentas de Instagram Business conectadas",
    docsUrl: "https://developers.facebook.com/docs/instagram-api",
  },
  messenger: {
    label: "Messenger",
    color: "bg-blue-500",
    description: "Páginas de Facebook conectadas a Messenger",
    docsUrl: "https://developers.facebook.com/docs/messenger-platform",
  },
};

function connectionName(connection: ChannelConfig) {
  if (connection.display_name?.trim()) return connection.display_name.trim();
  if (connection.channel === "whatsapp") return "WhatsApp principal";
  if (connection.channel === "instagram") return "Instagram Business";
  return "Facebook Messenger";
}

function shortExternalId(value: string | null) {
  if (!value) return "ID no disponible";
  if (value.length <= 14) return value;
  return `${value.slice(0, 6)}…${value.slice(-6)}`;
}

export function ChannelsPanel() {
  const { accountId, canEditSettings, profileLoading } = useAuth();
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<ChannelType | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState<ChannelType | null>(null);
  const [savingManual, setSavingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    displayName: "",
    pageId: "",
    accessToken: "",
    verifyToken: "",
    igBusinessAccountId: "",
  });

  const canEdit = canEditSettings && !profileLoading;

  useEffect(() => {
    if (accountId) void fetchChannels();
  }, [accountId]);

  const byChannel = useMemo(() => {
    return (["whatsapp", "instagram", "messenger"] as ChannelType[]).reduce(
      (acc, channel) => {
        acc[channel] = channels.filter((item) => item.channel === channel);
        return acc;
      },
      {} as Record<ChannelType, ChannelConfig[]>,
    );
  }, [channels]);

  async function fetchChannels() {
    try {
      const res = await fetch("/api/channels");
      if (!res.ok) throw new Error("Failed to fetch channels");
      const data = await res.json();
      setChannels(data.channels || []);
    } catch {
      toast.error("Error al cargar las conexiones");
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(channel: ChannelType) {
    if (channel === "whatsapp") {
      window.location.href = "/settings?tab=whatsapp";
      return;
    }

    setConnecting(channel);
    window.location.href = `/api/oauth/meta/start?channel=${channel}`;
  }

  async function handleDisconnect(connection: ChannelConfig) {
    if (!confirm(`¿Desconectar ${connectionName(connection)}?`)) return;

    setDisconnecting(connection.id);
    try {
      const res = await fetch(`/api/channels/${connection.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to disconnect");
      }
      toast.success("Conexión desconectada");
      await fetchChannels();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al desconectar");
    } finally {
      setDisconnecting(null);
    }
  }

  async function handleSetPrimary(connection: ChannelConfig) {
    setPromoting(connection.id);
    try {
      const res = await fetch(`/api/channels/${connection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_primary: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to set primary channel");
      }
      toast.success(`${connectionName(connection)} ahora es la conexión principal`);
      await fetchChannels();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar la principal");
    } finally {
      setPromoting(null);
    }
  }

  async function handleManualSave(channel: "instagram" | "messenger") {
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
          display_name: manualForm.displayName || undefined,
          page_id: manualForm.pageId,
          access_token: manualForm.accessToken,
          verify_token: manualForm.verifyToken || undefined,
          ig_business_account_id:
            channel === "instagram"
              ? manualForm.igBusinessAccountId || undefined
              : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save connection");
      }

      toast.success(`${CHANNEL_META[channel].label} conectado`);
      setShowManualForm(null);
      setManualForm({
        displayName: "",
        pageId: "",
        accessToken: "",
        verifyToken: "",
        igBusinessAccountId: "",
      });
      await fetchChannels();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al conectar");
    } finally {
      setSavingManual(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <section className="max-w-3xl animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title="Canales"
        description="Administra las cuentas y números que reciben conversaciones en Zynex CRM."
      />

      <div className="space-y-4">
        {(["whatsapp", "instagram", "messenger"] as ChannelType[]).map(
          (channel) => {
            const meta = CHANNEL_META[channel];
            const connections = byChannel[channel];
            const connected = connections.filter(
              (connection) => connection.status === "connected",
            );
            const isConnecting = connecting === channel;

            return (
              <Card key={channel}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${meta.color} text-white`}
                      >
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{meta.label}</CardTitle>
                          {connected.length > 0 && (
                            <Badge variant="secondary">
                              {connected.length} {connected.length === 1 ? "conexión" : "conexiones"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {meta.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleConnect(channel)}
                        disabled={!canEdit || isConnecting}
                        className="gap-1.5"
                      >
                        {isConnecting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : connections.length > 0 ? (
                          <Plus className="h-3.5 w-3.5" />
                        ) : (
                          <Cable className="h-3.5 w-3.5" />
                        )}
                        {channel === "whatsapp"
                          ? connections.length > 0
                            ? "Administrar WhatsApp"
                            : "Configurar WhatsApp"
                          : connections.length > 0
                            ? "Conectar otra"
                            : `Conectar ${meta.label}`}
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(meta.docsUrl, "_blank")}
                        aria-label={`Documentación de ${meta.label}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {connections.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No hay conexiones de {meta.label} todavía.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {connections.map((connection) => {
                        const isDisconnecting = disconnecting === connection.id;
                        const isPromoting = promoting === connection.id;
                        const isConnected = connection.status === "connected";

                        return (
                          <div
                            key={connection.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">
                                  {connectionName(connection)}
                                </p>
                                {connection.is_primary && (
                                  <Badge className="gap-1" variant="secondary">
                                    <Crown className="h-3 w-3" />
                                    Principal
                                  </Badge>
                                )}
                                {isConnected ? (
                                  <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Conectado
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Desconectado
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                ID: {shortExternalId(connection.channel_id)}
                              </p>
                            </div>

                            {canEdit && isConnected && (
                              <div className="flex flex-wrap gap-2">
                                {!connection.is_primary && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSetPrimary(connection)}
                                    disabled={isPromoting}
                                    className="gap-1.5"
                                  >
                                    {isPromoting ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Crown className="h-3.5 w-3.5" />
                                    )}
                                    Hacer principal
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDisconnect(connection)}
                                  disabled={isDisconnecting}
                                  className="gap-1.5"
                                >
                                  {isDisconnecting ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Unplug className="h-3.5 w-3.5" />
                                  )}
                                  Desconectar
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {channel !== "whatsapp" && (
                    <div className="border-t pt-3">
                      {showManualForm === channel ? (
                        <div className="space-y-3 rounded-lg bg-muted/40 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">Conexión manual avanzada</p>
                              <p className="text-xs text-muted-foreground">
                                Usa esta opción solo si OAuth no está disponible.
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowManualForm(null)}
                            >
                              Cancelar
                            </Button>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Nombre</Label>
                              <Input
                                placeholder="Ej. Ventas"
                                value={manualForm.displayName}
                                onChange={(event) =>
                                  setManualForm({
                                    ...manualForm,
                                    displayName: event.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Page ID</Label>
                              <Input
                                value={manualForm.pageId}
                                onChange={(event) =>
                                  setManualForm({
                                    ...manualForm,
                                    pageId: event.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="grid gap-1.5 sm:col-span-2">
                              <Label className="text-xs">Access Token</Label>
                              <Input
                                type="password"
                                value={manualForm.accessToken}
                                onChange={(event) =>
                                  setManualForm({
                                    ...manualForm,
                                    accessToken: event.target.value,
                                  })
                                }
                              />
                            </div>
                            {channel === "instagram" && (
                              <div className="grid gap-1.5">
                                <Label className="text-xs">
                                  Instagram Business Account ID
                                </Label>
                                <Input
                                  value={manualForm.igBusinessAccountId}
                                  onChange={(event) =>
                                    setManualForm({
                                      ...manualForm,
                                      igBusinessAccountId: event.target.value,
                                    })
                                  }
                                />
                              </div>
                            )}
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Webhook Verify Token</Label>
                              <Input
                                value={manualForm.verifyToken}
                                onChange={(event) =>
                                  setManualForm({
                                    ...manualForm,
                                    verifyToken: event.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() =>
                              void handleManualSave(
                                channel as "instagram" | "messenger",
                              )
                            }
                            disabled={
                              savingManual ||
                              !manualForm.pageId ||
                              !manualForm.accessToken
                            }
                          >
                            {savingManual ? (
                              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            ) : null}
                            Guardar conexión
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-muted-foreground"
                          onClick={() => setShowManualForm(channel)}
                          disabled={!canEdit}
                        >
                          <Keyboard className="h-3.5 w-3.5" />
                          Configuración manual avanzada
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          },
        )}
      </div>

      {!canEdit && (
        <p className="mt-3 text-xs text-muted-foreground">
          Solo los administradores pueden gestionar conexiones.
        </p>
      )}
    </section>
  );
}
