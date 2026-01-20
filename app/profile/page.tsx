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

    const confidence = profile.confidence_score || 0;
    const confidenceColor = confidence >= 70 ? 'text-green-600 bg-green-50' : confidence >= 40 ? 'text-yellow-600 bg-yellow-50' : 'text-red-500 bg-red-50';

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header Sticky */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="group flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all">
                        <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-white border border-transparent group-hover:border-gray-100 transition-all">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </div>
                        <span className="font-black uppercase tracking-widest text-xs">Volver</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border border-gray-100/50 shadow-sm ${confidenceColor}`}>
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
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Hero Section */}
                <div className="mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-adhoc-violet/5 rounded-full mb-6">
                        <span className="w-1.5 h-1.5 bg-adhoc-violet rounded-full animate-bounce" />
                        <span className="text-[10px] font-black text-adhoc-violet uppercase tracking-[0.2em]">Tu Perfil Inteligente v3.0</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-6 leading-[0.95] max-w-4xl font-display">
                        {profile.one_liner || `${profile.inferred_role || 'Profesional'} en ${profile.inferred_company || 'tu empresa'}`}
                    </h1>
                    <div className="bg-white rounded-[2.5rem] p-8 lg:p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-adhoc-violet/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-adhoc-violet/10 transition-all duration-1000" />
                        <p className="text-2xl text-gray-600 leading-relaxed font-medium relative z-10 italic">
                            "{profile.persona_description || 'Aún estamos aprendiendo sobre vos...'}"
                        </p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12 items-start">
                    {/* Columna Izquierda: Identidad & Estilo */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Card: Identidad */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500">
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <span className="w-1 h-4 bg-adhoc-violet rounded-full" />
                                Identidad Profesional
                            </h2>

                            <div className="space-y-8">
                                <div className="group/item">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover/item:text-adhoc-violet transition-colors">Rol Actual</p>
                                    <p className="text-xl font-black text-gray-900 leading-tight">
                                        {profile.inferred_role || "No detectado"}
                                        {profile.is_founder && (
                                            <span className="ml-2 inline-flex items-center px-3 py-0.5 rounded-full text-[9px] font-black bg-adhoc-coral/10 text-adhoc-coral border border-adhoc-coral/20 uppercase tracking-widest">
                                                Founder
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="group/item">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover/item:text-adhoc-violet transition-colors">Empresa & Sector</p>
                                    <p className="text-xl font-black text-gray-900 leading-tight">{profile.inferred_company || "—"}</p>
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mt-1">{profile.inferred_industry || ""}</p>
                                </div>

                                <div className="group/item">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover/item:text-adhoc-violet transition-colors">Nivel de Seniority</p>
                                    <p className="text-xl font-black text-gray-900 leading-tight capitalize">
                                        {profile.inferred_seniority?.replace(/_/g, ' ') || "Sin clasificar"}
                                    </p>
                                </div>

                                {profile.team_size_hint && (
                                    <div className="group/item bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Impacto de Liderazgo</p>
                                        <p className="text-xl font-black text-gray-900 leading-tight">
                                            ~{profile.team_size_hint} reportes directos
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card: Comunicación */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 border-l-4 border-l-adhoc-violet">
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Estilo de Comunicación</h2>
                            <p className="text-lg font-bold text-gray-800 leading-relaxed mb-6">
                                {profile.communication_style || profile.personality_hints || "Información pendiente de análisis"}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl uppercase tracking-widest capitalize">
                                    Tono: {profile.inferred_tone || "Mixto"}
                                </span>
                                {profile.preferred_greeting && (
                                    <span className="text-[10px] font-black bg-adhoc-violet/10 text-adhoc-violet px-3 py-1.5 rounded-xl uppercase tracking-widest">
                                        Llamar: {profile.preferred_greeting}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna Central: Foco, Proyectos & Intereses */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Focus Card Gradient */}
                        <div className="bg-gradient-to-br from-adhoc-violet to-adhoc-violet/80 rounded-[2rem] p-8 text-white shadow-xl shadow-adhoc-violet/20 hover:scale-[1.02] transition-all duration-500">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                <h2 className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Prioridad Actual</h2>
                            </div>
                            <p className="text-3xl font-black leading-[1.1] tracking-tight">
                                {profile.current_focus || "Mantenimiento operativo"}
                            </p>
                        </div>

                        {/* Card: Proyectos Activos */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Iniciativas Activas</h2>
                            <div className="space-y-4">
                                {profile.active_projects && profile.active_projects.length > 0 ? (
                                    profile.active_projects.map((project: string, idx: number) => (
                                        <div key={idx} className="flex items-start gap-3 group">
                                            <div className="mt-1.5 w-1.5 h-1.5 bg-adhoc-coral rounded-full group-hover:scale-150 transition-all duration-300" />
                                            <span className="text-lg font-black text-gray-800 group-hover:text-adhoc-violet transition-colors">{project}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 font-medium italic">No se detectaron proyectos específicos todavía.</p>
                                )}
                            </div>
                        </div>

                        {/* Card: Gustos e Intereses */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Gustos e Intereses</h2>
                            <div className="flex flex-wrap gap-2">
                                {profile.personal_interests && profile.personal_interests.length > 0 ? (
                                    profile.personal_interests.map((interest: string, idx: number) => (
                                        <span key={idx} className="bg-gray-50 text-gray-800 px-4 py-2 rounded-2xl text-xs font-black border border-gray-100 hover:bg-white hover:border-adhoc-coral/30 hover:text-adhoc-coral transition-all cursor-default uppercase tracking-widest">
                                            {interest}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-gray-400 font-medium italic">Buscando señales de color...</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Relaciones & Estrés */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Card: VIP Contacts */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 max-h-[700px] overflow-hidden flex flex-col">
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Nodos de Red Críticos</h2>
                            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                {profile.vip_contacts && profile.vip_contacts.length > 0 ? (
                                    profile.vip_contacts.slice(0, 15).map((contact: any, idx: number) => (
                                        <div key={idx} className="group p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-gray-200 hover:bg-white transition-all duration-300">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-black text-gray-900 group-hover:text-adhoc-violet transition-colors truncate max-w-[150px]">{contact.name}</p>
                                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${contact.importance === 'critical' ? 'bg-red-500 text-white' :
                                                    contact.importance === 'high' ? 'bg-orange-500 text-white' :
                                                        'bg-gray-200 text-gray-600'
                                                    }`}>
                                                    {contact.importance || 'medium'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 capitalize">{contact.relationship?.replace(/_/g, ' ')}</p>
                                            {contact.context && (
                                                <p className="text-[11px] text-gray-500 font-medium border-t border-gray-100 pt-2 mt-2 group-hover:text-gray-700 transition-colors">
                                                    {contact.context}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 italic">Analizando red de contactos...</p>
                                )}
                            </div>
                        </div>

                        {/* Card: Stress Meter */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Carga de Estrés</h2>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] ${profile.stress_level === 'high' ? 'bg-red-50 text-red-600' :
                                    profile.stress_level === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                                    }`}>
                                    {profile.stress_level}
                                </span>
                            </div>

                            <div className="w-full bg-gray-100 h-2.5 rounded-full mb-8 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${profile.stress_level === 'high' ? 'bg-red-500 w-[90%]' :
                                    profile.stress_level === 'medium' ? 'bg-amber-500 w-[60%]' : 'bg-green-500 w-[20%]'
                                    }`} />
                            </div>

                            {profile.stress_reasons && profile.stress_reasons.length > 0 && (
                                <div className="space-y-3">
                                    {profile.stress_reasons.map((reason: string, idx: number) => (
                                        <div key={idx} className="flex gap-2 text-sm font-medium text-gray-500">
                                            <span className="text-gray-300">•</span>
                                            <span>{reason}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Analysis Metadata */}
                <div className="mt-20 pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                        Tuqui Intelligence v{profile.analysis_version || '3.0'} <span className="mx-4 text-gray-200">|</span>
                        {profile.emails_analyzed} emails <span className="text-gray-200 mx-2">({profile.emails_sent_analyzed || 0}↑ {profile.emails_received_analyzed || 0}↓)</span>
                    </p>
                    <div className="flex items-center gap-6">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                            Last Scan: {new Date(profile.last_analysis_at).toLocaleDateString('es-AR')}
                        </p>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Encrpyted & Private</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
