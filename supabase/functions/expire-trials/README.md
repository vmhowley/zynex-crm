# Expire Trials Cron Job

## Opción 1: Usando Supabase Edge Function + Cron externo

### 1. Desplegar la función
```bash
supabase functions deploy expire-trials
```

### 2. Configurar cron externo
Usa servicios como:
- https://cron-job.org
- https://easycron.com
- GitHub Actions

URL del endpoint: `https://tu-proyecto.supabase.co/functions/v1/expire-trials`

---

## Opción 2: Usando pg_cron (si está disponible en tu plan)

```sql
-- Habilitar extensión (si tu plan lo permite)
CREATE EXTENSION pg_cron;

-- Programar ejecución cada hora
SELECT cron.schedule(
  'expire-trials-job',
  '0 * * * *',
  $$SELECT expire_trials_and_suspend()$$
);
```

---

## Probar manualmente

```sql
SELECT expire_trials_and_suspend();
```
