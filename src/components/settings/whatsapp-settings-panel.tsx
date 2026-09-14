'use client'

import { useState } from 'react'
import { ChevronDown, Wrench } from 'lucide-react'
import { WhatsAppEmbeddedSignup } from './whatsapp-embedded-signup'
import { WhatsAppConfig } from './whatsapp-config'
import { SettingsPanelHead } from './settings-panel-head'
import { Button } from '@/components/ui/button'

export function WhatsAppSettingsPanel() {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <section className="max-w-3xl animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title="WhatsApp"
        description="Conecta tus números de WhatsApp Business sin copiar credenciales técnicas."
      />

      <div className="space-y-4">
        <WhatsAppEmbeddedSignup
          key={refreshKey}
          onConnected={() => setRefreshKey((value) => value + 1)}
        />

        <div className="rounded-xl border border-dashed">
          <Button
            type="button"
            variant="ghost"
            className="flex h-auto w-full items-center justify-between gap-3 px-4 py-3"
            onClick={() => setShowAdvanced((value) => !value)}
          >
            <span className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              Configuración avanzada y diagnóstico
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                showAdvanced ? 'rotate-180' : ''
              }`}
            />
          </Button>

          {showAdvanced && (
            <div className="border-t p-4">
              <p className="mb-4 text-sm text-muted-foreground">
                Esta sección es para soporte, migraciones o configuraciones manuales.
                Normalmente no necesitas modificar estos datos.
              </p>
              <WhatsAppConfig />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
