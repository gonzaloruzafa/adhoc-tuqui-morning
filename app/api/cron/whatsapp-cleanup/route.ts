import { NextResponse } from "next/server";
import { cleanupExpiredWindows } from "@/lib/twilio/window-manager";

/**
 * Endpoint de CRON para limpiar ventanas de WhatsApp expiradas.
 * Puede ser llamado por Vercel Cron o un scheduler externo.
 */
export async function GET(req: Request) {
    // Opcional: Verificar un token de seguridad en los headers para que solo el CRON pueda llamarlo
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await cleanupExpiredWindows();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[Cron Cleanup] Failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
