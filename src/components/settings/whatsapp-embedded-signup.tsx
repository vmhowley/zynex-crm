'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, MessageCircleMore } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Bootstrap = {
  app_id: string
  config_id: string
  graph_version: string
}

type SignupInfo = {
  waba_id: string
  phone_number_id?: string
}

type LoginResponse = {
  status?: string
  authResponse?: { code?: string }
}

type MetaSdk = {
  init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void
  login: (
    callback: (response: LoginResponse) => void,
    options: Record<string, unknown>,
  ) => void
}

declare global {
  interface Window {
    FB?: MetaSdk
  }
}

export function WhatsAppEmbeddedSignup({
  onConnected,
}: {
  onConnected?: () => void | Promise<void>
}) {
  const [displayName, setDisplayName] = useState('')
  const [pin, setPin] = useState('')
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const codeRef = useRef<string | null>(null)
  const signupInfoRef = useRef<SignupInfo | null>(null)
  const completingRef = useRef(false)

  useEffect(() => {
    let active = true
    fetch('/api/oauth/meta/whatsapp/bootstrap', { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Embedded Signup unavailable')
        if (active) setBootstrap(body)
      })
      .catch((error) => {
        console.warn('[embedded-signup] bootstrap:', error)
      })
      .finally(() => {
        if (active) setLoadingConfig(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!bootstrap) return

    const initialize = () => {
      if (!window.FB) return
      window.FB.init({
        appId: bootstrap.app_id,
        cookie: true,
        xfbml: false,
        version: bootstrap.graph_version,
      })
      setSdkReady(true)
    }

    if (window.FB) {
      initialize()
      return
    }

    const existing = document.getElementById('facebook-jssdk') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', initialize, { once: true })
      return () => existing.removeEventListener('load', initialize)
    }

    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.addEventListener('load', initialize, { once: true })
    document.body.appendChild(script)
    return () => script.removeEventListener('load', initialize)
  }, [bootstrap])

  async function completeSignup() {
    const code = codeRef.current
    const info = signupInfoRef.current
    if (!code || !info?.waba_id || completingRef.current) return

    completingRef.current = true
    try {
      const response = await fetch('/api/oauth/meta/whatsapp/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          waba_id: info.waba_id,
          phone_number_id: info.phone_number_id,
          display_name: displayName || undefined,
          pin,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'No se pudo conectar WhatsApp')

      toast.success(
        body.connection?.display_phone_number
          ? `WhatsApp ${body.connection.display_phone_number} conectado`
          : 'WhatsApp conectado correctamente',
      )
      codeRef.current = null
      signupInfoRef.current = null
      setDisplayName('')
      setPin('')
      await onConnected?.()
    } catch (error) {
      codeRef.current = null
      signupInfoRef.current = null
      toast.error(error instanceof Error ? error.message : 'No se pudo conectar WhatsApp', {
        duration: 10000,
      })
    } finally {
      completingRef.current = false
      setConnecting(false)
    }
  }

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) return

      let payload: unknown = event.data
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload)
        } catch {
          return
        }
      }
      if (!payload || typeof payload !== 'object') return

      const message = payload as {
        type?: string
        event?: string
        data?: { waba_id?: string; phone_number_id?: string }
      }
      if (message.type !== 'WA_EMBEDDED_SIGNUP') return

      if (message.event?.startsWith('FINISH') && message.data?.waba_id) {
        signupInfoRef.current = {
          waba_id: message.data.waba_id,
          phone_number_id: message.data.phone_number_id,
        }
        void completeSignup()
      } else if (message.event === 'CANCEL') {
        setConnecting(false)
      } else if (message.event === 'ERROR') {
        setConnecting(false)
        toast.error('Meta no pudo completar la conexión de WhatsApp')
      }
    }

    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  })

  function launchSignup() {
    if (!bootstrap || !window.FB || !sdkReady) {
      toast.error('La conexión con Meta todavía no está lista')
      return
    }
    if (!/^\d{6}$/.test(pin)) {
      toast.error('Crea un PIN de exactamente 6 dígitos')
      return
    }

    codeRef.current = null
    signupInfoRef.current = null
    setConnecting(true)

    window.FB.login(
      (response) => {
        const code = response.authResponse?.code
        if (!code) {
          setConnecting(false)
          if (response.status !== 'connected') {
            toast.error('La conexión con Meta fue cancelada o no se completó')
          }
          return
        }
        codeRef.current = code
        void completeSignup()
      },
      {
        config_id: bootstrap.config_id,
        auth_type: 'rerequest',
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {} },
      },
    )
  }

  if (loadingConfig) {
    return (
      <Button disabled variant="outline">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Preparando Meta
      </Button>
    )
  }

  if (!bootstrap) {
    return (
      <p className="text-sm text-muted-foreground">
        Embedded Signup aún no está habilitado por el administrador de Zynex.
      </p>
    )
  }

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
            disabled={connecting}
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
            disabled={connecting}
          />
        </div>
      </div>
      <Button
        type="button"
        onClick={launchSignup}
        disabled={!sdkReady || connecting || !/^\d{6}$/.test(pin)}
        className="gap-2 bg-green-600 hover:bg-green-700"
      >
        {connecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircleMore className="h-4 w-4" />
        )}
        {connecting ? 'Conectando…' : 'Conectar con Meta'}
      </Button>
    </div>
  )
}
