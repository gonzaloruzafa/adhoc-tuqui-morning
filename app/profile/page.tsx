import { auth } from "@/auth";
import { getClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileEditor } from "@/components/profile-editor";

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

    const isAnalyzing = user?.profile_analysis_status === 'analyzing';

    const formatVal = (val: any, fallback: string) => {
        if (!val || val === 'null') return fallback;
        return val;
    };

    if (!profile) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 font-kansas">Tu Perfil Inteligente</h1>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {isAnalyzing
                            ? "Tuqui está analizando tu historial para conocerte mejor. Esto puede tardar un minuto..."
                            : "Todavía no terminamos de analizar tu perfil. Logueate de nuevo o esperá un momento."}
                    </p>
                    <div className="flex flex-col items-center gap-6">
                        <Link href="/" className="bg-adhoc-violet text-white px-8 py-4 rounded-2xl font-bold hover:bg-adhoc-violet/90 transition-all shadow-lg hover:shadow-adhoc-violet/20">
                            Volver al Inicio
                        </Link>
                        {!isAnalyzing && (
                            <ProfileEditor initialBio={null} profileStatus={user?.profile_analysis_status} userEmail={session.user.email} />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 font-display">
                        Tu Perfil <span className="text-adhoc-violet">Tuqui</span>
                    </h1>
                    <p className="text-gray-500 font-medium">Lo que la IA dedujo de tu historial de emails.</p>
                </div>
                <Link href="/" className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-2xl font-bold hover:bg-gray-50 transition shadow-sm">
                    ← Volver
                </Link>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Editable Bio & Recalculate */}
                <div className="lg:col-span-2">
                    <ProfileEditor initialBio={profile.persona_description} profileStatus={user?.profile_analysis_status} userEmail={session.user.email} />
                </div>

                {/* Identity Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-adhoc-violet mb-6 flex items-center gap-2 tracking-tight font-display">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Identidad
                        </h2>
                        <dl className="space-y-6">
                            <div>
                                <dt className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Rol & Seniority</dt>
                                <dd className="text-lg font-bold text-gray-900 tracking-tight">
                                    {formatVal(profile.inferred_role, "Sin detectar")}
                                    <span className="text-gray-300 mx-1">/</span>
                                    <span className="text-gray-500 font-medium">{formatVal(profile.inferred_seniority, "Pendiente")}</span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Empresa / Industria</dt>
                                <dd className="text-lg font-bold text-gray-900 tracking-tight">
                                    {formatVal(profile.inferred_company, "No identificada")}
                                    <br />
                                    <span className="text-sm text-gray-400 font-medium">{formatVal(profile.inferred_industry, "Industria pendiente")}</span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-1">Foco Semanal</dt>
                                <dd className="text-md font-bold text-adhoc-violet leading-tight">
                                    {profile.current_focus && profile.current_focus !== 'null' ? `"${profile.current_focus}"` : "Aún analizando foco..."}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-tight font-display">KPIs de Análisis</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 font-medium">Emails analizados</span>
                                <span className="text-sm font-black text-gray-900">{profile.emails_analyzed}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500 font-medium">Nivel de Estrés</span>
                                <span className="text-sm font-black text-adhoc-violet capitalize">{profile.stress_level}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VIP Contacts */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-adhoc-coral mb-6 flex items-center gap-2 tracking-tight">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Contactos Frecuentes
                    </h2>
                    <div className="space-y-3">
                        {profile.vip_contacts?.slice(0, 5).map((contact: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 tracking-tight">{contact.name}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-black">{contact.relationship}</p>
                                </div>
                                <span className="bg-adhoc-coral/10 text-adhoc-coral text-[9px] px-2 py-1 rounded-lg font-black tracking-tighter">
                                    {contact.frequency}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Topics */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-adhoc-violet mb-6 flex items-center gap-2 tracking-tight">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 11h.01M7 15h.01M13 7h.01M13 11h.01M13 15h.01M17 7h.01M17 11h.01M17 15h.01" />
                        </svg>
                        Temas Recurrentes
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {profile.recurring_topics?.map((topic: string, idx: number) => (
                            <span key={idx} className="bg-adhoc-violet/10 text-adhoc-violet px-4 py-2 rounded-xl text-sm font-bold border border-adhoc-violet/20">
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    AI Analysis v2.5 <span className="mx-2">•</span> {new Date(profile.last_analysis_at).toLocaleDateString()}
                </p>
                <p className="mt-2 text-xs text-gray-300 font-medium">
                    Toda la información es extraída de forma privada de tu historial de Gmail.
                </p>
            </div>
        </div>
    );
}
