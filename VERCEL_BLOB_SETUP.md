# Configuración de Vercel Blob Storage

## Por qué Vercel Blob?

Vercel Blob Storage es la solución perfecta para alojar archivos de audio que Twilio necesita descargar:

- ✅ **Gratis**: Hasta 500MB incluidos en el plan Free
- ✅ **Rápido**: CDN global integrado
- ✅ **Compatible con Twilio**: URLs públicas con headers correctos
- ✅ **Sin configuración**: No requiere buckets ni políticas RLS
- ✅ **Integrado con Vercel**: Deploy automático

## Setup

### 1. Crear Blob Store en Vercel

1. Ve a tu dashboard de Vercel: https://vercel.com/dashboard
2. Click en "Storage" en el menú lateral
3. Click en "Create Database"
4. Selecciona "Blob"
5. Dale un nombre (ej: "tuqui-audio")
6. Click en "Create"

### 2. Copiar el Token

1. Una vez creado, ve a la pestaña "Settings"
2. Copia el `BLOB_READ_WRITE_TOKEN`

### 3. Agregar Variable de Entorno

#### En Vercel Dashboard:
1. Ve a tu proyecto → Settings → Environment Variables
2. Agrega:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXXXXX
   ```
3. Asegúrate de seleccionar todos los entornos (Production, Preview, Development)

#### En Local (.env.local):
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXXXXX
```

### 4. Redeploy

Después de agregar la variable:
- En Vercel: Se redeployará automáticamente
- En Local: Reinicia el servidor de desarrollo

## Verificación

Después del próximo deploy, cuando envíes un audio, verás en los logs:

```
[TTS] Audio uploaded to Vercel Blob. URL: https://XXXXX.public.blob.vercel-storage.com/briefings/USER_ID/TIMESTAMP.wav
```

Esta URL será accesible públicamente por Twilio.

## Costos

Plan Free de Vercel incluye:
- **500MB** de storage
- **Bandwidth ilimitado** para archivos públicos
- **Sin límite** de requests

Un archivo de audio típico de 1 minuto = ~500KB
- Puedes almacenar ~1000 briefings
- Los archivos viejos se pueden limpiar automáticamente

## Alternativa: Supabase Storage

Si prefieres usar Supabase, el código tiene un fallback automático. Solo necesitas:

1. Ir a Supabase Dashboard → Storage
2. Crear bucket `briefings` con opción "Public"
3. Agregar política RLS para lectura pública

Pero Vercel Blob es más simple y confiable para este caso de uso.
