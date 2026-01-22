# Configuración de Supabase Storage para Audio

## Problema Actual

Twilio reporta error `63019: Media failed to download` al intentar descargar los archivos de audio desde Supabase.

**URL del audio que falla:**
```
https://krztsxhnolponajenjtz.supabase.co/storage/v1/object/public/briefings/e1d395a5-55c7-4db4-9467-87fd30cba849/1769040137898.wav
```

## Solución: Configurar Bucket Público

### Pasos en Supabase Dashboard:

1. **Ir a Storage** en el dashboard de Supabase
   - URL: https://supabase.com/dashboard/project/krztsxhnolponajenjtz/storage/buckets

2. **Verificar/Crear el bucket `briefings`**
   - Si no existe, crear con el botón "New bucket"
   - Nombre: `briefings`
   - **IMPORTANTE**: Marcar "Public bucket" ✅

3. **Configurar Políticas de Acceso (RLS)**

   Ir a "Policies" del bucket `briefings` y agregar:

   **Policy 1: Public Read Access**
   ```sql
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'briefings');
   ```

   **Policy 2: Authenticated Upload**
   ```sql
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'briefings');
   ```

4. **Configurar CORS (si es necesario)**

   En la configuración del bucket, agregar:
   ```json
   {
     "allowedOrigins": ["*"],
     "allowedMethods": ["GET", "HEAD"],
     "allowedHeaders": ["*"],
     "maxAge": 3600
   }
   ```

## Verificación

Después de configurar, verificar que la URL pública funciona:

```bash
curl -I https://krztsxhnolponajenjtz.supabase.co/storage/v1/object/public/briefings/ARCHIVO.wav
```

Debe retornar `200 OK` con headers:
```
Content-Type: audio/wav
Access-Control-Allow-Origin: *
```

## Alternativa: Usar otro CDN

Si Supabase Storage sigue dando problemas con Twilio, considerar:

1. **Cloudflare R2** - Compatible con S3, gratis hasta 10GB
2. **Vercel Blob Storage** - Integrado con Vercel
3. **AWS S3** - Estándar de la industria

## Formato de Audio

Actualmente usando:
- Formato: WAV (PCM 16-bit)
- Sample Rate: 24kHz
- Channels: Mono

Si persisten problemas, considerar convertir a MP3 (más compatible con Twilio).
