import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    if (!session?.user?.email) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json({
        GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
        GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
        GOOGLE_PRIVATE_KEY_LENGTH: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
        GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV,
    });
}
