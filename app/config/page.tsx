import { auth } from "@/auth";
import { getUserConfig } from "@/app/actions";
import { ConfigForm } from "@/components/config-form";
import { Toaster } from "sonner";
import Link from "next/link";

export default async function ConfigPage() {
    const session = await auth();
    if (!session) return <div>Access Denied</div>;

    const data = await getUserConfig();

    const initialData = data || {
        phone: "",
        timezone: "America/Argentina/Buenos_Aires",
        timeLocal: "07:00",
        enabled: true
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-adhoc-lavender/10">
            {/* Premium Header */}
            <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-start">
                    <Link href="/" className="group text-sm text-gray-600 hover:text-adhoc-violet font-semibold flex items-center gap-2 transition-all px-3 py-1.5 rounded-lg hover:bg-adhoc-lavender/10">
                        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver al Dashboard
                    </Link>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="mb-8 sm:mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-adhoc-violet/20 text-adhoc-violet font-semibold text-xs uppercase tracking-wider mb-4 shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        Configuración
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-display font-semibold text-gray-900 mb-3 tracking-tight">Personalizá tu briefing</h2>
                    <p className="text-base sm:text-lg text-gray-600 font-light">Ajustá cómo y cuándo recibís tu resumen matutino.</p>
                </div>

                {/* Premium Form Card */}
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200/80 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl shadow-gray-200/50">
                    <ConfigForm initialData={initialData} />
                </div>
            </main>
            <Toaster position="bottom-center" richColors />
        </div>
    );
}
