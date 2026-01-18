import { NextResponse } from "next/server";
import { processRun } from "@/lib/workers/pipeline";

export async function POST(request: Request) {
    const { runId } = await request.json();

    // Fire and forget logic often tricky in serverless without queues.
    // We will await it here, assuming Vercel function timeout (10s-60s) is enough for small batch.

    try {
        await processRun(runId);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Pipeline failed" }, { status: 500 });
    }
}
