import { NextResponse } from "next/server";
import { processRun } from "@/lib/workers/pipeline";

export async function POST(request: Request) {
    const { runId } = await request.json();

    console.log(`[Run Pipeline] 🎬 Starting pipeline execution for run: ${runId}`);

    // Fire and forget logic often tricky in serverless without queues.
    // We will await it here, assuming Vercel function timeout (10s-60s) is enough for small batch.

    try {
        await processRun(runId);
        console.log(`[Run Pipeline] ✅ Pipeline completed successfully for run: ${runId}`);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error(`[Run Pipeline] ❌ Pipeline failed for run ${runId}:`, e);
        console.error(`[Run Pipeline] Error details:`, {
            message: e.message,
            stack: e.stack?.split('\n').slice(0, 5).join('\n')
        });
        return NextResponse.json({ error: "Pipeline failed", details: e.message }, { status: 500 });
    }
}
