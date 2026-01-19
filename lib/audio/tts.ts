import { getClient } from "@/lib/supabase/client";

const VOICE_DIRECTION = `
### DIRECTOR'S NOTES
Style: Warm, professional and friendly tone. Natural conversational style.
Pacing: Brisk and energetic pace, like a professional sharing daily highlights.
Accent: Latin American Spanish with a natural Argentine (Buenos Aires) flavor.
### TRANSCRIPT:
`;

export async function generateAudio(text: string, userId: string) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY for TTS");
    }

    // 1. Synthesize Speech using Gemini TTS (Special Restricted API)
    // This doesn't need Service Account credentials, only the GEMINI_API_KEY
    const prompt = VOICE_DIRECTION + text;
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const ttsResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: 'Aoede', // Breezy, natural voice
                        }
                    }
                }
            }
        })
    });

    if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error("Gemini TTS API Error:", errorText);
        throw new Error(`Gemini TTS API Error: ${ttsResponse.statusText}`);
    }

    const data = await ttsResponse.json();
    const audioDataBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioDataBase64) {
        throw new Error("No audio content received from Gemini TTS");
    }

    const pcmBuffer = Buffer.from(audioDataBase64, 'base64');

    // Add WAV header for 24kHz mono PCM 16-bit (Standard for Gemini TTS output)
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmBuffer.length;
    const fileSize = 36 + dataSize;

    const wavHeader = Buffer.alloc(44);
    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(fileSize, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16);
    wavHeader.writeUInt16LE(1, 20);
    wavHeader.writeUInt16LE(numChannels, 22);
    wavHeader.writeUInt32LE(sampleRate, 24);
    wavHeader.writeUInt32LE(byteRate, 28);
    wavHeader.writeUInt16LE(blockAlign, 32);
    wavHeader.writeUInt16LE(bitsPerSample, 34);
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(dataSize, 40);

    const audioBuffer = Buffer.concat([wavHeader, pcmBuffer]);

    // 2. Upload to Supabase Storage
    const db = getClient();
    const filename = `${userId}/${Date.now()}.wav`; // Changed to .wav as it's more accurate now

    const { error: uploadError } = await db.storage
        .from('briefings')
        .upload(filename, audioBuffer, {
            contentType: 'audio/wav',
            upsert: true
        });

    if (uploadError) {
        console.error("Storage upload failed:", uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 3. Get Signed URL
    const { data: signData, error: signError } = await db.storage
        .from('briefings')
        .createSignedUrl(filename, 24 * 60 * 60);

    if (signError || !signData) {
        throw new Error("Failed to sign URL");
    }

    const wordCount = text.split(/\s+/).length;
    const durationSeconds = Math.ceil((wordCount / 130) * 60);

    return { url: signData.signedUrl, durationSeconds };
}
