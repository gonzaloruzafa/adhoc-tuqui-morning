import { auth } from "@/auth";
import { getClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");

    const db = getClient();
    const { data: profile } = await db
        .from("tuqui_morning_user_profiles")
        .select("*")
        .eq("user_email", session.user.email)
        .single();

    const { data: user } = await db
        .from("tuqui_morning_users")
        .select("profile_analysis_status")
        .eq("email", session.user.email)
        .single();

    if (!profile) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Tu Perfil Inteligente</h1>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        {user?.profile_analysis_status === 'analyzing'
                            ? "Kikiriki está analizando tu historial para conocerte mejor. Esto puede tardar un minuto..."
                            : "Todavía no terminamos de analizar tu perfil. Logueate de nuevo o esperá un momento."}
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/" className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-indigo-700 transition">
                            Volver al Inicio
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                        Tu Perfil <span className="text-indigo-600">Kikiriki</span>
                    </h1>
                    <p className="text-gray-500 font-medium">Lo que la IA dedujo de tu historial de emails.</p>
                </div>
                <Link href="/" className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-2xl font-bold hover:bg-gray-50 transition shadow-sm">
                    ← Volver
                </Link>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Sector Profesional */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-indigo-600 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Identidad Profesional
                    </h2>
                    <dl className="space-y-4">
                        <div>
                            <dt className="text-xs uppercase tracking-wider font-bold text-gray-400">Rol & Seniority</dt>
                            <dd className="text-lg font-bold text-gray-900">{profile.inferred_role} ({profile.inferred_seniority})</dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wider font-bold text-gray-400">Empresa / Industria</dt>
                            <dd className="text-lg font-bold text-gray-900">{profile.inferred_company} | {profile.inferred_industry}</dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wider font-bold text-gray-400">Tono de Comunicación</dt>
                            <dd className="text-lg font-bold text-gray-900 capitalize">{profile.inferred_tone}</dd>
                        </div>
                    </dl>
                </div>

                {/* VIP Contacts */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-orange-600 mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Contactos VIP Detector
                    </h2>
                    <div className="space-y-3">
                        {profile.vip_contacts?.map((contact: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{contact.name}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-black">{contact.relationship}</p>
                                </div>
                                <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-1 rounded-full font-bold">
                                    {contact.frequency} emails
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Topics & Focus */}
                <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-lg font-bold text-indigo-600 mb-6 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 11h.01M7 15h.01M13 7h.01M13 11h.01M13 15h.01M17 7h.01M17 11h.01M17 15h.01" />
                                </svg>
                                Temas Recurrentes
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {profile.recurring_topics?.map((topic: string, idx: number) => (
                                    <span key={idx} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-100">
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Análisis de Estrés y Foco</h2>
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Según tus emails, esta semana tu foco está en <span className="font-bold text-gray-900">"{profile.current_focus}"</span>.
                                    Tu nivel de estrés percibido es <span className="font-bold text-indigo-600 capitalize">{profile.stress_level}</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-10 text-center text-xs text-gray-400 font-medium">
                Kikiriki analizó {profile.emails_analyzed} emails el {new Date(profile.last_analysis_at).toLocaleDateString()}.
            </p>
        </div>
    );
}
