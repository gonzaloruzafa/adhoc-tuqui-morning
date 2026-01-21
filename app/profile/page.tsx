import { auth } from "@/auth";
import { getClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image";
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
        .select("profile_analysis_status, image")
        .eq("email", session.user.email)
        .single();

    const isAnalyzing = user?.profile_analysis_status === 'analyzing';

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-[2rem] p-12 text-center shadow-xl max-w-md w-full border border-gray-100">
                    <div className="w-20 h-20 bg-adhoc-violet/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        {isAnalyzing ? (
                            <div className="w-10 h-10 border-4 border-adhoc-violet border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-10 h-10 text-adhoc-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        )}
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-4 font-display">
                        {isAnalyzing ? "Analizando tu mundo..." : "Perfil no disponible"}
                    </h1>
                    <p className="text-gray-500 mb-8 text-lg font-medium leading-relaxed">
                        {isAnalyzing
                            ? "Estamos leyendo tus emails para conocerte mejor. Esto toma ~1 minuto."
                            : "Algo salió mal. Intentá de nuevo."}
                    </p>
                    {isAnalyzing && (
                        <div className="w-full bg-gray-100 rounded-full h-3 mb-8 overflow-hidden">
                            <div className="bg-adhoc-violet h-full rounded-full animate-pulse transition-all duration-1000" style={{ width: '60%' }} />
                        </div>
                    )}
                    <Link href="/" className="inline-flex items-center gap-2 text-adhoc-violet font-black hover:gap-3 transition-all uppercase tracking-wider text-sm">
                        ← Volver al inicio
                    </Link>
                </div>
            </div>
        );
    }

    // Parse confidence score correctly (could be null, 0, or a number)
    const confidence = profile.confidence_score != null ? Math.round(profile.confidence_score) : 0;
    const confidenceColor = confidence >= 70 ? 'text-green-600 bg-green-50' : confidence >= 40 ? 'text-yellow-600 bg-yellow-50' : 'text-red-500 bg-red-50';

    return (
        <div className="min-h-screen bg-[#FDFCFB] px-6 py-12">
            <div className="max-w-md mx-auto space-y-12">
                <header className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">
                            Perfil Organizado
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        {(user?.image || session.user.image) && (
                            <div className="relative w-24 h-24 rounded-[32px] overflow-hidden shadow-2xl shadow-[#7C6CD8]/10 ring-4 ring-white">
                                <NextImage src={user?.image || session.user.image!} alt="Profile" fill className="object-cover" />
                            </div>
                        )}
                        <div className="space-y-1">
                            <h2 className="text-3xl font-display font-medium text-gray-900">
                                Tuqui Mañana
                            </h2>
                            <p className="text-xs uppercase font-bold tracking-widest text-[#7C6CD8]">
                                {(profile.inferred_role && profile.inferred_role !== 'null') ? profile.inferred_role : 'Estratega de Negocios'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border ${confidenceColor}`}>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${confidence >= 70 ? 'bg-green-500' : confidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {confidence}% confianza
                            </span>
                        </div>
                        <ProfileEditor
                            initialBio={profile.persona_description}
                            userEmail={session.user.email}
                            profileStatus={user?.profile_analysis_status}
                            variant="button"
                        />
                    </div>
                </header>

                <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Tu Perfil Inteligente
                    </div>
                    <p className="text-lg text-gray-700 font-light leading-relaxed">
                        {profile.persona_description && profile.persona_description !== 'null' ? profile.persona_description : 'Aún estamos aprendiendo sobre vos...'}
                    </p>
                </section>

                <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent" />

                {/* Identidad & VIPs con estilo minimalista */}
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    {/* Card: Identidad */}
                    <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-6 shadow-sm">
                        <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-4">
                            Identidad
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Rol</p>
                                <p className="text-lg font-medium text-gray-900">
                                    {(profile.inferred_role === 'null' || !profile.inferred_role) ? "—" : profile.inferred_role}
                                    {profile.is_founder && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold bg-[#FF7348]/10 text-[#FF7348] uppercase">
                                            Founder
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400 mb-1">Empresa</p>
                                <p className="text-lg font-medium text-gray-900">
                                    {(profile.inferred_company === 'null' || !profile.inferred_company) ? "—" : profile.inferred_company}
                                </p>
                                {profile.inferred_industry && profile.inferred_industry !== 'null' && (
                                    <p className="text-xs text-gray-500 mt-0.5">{profile.inferred_industry}</p>
                                )}
                            </div>

                            <div>
                                <p className="text-xs text-gray-400 mb-1">Seniority</p>
                                <p className="text-lg font-medium text-gray-900 capitalize">
                                    {(profile.inferred_seniority && profile.inferred_seniority !== 'null') ? profile.inferred_seniority.replace(/_/g, ' ') : "—"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Card: Foco Actual */}
                    {profile.current_focus && profile.current_focus !== 'null' && (
                        <div className="bg-[#7C6CD8]/10 backdrop-blur-xl border border-[#7C6CD8]/20 rounded-[32px] p-6">
                            <p className="text-[10px] font-bold tracking-[0.2em] text-[#7C6CD8] uppercase mb-2">
                                Foco Actual
                            </p>
                            <p className="text-xl font-medium text-gray-900 leading-snug">
                                {profile.current_focus}
                            </p>
                        </div>
                    )}

                    {/* Card: Proyectos Activos */}
                    {profile.active_projects && profile.active_projects.length > 0 && (
                        <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-6 shadow-sm">
                            <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-4">
                                Proyectos Activos
                            </h3>
                            <div className="space-y-2">
                                {profile.active_projects.map((project: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <div className="mt-2 w-1 h-1 bg-[#FF7348] rounded-full flex-shrink-0" />
                                        <span className="text-sm font-medium text-gray-800">{project}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Card: Intereses */}
                    {profile.personal_interests && profile.personal_interests.length > 0 && (
                        <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-6 shadow-sm">
                            <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-4">
                                Intereses
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.personal_interests.map((interest: string, idx: number) => (
                                    <span key={idx} className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded-full text-xs font-medium">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Card: VIP Contacts */}
                    {profile.vip_contacts && profile.vip_contacts.length > 0 && (
                        <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-6 shadow-sm max-h-96 overflow-y-auto">
                            <h3 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-4">
                                Contactos VIP
                            </h3>
                            <div className="space-y-3">
                                {profile.vip_contacts.slice(0, 10).map((contact: any, idx: number) => (
                                    <div key={idx} className="pb-3 border-b border-gray-100 last:border-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-medium text-gray-900 text-sm">{contact.name}</p>
                                            <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                                contact.importance === 'critical' ? 'bg-red-100 text-red-600' :
                                                contact.importance === 'high' ? 'bg-orange-100 text-orange-600' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {contact.importance || 'medium'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 capitalize">
                                            {contact.relationship?.replace(/_/g, ' ')}
                                        </p>
                                        {contact.context && (
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{contact.context}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Metadata */}
                <footer className="pt-8 text-center opacity-40 text-[9px] text-gray-400 uppercase tracking-wider space-y-1">
                    <p>Tuqui Intelligence v{profile.analysis_version || '3.0'}</p>
                    <p>{profile.emails_analyzed} emails analizados</p>
                    <p>Última actualización: {new Date(profile.last_analysis_at).toLocaleDateString('es-AR')}</p>
                </footer>
            </div>
        </div>
    );
}
