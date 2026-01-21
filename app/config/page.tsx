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
        <div className="min-h-screen bg-[#FDFCFB] px-6 py-12">
            <div className="max-w-md mx-auto space-y-8">
                {/* Header */}
                <header className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">
                            Configuración
                        </span>
                    </div>

                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-display font-medium text-gray-900">
                            Ajustes
                        </h1>
                        <p className="text-gray-500 font-light">
                            Personalizá tu briefing matutino
                        </p>
                    </div>
                </header>

                {/* Form Section */}
                <main className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <ConfigForm initialData={initialData} />
                </main>
            </div>
            <Toaster position="bottom-center" richColors />
        </div>
    );
}
