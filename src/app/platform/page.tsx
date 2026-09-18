import { redirect } from "next/navigation";
import { Building2, CreditCard, MessageSquare, Users } from "lucide-react";
import { requirePlatformRole } from "@/lib/platform/auth";
import { supabaseAdmin } from "@/lib/flows/admin-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlatformAccountRow {
  account_id: string;
  account_name: string;
  owner_user_id: string;
  owner_name: string | null;
  owner_email: string | null;
  account_created_at: string;
  plan_name: string | null;
  plan_type: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  paid_until: string | null;
  contacts_count: number;
  team_members_count: number;
  whatsapp_numbers_count: number;
  pending_payments_count: number;
}

function subscriptionBadge(status: string | null) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-500/10 text-green-600">Activo</Badge>;
    case "trial":
      return <Badge className="bg-blue-500/10 text-blue-600">Trial</Badge>;
    case "suspended":
      return <Badge variant="destructive">Suspendido</Badge>;
    case "cancelled":
      return <Badge variant="secondary">Cancelado</Badge>;
    default:
      return <Badge variant="outline">Sin suscripción</Badge>;
  }
}

export default async function PlatformPage() {
  const platformUser = await requirePlatformRole([
    "super_admin",
    "support",
    "billing",
  ]);

  if (!platformUser) redirect("/");

  const { data, error } = await supabaseAdmin().rpc(
    "platform_account_overview",
  );

  const accounts = (data || []) as PlatformAccountRow[];
  const activeAccounts = accounts.filter((account) =>
    ["active", "trial"].includes(account.subscription_status || ""),
  ).length;
  const totalContacts = accounts.reduce(
    (total, account) => total + Number(account.contacts_count || 0),
    0,
  );
  const totalWhatsApp = accounts.reduce(
    (total, account) => total + Number(account.whatsapp_numbers_count || 0),
    0,
  );
  const pendingPayments = accounts.reduce(
    (total, account) => total + Number(account.pending_payments_count || 0),
    0,
  );

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Zynex Platform</p>
            <h1 className="text-3xl font-semibold tracking-tight">Administración SaaS</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tenants, suscripciones y uso global de Zynex CRM.
            </p>
          </div>
          <Badge variant="outline">{platformUser.role}</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tenants activos</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{activeAccounts}</div>
              <p className="text-xs text-muted-foreground">de {accounts.length} cuentas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contactos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{totalContacts}</div>
              <p className="text-xs text-muted-foreground">en toda la plataforma</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">WhatsApp conectados</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{totalWhatsApp}</div>
              <p className="text-xs text-muted-foreground">números activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos pendientes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{pendingPayments}</div>
              <p className="text-xs text-muted-foreground">solicitudes por revisar</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tenants</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {error ? (
              <div className="p-6 text-sm text-destructive">
                No se pudo cargar el resumen de tenants.
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No hay cuentas registradas todavía.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-y bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Cuenta</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 text-right font-medium">Contactos</th>
                      <th className="px-4 py-3 text-right font-medium">Equipo</th>
                      <th className="px-4 py-3 text-right font-medium">WhatsApp</th>
                      <th className="px-4 py-3 text-right font-medium">Pagos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {accounts.map((account) => (
                      <tr key={account.account_id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium">{account.account_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {account.owner_name || account.owner_email || "Sin propietario visible"}
                          </p>
                          {account.owner_name && account.owner_email && (
                            <p className="text-xs text-muted-foreground">{account.owner_email}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{account.plan_name || "—"}</span>
                          {account.plan_type && (
                            <p className="text-xs text-muted-foreground">{account.plan_type}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {subscriptionBadge(account.subscription_status)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {account.contacts_count}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {account.team_members_count}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {account.whatsapp_numbers_count}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {account.pending_payments_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
