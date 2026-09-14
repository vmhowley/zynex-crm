'use client'

import { useState } from 'react'
import { MessageCircleMore } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function WhatsAppEmbeddedSignup() {
  const [displayName, setDisplayName] = useState('')
  const [pin, setPin] = useState('')

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div>
        <p className="font-medium">Conecta WhatsApp con Meta</p>
        <p className="text-sm text-muted-foreground">
          Meta te guiará para seleccionar tu negocio y número de WhatsApp.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="embedded-wa-name">Nombre de la conexión</Label>
          <Input
            id="embedded-wa-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Ej. Ventas o Soporte"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="embedded-wa-pin">PIN de seguridad (6 dígitos)</Label>
          <Input
            id="embedded-wa-pin"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
          />
        </div>
      </div>
      <Button type="button" disabled={!/^\d{6}$/.test(pin)} className="gap-2 bg-green-600 hover:bg-green-700">
        <MessageCircleMore className="h-4 w-4" />
        Conectar con Meta
      </Button>
    </div>
  )
}
