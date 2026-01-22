# 🔍 DEBUG: Audio No Funciona

## 🚨 Problema Actual

- ✅ Texto llega a WhatsApp
- ❌ Audio NO se genera ni envía
- ❌ Tavily API key no se está levantando

## 📊 Qué Buscar en los Logs (DESPUÉS DEL REDEPLOY)

Después de que se redespliegue con los nuevos logs, hacé lo siguiente:

### 1. Abrí los Logs de Vercel en Tiempo Real

1. Ve a: https://vercel.com/dashboard
2. Tu proyecto → Logs
3. Click en "Live" (arriba a la derecha)
4. **Dejalo abierto**

### 2. Forzá un Envío

1. Ve a tu app: https://adhoc-tuqui-morning.vercel.app
2. Click en "Forzar Envío Ahora"

### 3. Buscá Estos Logs (en orden)

Deberías ver esta secuencia:

```
✅ [Trigger Pipeline] 🚀 Starting pipeline for run XXXXX
✅ [Trigger Pipeline] Base URL: https://...
✅ [Trigger Pipeline] Pipeline response: 200 OK
✅ [Run Pipeline] 🎬 Starting pipeline execution for run: XXXXX
✅ Token expired for gr@adhoc.inc, refreshing... (o token válido)
✅ [Gmail] Listing messages with query: ...
✅ [Calendar] Fetching events for today...
✅ [TTS] 📤 Uploading audio to Vercel Blob: briefings/USER_ID/TIMESTAMP.wav
✅ [TTS] ✅ Audio uploaded to Vercel Blob. URL: https://...
✅ [TTS] 🔍 URL accessibility test: 200 OK
✅ [Twilio] Sending audio message. URL: https://...
✅ [Twilio] Audio message sent successfully. SID: MM...
✅ [Run Pipeline] ✅ Pipeline completed successfully
```

## ❌ Si Ves Errores

### Error 1: "BLOB_READ_WRITE_TOKEN not found"
```
[TTS] ❌ BLOB_READ_WRITE_TOKEN not found!
[TTS] Falling back to Supabase Storage...
```

**Solución**: El token no está en Vercel. Ve a:
- Settings → Environment Variables
- Verifica que `BLOB_READ_WRITE_TOKEN` exista
- Si existe, **redeploy manualmente** (Deployments → ... → Redeploy)

### Error 2: "TAVILY_API_KEY missing"
```
[Warning] TAVILY_API_KEY missing, skipping news fetch
```

**Solución**: Agrega la variable:
```
Name: TAVILY_API_KEY
Value: [obtener de tuqui-agents-alpha/.env.local]
Environments: All (Production, Preview, Development)
```

Luego **redeploy**.

### Error 3: "Pipeline failed" o "Timeout"
```
[Run Pipeline] ❌ Pipeline failed for run XXXXX
Error: ...timeout...
```

**Causa**: La función de Vercel tiene timeout de 10s (free tier) o 60s (pro).

**Soluciones**:
1. El pipeline es demasiado lento (Gmail, Calendar, TTS, etc.)
2. Necesitas upgrade a Vercel Pro (60s timeout)
3. O usar un job queue (Inngest, Trigger.dev, etc.)

### Error 4: "URL returned 404"
```
[TTS] ⚠️ URL returned 404 - Twilio might fail to download
```

**Causa**: Archivo no existe en Vercel Blob.

**Solución**: Crear bucket en Supabase (ver SOLUCION_AUDIO.md)

### Error 5: No logs del pipeline
```
[Trigger Pipeline] 🚀 Starting pipeline...
[Trigger Pipeline] Pipeline response: 500 Internal Server Error
```

**Causa**: El endpoint run-pipeline está crasheando.

**Solución**: Revisar el error específico en los logs.

## 🔧 Acciones Inmediatas

### Paso 1: Esperar Redeploy (2 minutos)

El código con logging ya se pusheó. Vercel va a redesplegar automáticamente.

### Paso 2: Agregar TAVILY_API_KEY

Mientras esperas el redeploy:

1. Ve a Vercel → Settings → Environment Variables
2. Add New:
   ```
   Name: TAVILY_API_KEY
   Value: [obtener de tuqui-agents-alpha/.env.local]
   ```
3. Selecciona TODOS los ambientes
4. Save

### Paso 3: Verificar BLOB_READ_WRITE_TOKEN

1. Settings → Environment Variables
2. Busca `BLOB_READ_WRITE_TOKEN`
3. Debe empezar con: `vercel_blob_rw_...` (token desde Vercel Storage Dashboard)
4. Debe estar en: Production, Preview, Development

### Paso 4: Forzar Redeploy Manual

Después de agregar Tavily:

1. Ve a Deployments
2. Click en "..." del último deployment
3. Click "Redeploy"
4. Espera ~2 minutos

### Paso 5: Probar con Logs Abiertos

1. Abrí los logs en tiempo real (Vercel Dashboard → Logs → Live)
2. Ve a tu app
3. Click "Forzar Envío Ahora"
4. **Mirá los logs en tiempo real**
5. Copiá TODOS los logs que aparezcan
6. Mandámelos para analizar

## 📋 Checklist Completo

- [ ] Redeploy automático completado
- [ ] TAVILY_API_KEY agregada
- [ ] BLOB_READ_WRITE_TOKEN verificada
- [ ] Redeploy manual después de agregar Tavily
- [ ] Logs de Vercel abiertos en Live mode
- [ ] "Forzar Envío Ahora" ejecutado
- [ ] Logs copiados para análisis

## 🎯 Qué Esperar

Si todo está bien configurado, deberías ver:

1. ✅ Pipeline se ejecuta sin errores
2. ✅ Audio se genera y sube (con URL de Vercel Blob o Supabase)
3. ✅ URL del audio es accesible (test retorna 200)
4. ✅ Twilio envía el audio
5. ✅ Audio llega a WhatsApp

Si algo falla, **los nuevos logs te dirán exactamente QUÉ y DÓNDE**.
