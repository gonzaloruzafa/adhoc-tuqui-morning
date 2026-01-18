import { auth } from "@/auth";
import { getUserConfig } from "@/app/actions";
import { ConfigForm } from "@/components/config-form";
import { Toaster } from "sonner";
import Link from "next/link"; // Changed from next/navigation for back button

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
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 mb-4 inline-block">← Volver al Dashboard</Link>
                    <h2 className="text-3xl font-display font-bold text-gray-900">Configuración</h2>
                    <p className="mt-2 text-gray-600">Personalizá tu experiencia matutina.</p>
                </div>

                <div className="bg-white py-8 px-6 shadow rounded-lg">
                    <ConfigForm initialData={initialData} />
                </div>
            </div>
            <Toaster position="bottom-center" />
        </div>
    );
}
