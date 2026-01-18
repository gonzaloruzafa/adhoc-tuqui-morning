# ANTIGRAVITY - Especificación Técnica Completa

## 📋 Documento de Especificación para Desarrollo

**Versión:** 1.0  
**Fecha:** 2026-01-17  
**Autor:** Gonzalo Ruzafa / Adhoc S.A.  
**Para:** Desarrollo con LLMs / Agentes de código

---

## 1. VISIÓN DEL PRODUCTO

### 1.1 Propuesta de Valor (One-liner)
> "Tu copiloto de la mañana: un audio de 60-90 segundos que te ordena el día mientras manejás al trabajo."

### 1.2 Experiencia Usuario Target
El usuario se levanta, sube al auto, ya tiene un audio esperándolo en WhatsApp. Lo escucha mientras maneja. Llega al trabajo sabiendo qué es importante hoy.

### 1.3 Por qué funciona
- **Manos libres, ojos en la ruta** - no compite con "abrir Gmail"
- **Momento capturado** - el commute ya existe, lo aprovechamos
- **Sensación de "alguien me preparó el día"** - personalización + voz humana
- **Es ritual, no tarea** - genera hábito

### 1.4 Competencia
- Compite con: podcasts, radio, silencio
- NO compite con: apps de email, calendarios
- Diferenciador: **audio + personalizado + accionable**

---

## 2. SCOPE MVP v0

### 2.1 Incluye ✅
| Feature | Descripción |
|---------|-------------|
| Login Google OAuth | Sign-in con Google, obtiene tokens para Gmail/Calendar |
| Conectar Gmail | Read-only, scope mínimo |
| Conectar Calendar | Read-only, scope mínimo |
| Configurar horario | Hora del briefing (default 7:00 AM), timezone |
| Output Audio | 60-90 segundos, generado con TTS |
| Entrega WhatsApp | Via Twilio (ya configurado) |
| Fallback texto | Si TTS falla, manda texto por WhatsApp |
| Template fijo | Agenda + Emails importantes + Cierre |

### 2.2 NO Incluye (a propósito) ❌
- ❌ Google Drive
- ❌ Odoo / MercadoLibre
- ❌ Prompt personalizable por usuario
- ❌ Acciones (borrar, responder, enviar)
- ❌ Múltiples briefings por día
- ❌ App nativa (solo WhatsApp + web config)

---

## 3. USER STORIES

### 3.1 Core Flow
```
COMO usuario
QUIERO conectar mi Gmail y Calendar con Google OAuth
Y configurar una hora de briefing
PARA recibir cada mañana un audio en WhatsApp
que me resuma mis reuniones y emails importantes del día
```

### 3.2 Stories Detalladas

**US-001: Registro/Login**
```
COMO nuevo usuario
QUIERO registrarme con mi cuenta de Google
PARA que el sistema acceda a mi Gmail y Calendar
CRITERIOS:
- Login con Google OAuth 2.0
- Solicitar scopes: gmail.readonly, calendar.readonly
- Guardar tokens encriptados
- Crear tenant/user en DB
```

**US-002: Configuración de Briefing**
```
COMO usuario logueado
QUIERO configurar a qué hora recibir mi briefing
PARA que llegue antes de salir al trabajo
CRITERIOS:
- Selector de hora (default 7:00 AM)
- Selector de timezone (auto-detect + override)
- Toggle días de semana (default L-V)
- Input número WhatsApp (con validación)
```

**US-003: Recepción de Audio**
```
COMO usuario configurado
QUIERO recibir un audio de WhatsApp cada mañana
PARA escucharlo en el auto camino al trabajo
CRITERIOS:
- Audio llega a la hora configurada (±2 min)
- Duración 60-90 segundos
- Si falla audio, recibo texto
- Puedo reproducirlo múltiples veces
```

**US-004: Contenido del Briefing**
```
COMO usuario
QUIERO que el briefing incluya mis reuniones y emails importantes
PARA llegar al trabajo sabiendo qué onda
CRITERIOS:
- Lista reuniones del día (máx 5)
- Destaca reuniones importantes (externas, con keywords)
- Resume 2-3 emails importantes
- Usa heurísticas para determinar importancia
- Tono natural, no robótico
```

---

## 4. ARQUITECTURA TÉCNICA

### 4.1 Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| Frontend | Next.js 14 + TypeScript | Reusar de repos existentes |
| Auth | NextAuth.js + Google OAuth | Standard, bien documentado |
| Database | Supabase (Postgres) | Rápido setup, RLS, realtime |
| Backend Jobs | Vercel Cron + Edge Functions | Serverless, escala solo |
| TTS | Google Cloud TTS / ElevenLabs | Reusar de Tuqui |
| Delivery | Twilio WhatsApp API | Ya configurado |
| Storage | Cloudflare R2 / Supabase Storage | Para audios mp3 |
| LLM | Gemini 2.5 Flash | Reusar de Tuqui, costo bajo |

### 4.2 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  Login   │  │   Config     │  │   Status     │               │
│  │  Google  │  │   Schedule   │  │   Dashboard  │               │
│  └────┬─────┘  └──────┬───────┘  └──────────────┘               │
└───────┼───────────────┼─────────────────────────────────────────┘
        │               │
        ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  users │ oauth_tokens │ schedules │ runs │ outputs        │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┬─┘
                                                                 │
┌────────────────────────────────────────────────────────────────┼─┐
│                     CRON WORKERS                               │ │
│                                                                │ │
│  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  SCHEDULER (cada minuto)                                │   │ │
│  │  - Query schedules donde next_run <= now                │   │ │
│  │  - Para cada schedule: trigger run                      │   │ │
│  └─────────────────────────────────────────────────────────┘   │ │
│                           │                                    │ │
│                           ▼                                    │ │
│  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  RUN PIPELINE (30 min antes de hora configurada)        │   │ │
│  │                                                         │   │ │
│  │  1. Refresh OAuth token si necesario                    │   │ │
│  │  2. Fetch Calendar events (hoy, timezone usuario)       │   │ │
│  │  3. Fetch Gmail threads (últimos 50 / últimas 24h)      │   │ │
│  │  4. Apply heuristics → shortlist (máx 20 items)         │   │ │
│  │  5. LLM (Gemini) → genera script de audio               │   │ │
│  │  6. TTS → genera mp3 (60-90 seg)                        │   │ │
│  │  7. Upload mp3 a Storage                                │   │ │
│  │  8. Guardar output en DB (audio_url, text)              │   │ │
│  └─────────────────────────────────────────────────────────┘   │ │
│                           │                                    │ │
│                           ▼                                    │ │
│  ┌─────────────────────────────────────────────────────────┐   │ │
│  │  DELIVERY WORKER (a la hora configurada)                │   │ │
│  │                                                         │   │ │
│  │  1. Query outputs pendientes de delivery                │   │ │
│  │  2. Send via Twilio WhatsApp                            │   │ │
│  │     - Si hay audio: enviar audio                        │   │ │
│  │     - Si no hay audio: enviar texto (fallback)          │   │ │
│  │  3. Update delivered_at                                 │   │ │
│  │  4. Retry 3x con backoff si falla                       │   │ │
│  └─────────────────────────────────────────────────────────┘   │ │
└────────────────────────────────────────────────────────────────┴─┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │  Google    │  │  Google    │  │  Gemini    │  │  Twilio   │  │
│  │  Gmail API │  │  Calendar  │  │  2.5 Flash │  │  WhatsApp │  │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Data Model

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone_whatsapp TEXT, -- formato: +5491112345678
  timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OAuth tokens (encrypted)
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google', -- 'google'
  scopes TEXT[] NOT NULL, -- ['gmail.readonly', 'calendar.readonly']
  access_token_enc TEXT NOT NULL, -- AES-256 encrypted
  refresh_token_enc TEXT NOT NULL, -- AES-256 encrypted
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Briefing schedules
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  time_local TIME NOT NULL DEFAULT '07:00', -- hora local del usuario
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}', -- 0=Dom, 1=Lun, ..., 6=Sab
  enabled BOOLEAN DEFAULT true,
  -- Pre-compute next run for efficient querying
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- solo 1 schedule por usuario en MVP
);

-- Briefing runs (cada ejecución)
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Timing
  scheduled_for TIMESTAMPTZ NOT NULL, -- hora target
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  error_code TEXT,
  error_message TEXT,
  retries INTEGER DEFAULT 0,
  
  -- Metrics
  gmail_emails_fetched INTEGER,
  calendar_events_fetched INTEGER,
  llm_tokens_used INTEGER,
  tts_duration_seconds NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Briefing outputs
CREATE TABLE outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  text_content TEXT NOT NULL, -- transcript / fallback
  audio_url TEXT, -- URL al mp3 en storage
  audio_duration_seconds NUMERIC,
  
  -- Delivery
  delivery_channel TEXT DEFAULT 'whatsapp',
  delivered_at TIMESTAMPTZ,
  delivery_status TEXT, -- pending, sent, delivered, read, failed
  delivery_error TEXT,
  
  -- Engagement (tracking)
  played_at TIMESTAMPTZ, -- cuando reprodujo (si podemos trackear)
  completed_at TIMESTAMPTZ, -- si lo escuchó entero
  
  -- Expiration
  expires_at TIMESTAMPTZ, -- audio URLs expiran en 24h
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes para queries frecuentes
CREATE INDEX idx_schedules_next_run ON schedules(next_run_at) WHERE enabled = true;
CREATE INDEX idx_runs_status ON runs(status, scheduled_for);
CREATE INDEX idx_outputs_delivery ON outputs(delivery_status, created_at);
```

---

## 5. GOOGLE OAUTH CONFIGURATION

### 5.1 Scopes Requeridos (MÍNIMOS)
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
```

### 5.2 Google Cloud Console Setup
1. Crear proyecto en Google Cloud Console
2. Habilitar APIs: Gmail API, Google Calendar API
3. Configurar OAuth Consent Screen (External, test users para dev)
4. Crear OAuth 2.0 Client ID con redirect URIs

### 5.3 NextAuth.js Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/calendar.readonly",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
```

---

## 6. GMAIL INTEGRATION

### 6.1 Fetch Emails Function

```typescript
// lib/gmail.ts
import { google } from "googleapis";

interface EmailSummary {
  id: string;
  threadId: string;
  from: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  date: Date;
  hasAttachments: boolean;
  isUnread: boolean;
  labels: string[];
}

export async function fetchRecentEmails(
  accessToken: string,
  options: { maxResults?: number; hoursBack?: number } = {}
): Promise<EmailSummary[]> {
  const { maxResults = 50, hoursBack = 24 } = options;

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth });

  const afterTimestamp = Math.floor(
    (Date.now() - hoursBack * 60 * 60 * 1000) / 1000
  );

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: `in:inbox after:${afterTimestamp}`,
  });

  if (!response.data.messages) return [];

  const emails = await Promise.all(
    response.data.messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });

      const headers = detail.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

      const fromHeader = getHeader("From");
      const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/) || ["", fromHeader, fromHeader];

      return {
        id: msg.id!,
        threadId: msg.threadId!,
        from: fromMatch[1].replace(/"/g, "").trim(),
        fromEmail: fromMatch[2] || fromHeader,
        subject: getHeader("Subject"),
        snippet: detail.data.snippet || "",
        date: new Date(parseInt(detail.data.internalDate || "0")),
        hasAttachments: detail.data.payload?.parts?.some((p) => p.filename && p.filename.length > 0) || false,
        isUnread: detail.data.labelIds?.includes("UNREAD") || false,
        labels: detail.data.labelIds || [],
      };
    })
  );

  return emails;
}
```

### 6.2 Heurísticas de Importancia

```typescript
// lib/email-importance.ts

const URGENCY_KEYWORDS = [
  "urgent", "urgente", "asap", "immediate", "today", "hoy",
  "deadline", "vence", "overdue", "vencido", "important", "importante",
  "action required", "acción requerida", "reminder", "recordatorio",
];

const BUSINESS_KEYWORDS = [
  "invoice", "factura", "payment", "pago", "contract", "contrato",
  "proposal", "propuesta", "meeting", "reunión", "call", "llamada",
];

export function scoreEmailImportance(
  email: EmailSummary,
  userDomain: string,
  vipList: string[] = []
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // VIP sender (+50)
  if (vipList.some((vip) => email.fromEmail.toLowerCase().includes(vip.toLowerCase()))) {
    score += 50;
    reasons.push("VIP sender");
  }

  // Unread (+10)
  if (email.isUnread) {
    score += 10;
    reasons.push("Unread");
  }

  // External sender (+15)
  const emailDomain = email.fromEmail.split("@")[1]?.toLowerCase();
  if (emailDomain && emailDomain !== userDomain.toLowerCase()) {
    score += 15;
    reasons.push("External sender");
  }

  // Has attachments from external (+10)
  if (email.hasAttachments && emailDomain !== userDomain.toLowerCase()) {
    score += 10;
    reasons.push("External with attachments");
  }

  // Urgency keywords in subject (+30)
  const subjectLower = email.subject.toLowerCase();
  if (URGENCY_KEYWORDS.some((kw) => subjectLower.includes(kw))) {
    score += 30;
    reasons.push("Urgency keywords");
  }

  // Business keywords (+15)
  if (BUSINESS_KEYWORDS.some((kw) => subjectLower.includes(kw))) {
    score += 15;
    reasons.push("Business keywords");
  }

  // Gmail "Important" label (+20)
  if (email.labels.includes("IMPORTANT")) {
    score += 20;
    reasons.push("Gmail marked important");
  }

  return { score, reasons };
}

export function getTopImportantEmails(
  emails: EmailSummary[],
  userDomain: string,
  vipList: string[] = [],
  maxResults: number = 5
) {
  return emails
    .map((e) => ({ email: e, ...scoreEmailImportance(e, userDomain, vipList) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
```

---

## 7. CALENDAR INTEGRATION

### 7.1 Fetch Today's Events

```typescript
// lib/calendar.ts
import { google } from "googleapis";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  attendees: string[];
  hasExternalAttendees: boolean;
  meetingLink?: string;
  status: string;
}

export async function fetchTodayEvents(
  accessToken: string,
  timezone: string
): Promise<CalendarEvent[]> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });

  const now = new Date();
  const startOfDay = new Date(now.toLocaleDateString("en-US", { timeZone: timezone }));
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 20,
  });

  return (response.data.items || []).map((event) => {
    const attendees = event.attendees || [];
    const userEmail = attendees.find((a) => a.self)?.email || "";
    const userDomain = userEmail.split("@")[1] || "";

    return {
      id: event.id!,
      title: event.summary || "(Sin título)",
      startTime: new Date(event.start?.dateTime || event.start?.date || ""),
      endTime: new Date(event.end?.dateTime || event.end?.date || ""),
      isAllDay: !event.start?.dateTime,
      attendees: attendees.map((a) => a.email || ""),
      hasExternalAttendees: attendees.some((a) => {
        if (a.self) return false;
        const domain = a.email?.split("@")[1];
        return domain && domain !== userDomain;
      }),
      meetingLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
      status: event.status || "confirmed",
    };
  });
}

export function categorizeEvents(events: CalendarEvent[]) {
  return events
    .filter((e) => e.status !== "cancelled")
    .map((event) => {
      const reasons: string[] = [];
      let priority: "high" | "medium" | "low" = "low";

      if (event.hasExternalAttendees) {
        priority = "high";
        reasons.push("External attendees");
      }

      const titleLower = event.title.toLowerCase();
      if (titleLower.includes("interview") || titleLower.includes("entrevista") ||
          titleLower.includes("client") || titleLower.includes("cliente")) {
        priority = "high";
        reasons.push("Important meeting");
      }

      if (event.attendees.length > 5 && priority === "low") {
        priority = "medium";
        reasons.push("Large meeting");
      }

      return { event, priority, reasons };
    })
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] ||
             a.event.startTime.getTime() - b.event.startTime.getTime();
    });
}
```

---

## 8. LLM BRIEFING GENERATION

### 8.1 Prompt Template

```typescript
// lib/briefing-generator.ts

export function generateBriefingPrompt(input: {
  userName: string;
  date: Date;
  timezone: string;
  events: any[];
  emails: any[];
}): string {
  const { userName, date, timezone, events, emails } = input;

  const dateStr = date.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });

  const eventsSection = events.slice(0, 5).map((e) => {
    const time = e.event.startTime.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    });
    return `- ${time}: ${e.event.title} (${e.priority})`;
  }).join("\n");

  const emailsSection = emails.slice(0, 5).map((e) => {
    return `- De: ${e.email.from} | Asunto: ${e.email.subject}`;
  }).join("\n");

  return `
Sos un asistente personal que prepara un briefing matutino para ${userName}.
Generá un SCRIPT DE AUDIO de 60-90 segundos (máx 150 palabras).

FECHA: ${dateStr}

REUNIONES DE HOY:
${eventsSection || "No hay reuniones programadas."}

EMAILS IMPORTANTES:
${emailsSection || "No hay emails destacados."}

INSTRUCCIONES:
1. Tono NATURAL y CONVERSACIONAL (será hablado)
2. Saludo breve con nombre y fecha
3. Máximo 3-4 reuniones, 2-3 emails
4. Resaltá lo urgente
5. Cierre positivo y breve
6. Español argentino (vos, conjugaciones argentinas)
7. NO uses bullets - es para ser HABLADO

EJEMPLO DE TONO:
"Buen día Juan. Hoy es martes 15 de enero. 
Tenés tres reuniones. La más importante es a las 10 con el cliente de Mercado Libre.
Vi un email de María sobre la factura vencida que necesita revisión.
Dale para adelante, buen día."

Generá el script ahora:
`;
}
```

### 8.2 Gemini Integration

```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateBriefingScript(prompt: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
      topP: 0.9,
    },
  });

  return {
    script: result.response.text(),
    tokensUsed: result.response.usageMetadata?.totalTokenCount || 0,
  };
}
```

---

## 9. TEXT-TO-SPEECH

### 9.1 Google Cloud TTS

```typescript
// lib/tts.ts
import textToSpeech from "@google-cloud/text-to-speech";
import { Storage } from "@google-cloud/storage";

const client = new textToSpeech.TextToSpeechClient();
const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);

export async function generateAudio(text: string, userId: string) {
  const request = {
    input: { text },
    voice: {
      languageCode: "es-US",
      name: "es-US-Studio-B", // Natural male voice
    },
    audioConfig: {
      audioEncoding: "MP3" as const,
      speakingRate: 1.0,
      pitch: 0,
    },
  };

  const [response] = await client.synthesizeSpeech(request);

  if (!response.audioContent) throw new Error("No audio content");

  const filename = `briefings/${userId}/${Date.now()}.mp3`;
  const file = bucket.file(filename);

  await file.save(response.audioContent as Buffer, {
    metadata: { contentType: "audio/mpeg" },
  });

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + 24 * 60 * 60 * 1000,
  });

  const wordCount = text.split(/\s+/).length;
  const durationSeconds = Math.ceil((wordCount / 150) * 60);

  return { url, durationSeconds };
}
```

---

## 10. TWILIO WHATSAPP DELIVERY

```typescript
// lib/twilio.ts
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendWhatsAppAudio(
  to: string,
  audioUrl: string,
  fallbackText: string
) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: `whatsapp:${to}`,
      mediaUrl: [audioUrl],
    });
    return { success: true, messageSid: message.sid };
  } catch (audioError) {
    console.error("Audio failed, trying text:", audioError);
    try {
      const message = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER!,
        to: `whatsapp:${to}`,
        body: `🌅 Tu briefing:\n\n${fallbackText}`,
      });
      return { success: true, messageSid: message.sid };
    } catch (textError) {
      return { success: false, error: textError.message };
    }
  }
}
```

---

## 11. CRON WORKERS

### 11.1 Scheduler (cada minuto)

```typescript
// app/api/cron/scheduler/route.ts
export async function GET() {
  const now = new Date();
  const targetTime = new Date(now.getTime() + 30 * 60 * 1000);

  const { data: schedules } = await supabase
    .from("schedules")
    .select("*, users(*)")
    .eq("enabled", true)
    .lte("next_run_at", targetTime.toISOString())
    .gt("next_run_at", now.toISOString());

  for (const schedule of schedules || []) {
    // Create run
    const { data: run } = await supabase
      .from("runs")
      .insert({
        schedule_id: schedule.id,
        user_id: schedule.user_id,
        scheduled_for: schedule.next_run_at,
        status: "pending",
      })
      .select()
      .single();

    // Trigger pipeline
    await fetch(`${process.env.NEXT_PUBLIC_URL}/api/workers/run-pipeline`, {
      method: "POST",
      body: JSON.stringify({ runId: run.id }),
    });

    // Update next_run_at
    // ... calculate next run based on schedule config
  }

  return NextResponse.json({ triggered: schedules?.length || 0 });
}
```

### 11.2 Run Pipeline Worker

```typescript
// app/api/workers/run-pipeline/route.ts
export async function POST(req: NextRequest) {
  const { runId } = await req.json();

  try {
    // 1. Get run data
    const { data: run } = await supabase
      .from("runs")
      .select("*, users(*)")
      .eq("id", runId)
      .single();

    // 2. Update status
    await supabase.from("runs").update({ status: "running", started_at: new Date() }).eq("id", runId);

    // 3. Get OAuth token
    const { data: tokenData } = await supabase
      .from("oauth_tokens")
      .select("*")
      .eq("user_id", run.user_id)
      .single();

    const accessToken = await refreshTokenIfNeeded(tokenData);

    // 4. Fetch data
    const emails = await fetchRecentEmails(accessToken);
    const events = await fetchTodayEvents(accessToken, run.users.timezone);

    // 5. Score and filter
    const importantEmails = getTopImportantEmails(emails, run.users.email.split("@")[1]);
    const categorizedEvents = categorizeEvents(events);

    // 6. Generate script
    const prompt = generateBriefingPrompt({
      userName: run.users.name,
      date: new Date(run.scheduled_for),
      timezone: run.users.timezone,
      events: categorizedEvents,
      emails: importantEmails,
    });
    const { script, tokensUsed } = await generateBriefingScript(prompt);

    // 7. Generate audio
    let audioUrl = null, audioDuration = 0;
    try {
      const audio = await generateAudio(script, run.user_id);
      audioUrl = audio.url;
      audioDuration = audio.durationSeconds;
    } catch (e) {
      console.error("TTS failed:", e);
    }

    // 8. Save output
    await supabase.from("outputs").insert({
      run_id: runId,
      user_id: run.user_id,
      text_content: script,
      audio_url: audioUrl,
      audio_duration_seconds: audioDuration,
      delivery_status: "pending",
    });

    // 9. Mark complete
    await supabase.from("runs").update({
      status: "completed",
      finished_at: new Date(),
      llm_tokens_used: tokensUsed,
    }).eq("id", runId);

    return NextResponse.json({ success: true });

  } catch (error) {
    await supabase.from("runs").update({
      status: "failed",
      error_message: error.message,
    }).eq("id", runId);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

---

## 12. ENVIRONMENT VARIABLES

```bash
# .env.local

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Gemini
GEMINI_API_KEY=xxx

# Google Cloud TTS
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCS_BUCKET_NAME=antigravity-audio

# Twilio
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Encryption
TOKEN_ENCRYPTION_KEY=32-byte-hex-key
```

---

## 13. SUCCESS METRICS

| Metric | Target |
|--------|--------|
| D1 Retention | > 60% |
| D7 Retention | > 40% |
| 5/7 usage rate | > 50% |
| Play rate | > 70% |
| Delivery success | > 99% |

---

## 14. BACKLOG (20 tickets)

### Sprint 1: Foundation
1. Setup Next.js + TypeScript + Tailwind (2pts)
2. Configurar Supabase + tablas (3pts)
3. Google OAuth con NextAuth (5pts)
4. UI: Landing + login (3pts)
5. UI: Dashboard básico (3pts)

### Sprint 2: Integrations
6. Gmail API integration (5pts)
7. Calendar API integration (3pts)
8. Heurísticas de importancia (5pts)
9. LLM prompt + Gemini (5pts)
10. UI: Schedule config (3pts)

### Sprint 3: Audio + Delivery
11. Google Cloud TTS (5pts)
12. Audio storage + signed URLs (3pts)
13. Twilio WhatsApp (5pts)
14. Cron scheduler (8pts)
15. Delivery worker (5pts)

### Sprint 4: Polish
16. Webhooks + tracking (3pts)
17. UI: Briefing history (3pts)
18. Error handling + logs (5pts)
19. E2E testing (5pts)
20. Deploy + monitoring (3pts)

---

## 15. CÓDIGO REUTILIZABLE

### De repos GitHub gonzaloruzafa:
- `easy-openai-chatkit-app`: Auth setup, UI components
- `adhoc-chat-genius`: Next.js structure, LLM patterns
- `adhoc-cv-improver`: File handling patterns

### De Tuqui:
- TTS integration (Google/ElevenLabs)
- Gemini 2.5 Flash config
- Scheduler patterns

---

**FIN DE ESPECIFICACIÓN v1.0**
