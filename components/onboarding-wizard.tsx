"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveConfiguration, cancelProfileAnalysis, retriggerProfileAnalysis } from "@/app/actions";
import Image from "next/image";

interface OnboardingWizardProps {
    userEmail: string;
    initialStatus: string;
    initialTime: string;
    initialPhone: string;
    initialTimezone: string;
}

export function OnboardingWizard({
    userEmail,
    initialStatus,
    initialTime,
    initialPhone,
    initialTimezone
}: OnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [status, setStatus] = useState(initialStatus);
    const [time, setTime] = useState(initialTime);
    const [phone, setPhone] = useState(initialPhone);
    const [isSaving, setIsSaving] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [isStuck, setIsStuck] = useState(false);
    const [lastProgressAt, setLastProgressAt] = useState(Date.now());
    const router = useRouter();

    const [progress, setProgress] = useState({ count: 0, total: 0 });

    // Step 1: Polling for profile completion
    useEffect(() => {
        if (step !== 1 || status === 'completed') {
            setIsStuck(false);
            return;
        }

        const interval = setInterval(async () => {
            try {
                const statusRes = await fetch(`/api/internal/analyze-profile/status?email=${userEmail}`);
                const data = await statusRes.json();

                if (data.count !== undefined && data.total !== undefined) {
                    if (data.count > progress.count || (data.total > 0 && progress.total === 0)) {
                        setLastProgressAt(Date.now());
                        setIsStuck(false);
                    }
                    setProgress({ count: data.count, total: data.total });
                }

                if (data.status === 'completed') {
                    setStatus('completed');
                    setStep(2);
                }

                if (data.status === 'failed' || !data.status) {
                    setIsStuck(true);
                }

                // If stuck for more than 40 seconds
                if (Date.now() - lastProgressAt > 40000) {
                    setIsStuck(true);
                }
            } catch (e) {
                console.error("Status check failed", e);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [step, status, userEmail, progress.count, progress.total, lastProgressAt]);

    const handleRestart = async () => {
        setIsStuck(false);
        setIsStopping(false);
        setLastProgressAt(Date.now());
        try {
            await retriggerProfileAnalysis();
        } catch (e) {
            console.error("Failed to restart analysis", e);
        }
    };

    const handleStop = async () => {
        setIsStopping(true);
        try {
            await cancelProfileAnalysis();
            setIsStuck(true); // Show restart options
        } catch (error) {
            console.error(error);
        } finally {
            setIsStopping(false);
        }
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append("timeLocal", time);
            formData.append("phone", phone);
            formData.append("timezone", initialTimezone);
            formData.append("enabled", "on");

            await saveConfiguration(formData);
            setStep(3);
        } catch (error) {
            alert("Error al guardar la configuración");
        } finally {
            setIsSaving(false);
        }
    };

    const finishOnboarding = () => {
        router.push("/");
    };

    return (
        <div className="max-w-xl mx-auto px-6 py-20">
            {/* Steps Indicator */}
            <div className="flex justify-between mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold font-display transition-all duration-500 ${step >= s ? 'bg-adhoc-violet text-white shadow-lg shadow-adhoc-violet/20 scale-110' : 'bg-white border-2 border-gray-100 text-gray-300'
                            }`}
                    >
                        {s}
                    </div>
                ))}
            </div>

            {/* Step 1: Analysis */}
            {step === 1 && (
                <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-adhoc-violet/10 animate-ping"></div>
                        <div className="relative w-full h-full rounded-full bg-white flex items-center justify-center shadow-xl border border-adhoc-violet/10">
                            <span className="text-3xl animate-bounce">🧠</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight font-display">Estamos conociéndote...</h1>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            Tuqui está analizando tus últimos emails para entender tu ritmo de trabajo, tus temas clave y quiénes son tus contactos VIP.
                        </p>
                    </div>
                    <div className="bg-adhoc-violet/5 p-6 rounded-3xl border border-adhoc-violet/10">
                        {progress.total > 0 ? (
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-adhoc-violet">
                                    <span>Analizando historial</span>
                                    <span>{progress.count} / {progress.total}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-adhoc-violet h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.round((progress.count / Math.max(1, progress.total)) * 100)}%` }}
                                    ></div>
                                </div>
                                {isStuck && (
                                    <div className="mt-4 space-y-4">
                                        <p className="text-[10px] text-adhoc-coral font-bold animate-pulse uppercase">El análisis parece estar demorando más de lo normal...</p>
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={handleRestart}
                                                className="bg-adhoc-violet text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow-lg shadow-adhoc-violet/20"
                                            >
                                                REINTENTAR
                                            </button>
                                            <button
                                                onClick={handleStop}
                                                disabled={isStopping}
                                                className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-2xl font-bold text-xs"
                                            >
                                                {isStopping ? "..." : "DETENER"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {!isStuck && (
                                    <button
                                        onClick={handleStop}
                                        disabled={isStopping}
                                        className="mt-6 text-[10px] font-black text-gray-400 hover:text-gray-500 uppercase tracking-widest"
                                    >
                                        {isStopping ? "Deteniendo..." : "Detener Análisis"}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-1.5 h-12 bg-adhoc-violet rounded-full animate-pulse"></div>
                                <p className="text-sm font-bold text-adhoc-violet leading-tight">
                                    "Esto nos permite armarte un briefing 100% a medida, descartando el spam y priorizando lo que importa."
                                </p>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest animate-pulse">
                        {progress.total > 0 ? "Bajando contenido de emails..." : "Analizando historial de Gmail..."}
                    </p>
                </div>
            )}

            {/* Step 2: Config */}
            {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="text-center space-y-3">
                        <div className="text-4xl mb-4">✨</div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight font-display">¡Perfil listo!</h1>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            Ahora decinos por dónde y a qué hora querés que te hablemos todos los días.
                        </p>
                    </div>

                    <form onSubmit={handleStep2Submit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="bg-white p-8 rounded-3xl border-2 border-gray-100 shadow-sm focus-within:border-adhoc-violet/50 transition-colors">
                                <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3">Tu WhatsApp</label>
                                <input
                                    type="tel"
                                    required
                                    placeholder="+54 9 11 ..."
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full text-2xl font-bold text-gray-900 focus:outline-none placeholder:text-gray-200"
                                />
                            </div>

                            <div className="bg-white p-8 rounded-3xl border-2 border-gray-100 shadow-sm focus-within:border-adhoc-violet/50 transition-colors">
                                <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3">Hora del Briefing</label>
                                <input
                                    type="time"
                                    required
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full text-4xl font-black text-adhoc-violet focus:outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-adhoc-violet text-white h-16 rounded-2xl font-bold text-lg hover:bg-adhoc-violet/90 transition-all shadow-xl shadow-adhoc-violet/20 disabled:opacity-50"
                        >
                            {isSaving ? "Guardando..." : "Confirmar y Seguir"}
                        </button>
                    </form>
                </div>
            )}

            {/* Step 3: WhatsApp Activation */}
            {step === 3 && (
                <div className="text-center space-y-10 animate-in fade-in zoom-in duration-700">
                    <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-4xl shadow-inner shadow-emerald-200">
                        ✅
                    </div>
                    <div className="space-y-6">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight font-display">¡Todo listo, Che!</h1>
                        <div className="text-lg text-gray-500 font-medium space-y-4 leading-relaxed">
                            <p>Mañana a las <span className="text-adhoc-violet font-black">{time}</span> vas a recibir tu primer **Tuqui de tus mañanas**.</p>
                        </div>
                    </div>

                    <div className="bg-adhoc-violet/5 p-8 rounded-3xl border border-adhoc-violet/10 space-y-6">
                        <div className="flex items-center gap-3 text-adhoc-violet">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            <h3 className="text-xl font-black">¡Un último paso!</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Para recibir tus audios por WhatsApp, enviá un mensaje rápido al número de Tuqui.
                        </p>
                        <a
                            href={`https://wa.me/5491148999536?text=${encodeURIComponent("Hola Tuqui! Despertate ☀️")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-green-200 transition-all active:translate-y-0"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            Activar Primer Audio
                        </a>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            💡 TIP: Agendá +54 9 11 4899-9536 como "Tuqui" en tus contactos
                        </p>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={finishOnboarding}
                            className="w-full bg-gray-900 text-white h-16 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl shadow-gray-200"
                        >
                            Ir a mi Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
