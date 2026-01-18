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
        <div className="min-h-screen bg-[#FDFCF8]">
            {/* Header */}
            <header className="border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-start">
                    <Link href="/" className="text-sm text-gray-500 hover:text-adhoc-violet font-medium flex items-center gap-2 transition-colors">
                        ← Volver al Dashboard
                    </Link>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-display font-bold text-gray-900">Configuración</h2>
                    <p className="mt-2 text-gray-600">Personalizá cómo y cuándo recibís tu briefing.</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                    <ConfigForm initialData={initialData} />
                </div>
            </main>
            <Toaster position="bottom-center" />
        </div>
    );
}
