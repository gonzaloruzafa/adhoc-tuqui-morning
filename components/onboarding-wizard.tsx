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
        <div className="min-h-screen bg-gradient-to-b from-[#E0F2FE] via-[#FDFCFB] to-white px-6 py-20 flex flex-col items-center">
            {/* Header with Branding */}
            <header className="mb-12 text-center space-y-4">
                <div className="relative w-8 h-8 mx-auto opacity-30">
                    <Image src="/adhoc-logo.png" alt="Adhoc" width={32} height={32} className="grayscale" />
                </div>
                <div className="flex justify-center gap-3">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`h-1 w-8 rounded-full transition-all duration-500 ${step >= s ? 'bg-[#7C6CD8]' : 'bg-gray-200'}`}
                        />
                    ))}
                </div>
            </header>

            {/* Content Container */}
            <main className="w-full max-w-sm">

            {/* Step 1: Analysis - New Design */}
            {step === 1 && (
                <div className="text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="relative w-32 h-32 mx-auto">
                        <div className="absolute inset-0 bg-[#7C6CD8]/10 rounded-full animate-pulse scale-110"></div>
                        <div className="relative flex items-center justify-center h-full text-6xl">
                            <span className="animate-bounce">😊</span>
                        </div>
                    </div>

                    <h1 className="text-4xl font-display font-medium text-gray-900 leading-tight">
                        Estamos conociéndote.
                    </h1>

                    <div className="space-y-2">
                        {progress.total > 0 ? (
                            <>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#7C6CD8] transition-all duration-1000"
                                        style={{ width: `${Math.round((progress.count / Math.max(1, progress.total)) * 100)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#BCAFEF]">
                                    Analizando historial de Gmail ({progress.count}/{progress.total})
                                </p>

                                {isStuck && (
                                    <div className="mt-8 space-y-4 animate-in fade-in">
                                        <p className="text-xs text-adhoc-coral font-bold">
                                            El análisis está tomando más tiempo de lo esperado...
                                        </p>
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={handleRestart}
                                                className="bg-[#7C6CD8] text-white px-6 py-3 rounded-3xl font-bold text-xs shadow-lg shadow-[#7C6CD8]/20 hover:scale-105 transition-transform"
                                            >
                                                REINTENTAR
                                            </button>
                                            <button
                                                onClick={handleStop}
                                                disabled={isStopping}
                                                className="bg-white/60 backdrop-blur-xl border border-white text-gray-600 px-6 py-3 rounded-3xl font-bold text-xs hover:bg-white transition-all"
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
                                        className="mt-6 text-[9px] font-medium text-gray-400 hover:text-gray-500 uppercase tracking-widest transition-colors"
                                    >
                                        {isStopping ? "Deteniendo..." : "Detener análisis"}
                                    </button>
                                )}
                            </>
                        ) : (
                            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#BCAFEF] animate-pulse">
                                Iniciando análisis de Gmail...
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Config - Custom Inputs */}
            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="text-center space-y-3 mb-8">
                        <div className="text-5xl mb-4">✨</div>
                        <h1 className="text-3xl font-display font-medium text-gray-900">¡Perfil listo!</h1>
                        <p className="text-gray-500 font-light leading-relaxed">
                            Ahora configurá tu briefing matutino.
                        </p>
                    </div>

                    <form onSubmit={handleStep2Submit} className="space-y-6">
                        {/* WhatsApp Input Custom */}
                        <div className="group bg-white rounded-[32px] p-8 border border-[#E0F2FE] shadow-sm focus-within:ring-4 focus-within:ring-[#7C6CD8]/5 focus-within:border-[#7C6CD8]/30 transition-all">
                            <label className="block text-[10px] font-bold tracking-[0.2em] text-[#BCAFEF] uppercase mb-4">
                                Tu WhatsApp
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="tel"
                                    required
                                    placeholder="+54 9 11 1234 5678"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full text-2xl font-bold text-gray-900 bg-transparent outline-none placeholder:text-gray-100"
                                />
                                <div className="text-2xl grayscale group-focus-within:grayscale-0 transition-all">
                                    😊
                                </div>
                            </div>
                        </div>

                        {/* Time Input Custom */}
                        <div className="bg-white rounded-[32px] p-8 border border-[#E0F2FE] shadow-sm focus-within:ring-4 focus-within:ring-[#FEA912]/10 focus-within:border-[#FEA912]/30 transition-all">
                            <label className="block text-[10px] font-bold tracking-[0.2em] text-[#BCAFEF] uppercase mb-4">
                                Hora del Briefing
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="time"
                                    required
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full text-5xl font-display font-medium text-gray-900 bg-transparent outline-none cursor-pointer"
                                />
                            </div>
                            <p className="mt-4 text-xs text-gray-400 font-light">
                                Elegí el momento justo antes de salir de casa.
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-6 bg-[#7C6CD8] text-white rounded-[32px] font-bold text-lg shadow-2xl shadow-[#7C6CD8]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSaving ? "Guardando..." : "Confirmar y Seguir"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <div className="text-center space-y-12 animate-in fade-in zoom-in duration-1000">
                    <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 bg-[#7C6CD8]/5 rounded-full animate-pulse-slow"></div>
                        <div className="text-7xl drop-shadow-2xl">
                            😊
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl font-display font-medium text-gray-900 tracking-tight">
                            ¡Todo listo!
                        </h1>
                        <p className="text-lg text-gray-500 font-light max-w-[280px] mx-auto leading-relaxed">
                            Tu copiloto ya está preparado para hablarte mañana a las{' '}
                            <span className="text-[#7C6CD8] font-bold">{time}</span>.
                        </p>
                    </div>

                    <div className="bg-[#E9E5DF]/40 backdrop-blur-sm border border-white p-6 rounded-[32px] max-w-xs mx-auto">
                        <p className="text-xs text-gray-600 leading-relaxed">
                            <span className="font-bold">🔔 Tip:</span> Agendá a{' '}
                            <span className="text-[#7C6CD8] font-bold">Tuqui</span> en tus contactos
                            para que los audios se descarguen al instante.
                        </p>
                    </div>

                    <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-[32px] space-y-4">
                        <div className="flex items-center justify-center gap-3 text-[#25D366]">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            <span className="text-sm font-bold text-gray-700">Activá WhatsApp</span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Enviá un mensaje rápido para conectar tu cuenta.
                        </p>
                        <a
                            href={`https://wa.me/14155238886?text=${encodeURIComponent("join prepare-tonight")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-[#25D366] text-white py-4 rounded-3xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            Enviar Mensaje
                        </a>
                    </div>

                    <div className="pt-8">
                        <button
                            onClick={finishOnboarding}
                            className="w-full py-6 bg-[#7C6CD8] text-white rounded-[32px] font-bold text-lg shadow-2xl shadow-[#7C6CD8]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Ir al Dashboard
                        </button>
                    </div>

                    <footer className="pt-8 opacity-10">
                        <div className="relative w-6 h-6 mx-auto">
                            <Image src="/adhoc-logo.png" alt="Adhoc" width={24} height={24} className="grayscale" />
                        </div>
                    </footer>
                </div>
            )}
            </main>
        </div>
    );
}
