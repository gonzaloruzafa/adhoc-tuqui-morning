# ✅ Checklist Final - Vercel Configuration

## 🔴 Problema Actual

- ✅ Texto llega a WhatsApp
- ❌ Audio NO llega (404 en Vercel Blob)
- ❌ Botón "Sí" no implementado

## 📋 Variables de Entorno Requeridas

Ve a: https://vercel.com/dashboard → Tu proyecto → Settings → Environment Variables

Deberías tener estas variables configuradas:

### 1. BLOB_READ_WRITE_TOKEN ⚠️ CRÍTICO
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXXXXX
```
- **Status**: ❌ Parece que no está configurado correctamente
- **Cómo obtenerlo**: Dashboard → Storage → Tu Blob Store → Settings → Copy token
- **Ambientes**: Production, Preview, Development

### 2. TAVILY_API_KEY (para noticias)
```
TAVILY_API_KEY=tvly-dev-XXXXX (obtenerlo de tuqui-agents-alpha/.env.local)
```
- **Status**: ⚠️ Falta agregar
- **Cómo obtenerlo**: Ya lo tenés en tuqui-agents-alpha/.env.local
- **Ambientes**: Production, Preview, Development

### 3. Otras Variables (ya deberían estar)
- ✅ AUTH_SECRET
- ✅ AUTH_GOOGLE_ID
- ✅ AUTH_GOOGLE_SECRET
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ ENCRYPTION_KEY
- ✅ GEMINI_API_KEY
- ✅ TWILIO_ACCOUNT_SID
- ✅ TWILIO_AUTH_TOKEN
- ✅ TWILIO_WHATSAPP_NUMBER

## 🔧 Pasos para Arreglar

### Paso 1: Verificar BLOB_READ_WRITE_TOKEN

1. Ve a Vercel Dashboard → Storage
2. Click en tu Blob Store "tuqui-audio" (o como lo hayas llamado)
3. Ve a "Settings"
4. **Copia el token** (debería empezar con `vercel_blob_rw_`)
5. Ve a tu proyecto → Settings → Environment Variables
6. Busca `BLOB_READ_WRITE_TOKEN`
   - Si **NO existe**: Click "Add New" → Pega el token → Selecciona TODOS los ambientes
   - Si **existe**: Verifica que el valor sea correcto

### Paso 2: Agregar TAVILY_API_KEY

1. Ve a tu proyecto → Settings → Environment Variables
2. Click "Add New"
3. Name: `TAVILY_API_KEY`
4. Value: [obtener de tuqui-agents-alpha/.env.local]
5. Selecciona: Production, Preview, Development
6. Save

### Paso 3: Forzar Redeploy

Después de agregar/verificar las variables:

1. Ve a Deployments
2. Click en los "..." del último deployment
3. Click "Redeploy"
4. Espera ~2 minutos

### Paso 4: Probar

1. Ve a tu app en producción
2. Asegúrate que la ventana de WhatsApp esté activa (envía "hola" si no)
3. Click "Forzar Envío Ahora"
4. Revisa logs de Vercel
5. **Deberías ver**:
   ```
   [TTS] Audio uploaded to Vercel Blob. URL: https://...blob.vercel-storage.com/...
   [Twilio] Sending audio message. URL: https://...blob.vercel-storage.com/...
   [Twilio] Audio message sent successfully
   ```
6. **Y en WhatsApp**: Audio + texto

## 🔍 Debugging

Si sigue sin funcionar después de los pasos:

### Verificar que el token esté activo
```bash
curl -I https://jqcanvy0qhkpblgc.public.blob.vercel-storage.com/briefings/test.wav
```

Debería retornar headers con `access-control-allow-origin: *`

### Verificar logs de error
Ve a Vercel Dashboard → Logs → Busca "TTS" o "Blob"

Si ves errores como:
- `Unauthorized` → Token incorrecto
- `Forbidden` → Token sin permisos de escritura
- `Invalid token` → Token no configurado

## 📊 Estado Esperado

Después de configurar correctamente:

| Componente | Estado Actual | Estado Esperado |
|---|---|---|
| Texto WhatsApp | ✅ Funciona | ✅ Funciona |
| Audio WhatsApp | ❌ No llega (404) | ✅ Llega |
| Botón "Sí" | ❌ No implementado | ⏳ Futuro (requiere Content Template) |
| Noticias | ⚠️ Sin API key | ✅ Con Tavily |

## 🎯 Siguiente Paso

**AHORA**: Ve a Vercel Dashboard y verifica/agrega las dos variables de entorno mencionadas arriba.

Después de redeploy, probá de nuevo y avisame qué ves en los logs!
