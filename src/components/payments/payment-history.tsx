"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, FileText, Image, CheckCircle, XCircle, Clock, Eye, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  proof_image_url: string | null;
  notes: string | null;
  requested_at: string;
  processed_at: string | null;
  created_at: string;
  plan_name: string;
  plan_type: string;
}

export function PaymentHistory() {
  const supabase = createClient();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      const res = await fetch("/api/payments/history");
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadReceipt(paymentId: string, file: File) {
    setUploading(paymentId);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("payment_request_id", paymentId);

      const res = await fetch("/api/payments/upload-receipt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        // Refresh payments list
        await fetchPayments();
      } else {
        alert(data.error || "Error al subir el comprobante");
      }
    } catch (error) {
      console.error("Error uploading receipt:", error);
      alert("Error al subir el comprobante");
    } finally {
      setUploading(null);
    }
  }

  function handleFileSelect(paymentId: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,application/pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleUploadReceipt(paymentId, file);
      }
    };
    input.click();
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatAmount(amount: number, currency: string) {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: currency,
    }).format(amount);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprobado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazado
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function openReceiptModal(url: string) {
    setSelectedReceipt(url);
    setShowReceiptModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No hay historial de pagos aún.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Los pagos que realices aparecerán aquí.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Historial de Pagos</h3>
          <p className="text-sm text-muted-foreground">
            Todos tus pagos y comprobantes
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {payments.map((payment) => (
          <Card key={payment.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{payment.plan_name}</span>
                    {getStatusBadge(payment.status)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium">{formatAmount(payment.amount, payment.currency)}</span>
                      {payment.payment_reference && (
                        <span className="ml-2 text-xs">
                          Ref: {payment.payment_reference}
                        </span>
                      )}
                    </p>
                    <p className="text-xs">
                      Solicitado: {formatDate(payment.requested_at)}
                      {payment.processed_at && (
                        <span className="ml-2">
                          • Procesado: {formatDate(payment.processed_at)}
                        </span>
                      )}
                    </p>
                    {payment.notes && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Nota: {payment.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {payment.proof_image_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReceiptModal(payment.proof_image_url!)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Comprobante
                    </Button>
                  ) : payment.status === "pending" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileSelect(payment.id)}
                      disabled={uploading === payment.id}
                    >
                      {uploading === payment.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-1" />
                      )}
                      Subir Comprobante
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Receipt Viewer Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Comprobante de Pago</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            selectedReceipt.endsWith(".pdf") ? (
              <iframe
                src={selectedReceipt}
                className="w-full h-[60vh] border rounded"
                title="Comprobante PDF"
              />
            ) : (
              <img
                src={selectedReceipt}
                alt="Comprobante de pago"
                className="w-full h-auto rounded"
              />
            )
          )}
          <div className="flex justify-end">
            <a
              href={selectedReceipt || ""}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir en nueva pestaña
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
