# 🚨 INCIDENTE DE SEGURIDAD - ACCIÓN REQUERIDA

## ⚠️ Qué Pasó

GitGuardian detectó que **2 API keys fueron expuestos** en commits anteriores:

1. ❌ **Vercel Blob Token** - Expuesto en `CHECKLIST_VERCEL.md` y `DEBUG_AUDIO.md`
2. ❌ **Tavily API Key** - Expuesto en múltiples archivos de documentación

Aunque los archivos fueron limpiados, **los tokens siguen en el historial de Git** (commits anteriores).

## 🔥 ACCIÓN INMEDIATA REQUERIDA

### 1. Rotar Vercel Blob Token (CRÍTICO)

**Por qué**: El token tiene acceso de escritura a tu storage. Alguien podría:
- Subir archivos maliciosos
- Consumir tu cuota de storage
- Eliminar archivos existentes

**Cómo rotarlo**:

1. Ve a Vercel Dashboard: https://vercel.com/dashboard
2. Ve a Storage → Tu Blob Store
3. Click en "Settings"
4. Busca "Rotate Token" o "Regenerate Token"
5. Click y confirma
6. **Copia el NUEVO token**

7. Actualiza en tu proyecto:
   - Vercel Dashboard → Tu proyecto → Settings → Environment Variables
   - Edita `BLOB_READ_WRITE_TOKEN`
   - Pega el NUEVO token
   - Save

8. Redeploy:
   - Deployments → ... → Redeploy

### 2. Verificar Tavily API Key (IMPORTANTE)

**Por qué**: Aunque es solo para búsqueda de noticias, alguien podría:
- Consumir tu cuota de requests
- Generar costos si estás en plan pago

**Opciones**:

**Opción A - Rotar** (recomendado si es fácil):
1. Ve a Tavily Dashboard
2. Genera nuevo API key
3. Actualiza en Vercel Environment Variables
4. Actualiza en tuqui-agents-alpha/.env.local

**Opción B - Monitorear**:
1. Ve a Tavily Dashboard
2. Chequea usage reciente
3. Si ves requests sospechosos → Rotar inmediatamente

### 3. Verificar Actividad Sospechosa

**Vercel Blob Storage**:
1. Dashboard → Storage → Tu Blob Store → Files
2. Verifica que no haya archivos extraños
3. Chequea el tamaño total del storage

**Vercel Logs**:
1. Dashboard → Logs
2. Busca requests sospechosos en las últimas horas
3. Filtra por `/api/` para ver llamadas a APIs

## ✅ Después de Rotar

Una vez rotados los tokens:

1. ✅ Los tokens viejos dejan de funcionar
2. ✅ El riesgo de seguridad desaparece
3. ✅ El historial de Git sigue teniendo los tokens viejos, pero ya no sirven

## 📚 Lecciones Aprendidas

### ❌ NO hacer:
- Incluir tokens/keys directamente en archivos de documentación
- Commitear archivos con valores reales de secrets
- Usar tokens de producción en ejemplos

### ✅ Hacer en el futuro:
- Usar placeholders: `TAVILY_API_KEY=tvly-dev-XXXXX`
- Documentar DÓNDE obtener el token, no el token mismo
- Verificar antes de commitear: `git diff` para revisar cambios
- Usar `.env.local` (ya gitignored) para valores reales

## 🔐 Estado Actual

- ✅ Archivos limpiados en el último commit
- ⏳ Tokens viejos todavía en historial de Git (commits anteriores)
- ⚠️ Acción requerida: Rotar tokens

## 📞 Prioridad de Acciones

1. **AHORA** (Crítico): Rotar Vercel Blob Token
2. **HOY** (Importante): Verificar/Rotar Tavily API Key
3. **Esta Semana** (Opcional): Considerar limpiar historial de Git con BFG Repo-Cleaner

---

**PRÓXIMO PASO**: Ve a Vercel Dashboard y **rota el Blob Token inmediatamente**.
