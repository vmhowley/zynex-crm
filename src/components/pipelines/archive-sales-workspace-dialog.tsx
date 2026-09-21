'use client';

import { useState } from 'react';
import { Archive, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Preview {
  conversations: number;
  deals: number;
  confirmationPhrase: string;
}

export function ArchiveSalesWorkspaceDialog({
  canArchive,
  onArchived,
}: {
  canArchive: boolean;
  onArchived: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function openDialog() {
    setOpen(true);
    setPreview(null);
    setConfirmation('');
    setLoading(true);
    try {
      const response = await fetch('/api/account/archive-sales-workspace');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setPreview(payload as Preview);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la vista previa'
      );
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  async function archiveWorkspace() {
    if (!preview || confirmation !== preview.confirmationPhrase) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/account/archive-sales-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);

      toast.success(
        `${payload.conversations} conversaciones archivadas y ${payload.deals} oportunidades cerradas`
      );
      setOpen(false);
      await onArchived();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo completar la limpieza'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={openDialog}
        disabled={!canArchive}
        title={canArchive ? undefined : 'Requiere rol de administrador'}
      >
        <Archive className="mr-1 h-4 w-4" />
        Limpiar campaña anterior
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Archivar y reiniciar ventas
            </DialogTitle>
            <DialogDescription>
              Conservaremos contactos, mensajes, pipelines e historial. Las
              conversaciones activas pasarán a cerradas y las oportunidades
              abiertas a perdidas.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="text-muted-foreground flex items-center justify-center py-8">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparando vista previa…
            </div>
          ) : preview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="border-border bg-muted/40 rounded-lg border p-3">
                  <p className="text-2xl font-semibold">
                    {preview.conversations}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Conversaciones activas
                  </p>
                </div>
                <div className="border-border bg-muted/40 rounded-lg border p-3">
                  <p className="text-2xl font-semibold">{preview.deals}</p>
                  <p className="text-muted-foreground text-xs">
                    Oportunidades abiertas
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="archive-confirmation">
                  Escribe <strong>{preview.confirmationPhrase}</strong> para
                  confirmar
                </Label>
                <Input
                  id="archive-confirmation"
                  className="mt-2"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={
                !preview ||
                submitting ||
                confirmation !== preview.confirmationPhrase
              }
              onClick={archiveWorkspace}
            >
              {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Archivar ahora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
