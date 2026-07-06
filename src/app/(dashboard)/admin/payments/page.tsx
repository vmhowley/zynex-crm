"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "@/hooks/use-translations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

interface PaymentRequest {
  id: string;
  account_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  payment_reference: string;
  requested_at: string;
  accounts: {
    name: string;
    profiles: {
      full_name: string;
      email: string;
    }[];
  };
  subscriptions: {
    plans: {
      name: string;
      plan_type: string;
    };
  };
}

export default function AdminPaymentsPage() {
  const { t } = useTranslations();
  const isEn = t("auth_login") !== "Iniciar Sesión";
  const supabase = createClient();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      const res = await fetch("/api/admin/payments");
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setPayments(data.payment_requests || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        setPayments(payments.filter((p) => p.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Error processing payment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Error processing payment");
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin_pendingPayments")}</h1>
          <p className="text-muted-foreground">
            Aprobar o rechazar solicitudes de pago de clientes
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay pagos pendientes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {payment.accounts?.profiles?.[0]?.full_name || "Cliente"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.accounts?.profiles?.[0]?.email}
                    </p>
                    <p className="text-sm">
                      Plan:{" "}
                      <span className="font-medium">
                        {payment.subscriptions?.plans?.name}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cuenta: {payment.accounts?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solicitado:{" "}
                      {new Date(payment.requested_at).toLocaleString("es-DO")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      RD${payment.amount.toLocaleString()}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {payment.payment_method}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handleAction(payment.id, "approve")}
                    disabled={processing === payment.id}
                    className="flex-1"
                  >
                    {processing === payment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Aprobar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleAction(payment.id, "reject")}
                    disabled={processing === payment.id}
                    variant="outline"
                    className="flex-1"
                  >
                    {processing === payment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Rechazar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
