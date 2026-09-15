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
  const [sdkError, setSdkError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connectionStage, setConnectionStage] = useState<string | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const codeRef = useRef<string | null>(null)
  const signupInfoRef = useRef<SignupInfo | null>(null)
  const completingRef = useRef(false)
  const handshakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearHandshakeTimeout() {
    if (handshakeTimeoutRef.current) {
      clearTimeout(handshakeTimeoutRef.current)
      handshakeTimeoutRef.current = null
    }
  }

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

    let active = true
    let initialized = false
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let failTimer: ReturnType<typeof setTimeout> | null = null

    const initialize = () => {
      if (!active || initialized || !window.FB) return false
      try {
        window.FB.init({
          appId: bootstrap.app_id,
          cookie: true,
          xfbml: false,
          version: bootstrap.graph_version,
        })
        initialized = true
        setSdkError(null)
        setSdkReady(true)
        if (pollTimer) clearInterval(pollTimer)
        if (failTimer) clearTimeout(failTimer)
        return true
      } catch (error) {
        console.error('[embedded-signup] Meta SDK init failed:', error)
        setSdkReady(false)
        setSdkError('Meta cargó, pero el SDK no pudo inicializarse. Recarga la página e inténtalo de nuevo.')
        return false
      }
    }

    const onScriptError = () => {
      if (!active) return
      setSdkReady(false)
      setSdkError(
        'No se pudo cargar el SDK de Meta. Desactiva bloqueadores para connect.facebook.net y recarga la página.',
      )
    }

    setSdkReady(false)
    setSdkError(null)

    if (!initialize()) {
      const existing = document.getElementById('facebook-jssdk') as HTMLScriptElement | null
      if (existing) {
        existing.addEventListener('load', initialize)
        existing.addEventListener('error', onScriptError)
      } else {
        const script = document.createElement('script')
        script.id = 'facebook-jssdk'
        script.async = true
        script.defer = true
        script.crossOrigin = 'anonymous'
        script.src = 'https://connect.facebook.net/en_US/sdk.js'
        script.addEventListener('load', initialize)
        script.addEventListener('error', onScriptError)
        document.body.appendChild(script)
      }

      pollTimer = setInterval(() => {
        initialize()
      }, 250)

      failTimer = setTimeout(() => {
        if (!active || initialized) return
        if (pollTimer) clearInterval(pollTimer)
        setSdkReady(false)
        setSdkError(
          'Meta no terminó de cargar. Revisa bloqueadores de contenido o protección anti-rastreo y recarga la página.',
        )
      }, 10000)
    }

    return () => {
      active = false
      if (pollTimer) clearInterval(pollTimer)
      if (failTimer) clearTimeout(failTimer)
      const script = document.getElementById('facebook-jssdk') as HTMLScriptElement | null
      script?.removeEventListener('load', initialize)
      script?.removeEventListener('error', onScriptError)
    }
  }, [bootstrap])

  useEffect(() => {
    return () => clearHandshakeTimeout()
  }, [])

  async function completeSignup() {
    const code = codeRef.current
    const info = signupInfoRef.current
    if (!code || !info?.waba_id || completingRef.current) return

    clearHandshakeTimeout()
    completingRef.current = true
    setConnectionStage('Finalizando la conexión con Meta…')
    const controller = new AbortController()
    const backendTimeout = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch('/api/oauth/meta/whatsapp/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
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
      setConnectionStage(null)
      await onConnected?.()
    } catch (error) {
      codeRef.current = null
      signupInfoRef.current = null
      setConnectionStage(null)
      toast.error(
        error instanceof DOMException && error.name === 'AbortError'
          ? 'Zynex recibió los datos de Meta, pero el backend tardó demasiado en completar el registro.'
          : error instanceof Error
            ? error.message
            : 'No se pudo conectar WhatsApp',
        { duration: 10000 },
      )
    } finally {
      clearTimeout(backendTimeout)
      clearHandshakeTimeout()
      completingRef.current = false
      setConnecting(false)
    }
  }

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (!event.origin?.endsWith('facebook.com')) return

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
        data?: { waba_id?: string; phone_number_id?: string; error_message?: string; current_step?: string }
      }
      if (message.type !== 'WA_EMBEDDED_SIGNUP') return

      console.info('[embedded-signup] session event:', message)

      if (message.event?.startsWith('FINISH') && message.data?.waba_id) {
        signupInfoRef.current = {
          waba_id: message.data.waba_id,
          phone_number_id: message.data.phone_number_id,
        }
        setConnectionStage(
          codeRef.current
            ? 'Meta autorizó la cuenta. Finalizando…'
            : 'Cuenta de WhatsApp seleccionada. Esperando autorización…',
        )
        void completeSignup()
      } else if (message.event === 'CANCEL') {
        clearHandshakeTimeout()
        setConnecting(false)
        setConnectionStage(null)
        if (message.data?.current_step) {
          toast.error(`El registro se canceló en Meta (${message.data.current_step}).`)
        }
      } else if (message.event === 'ERROR') {
        clearHandshakeTimeout()
        setConnecting(false)
        setConnectionStage(null)
        toast.error(message.data?.error_message || 'Meta no pudo completar la conexión de WhatsApp')
      }
    }

    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  })

  function launchSignup() {
    if (!bootstrap || !window.FB || !sdkReady) {
      toast.error(sdkError || 'La conexión con Meta todavía no está lista')
      return
    }
    if (!/^\d{6}$/.test(pin)) {
      toast.error('Crea un PIN de exactamente 6 dígitos')
      return
    }

    clearHandshakeTimeout()
    codeRef.current = null
    signupInfoRef.current = null
    setConnecting(true)
    setConnectionStage('Completa el proceso en la ventana de Meta…')
    handshakeTimeoutRef.current = setTimeout(() => {
      if (!completingRef.current) {
        const gotCode = Boolean(codeRef.current)
        const gotSession = Boolean(signupInfoRef.current?.waba_id)
        codeRef.current = null
        signupInfoRef.current = null
        setConnecting(false)
        setConnectionStage(null)
        toast.error(
          gotCode && !gotSession
            ? 'Meta autorizó el inicio de sesión, pero no devolvió los datos de la cuenta de WhatsApp. Reintenta el registro.'
            : !gotCode && gotSession
              ? 'Meta devolvió la cuenta de WhatsApp, pero no entregó el código de autorización. Reintenta el registro.'
              : 'Meta no completó el registro. Reintenta sin bloqueadores de contenido y completa todo el flujo de WhatsApp.',
          { duration: 10000 },
        )
      }
      handshakeTimeoutRef.current = null
    }, 90000)

    window.FB.login(
      (response) => {
        console.info('[embedded-signup] login response:', response)
        const code = response.authResponse?.code
        if (!code) {
          clearHandshakeTimeout()
          setConnecting(false)
          setConnectionStage(null)
          toast.error(
            response.status === 'connected'
              ? 'Meta inició sesión, pero no devolvió el código de autorización requerido. Intenta nuevamente.'
              : 'La conexión con Meta fue cancelada o no se completó',
            { duration: 10000 },
          )
          return
        }
        codeRef.current = code
        setConnectionStage(
          signupInfoRef.current?.waba_id
            ? 'Meta autorizó la cuenta. Finalizando…'
            : 'Autorización recibida. Esperando los datos de WhatsApp…',
        )
        void completeSignup()
      },
      {
        config_id: bootstrap.config_id,
        auth_type: 'rerequest',
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          sessionInfoVersion: '3',
        },
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
      {sdkError ? (
        <p className="text-sm text-destructive">{sdkError}</p>
      ) : !sdkReady ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Preparando conexión con Meta…
        </p>
      ) : null}
      {connecting && connectionStage ? (
        <p className="text-sm text-muted-foreground">{connectionStage}</p>
      ) : null}
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
