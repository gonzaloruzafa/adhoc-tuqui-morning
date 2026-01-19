import textToSpeech from "@google-cloud/text-to-speech";
import { getClient } from "@/lib/supabase/client";

// Support explicitly passed credentials for Vercel/Serverless environments
const client = new textToSpeech.TextToSpeechClient({
    credentials: process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY ? {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    } : undefined
});

export async function generateAudio(text: string, userId: string) {
    // 1. Synthesize Speech
    const request = {
        input: { text },
        voice: {
            languageCode: "es-US",
            name: "es-US-Journey-F", // Natural, warm voice (Journey voices are great)
        },
        audioConfig: {
            audioEncoding: "MP3" as const,
            speakingRate: 1.0,
            pitch: 0,
        },
    };

    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) throw new Error("No audio content received from Google TTS");

    // 2. Upload to Supabase Storage
    // Note: We need a bucket named 'briefings'. Ensure it exists or create it.
    const db = getClient();
    const filename = `${userId}/${Date.now()}.mp3`;

    const { error: uploadError } = await db.storage
        .from('briefings')
        .upload(filename, response.audioContent, {
            contentType: 'audio/mpeg',
            upsert: true
        });

    if (uploadError) {
        console.error("Storage upload failed:", uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 3. Get Public URL (or Signed URL if private)
    // For MVP assuming bucket is public or we perform signed URL gen on retrieval
    // Let's use createSignedUrl for better security by default
    const { data: signData, error: signError } = await db.storage
        .from('briefings')
        .createSignedUrl(filename, 24 * 60 * 60); // 24 hours

    if (signError || !signData) {
        throw new Error("Failed to sign URL");
    }

    const wordCount = text.split(/\s+/).length;
    // Estimate: 150 words per minute roughly
    const durationSeconds = Math.ceil((wordCount / 130) * 60);

    return { url: signData.signedUrl, durationSeconds };
}
