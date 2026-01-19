"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveConfiguration } from "@/app/actions";
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
    const router = useRouter();

    // Step 1: Polling for profile completion
    useEffect(() => {
        if (step !== 1 || status === 'completed') return;

        const interval = setInterval(async () => {
            const res = await fetch(`/api/auth/session`); // Simple way to get fresh session data if needed, or create a specific status endpoint
            // Better: create a simple status endpoint or just use a fetch to a route that returns user status
            try {
                const statusRes = await fetch(`/api/internal/analyze-profile/status?email=${userEmail}`);
                const data = await statusRes.json();
                if (data.status === 'completed') {
                    setStatus('completed');
                    setStep(2);
                }
            } catch (e) {
                console.error("Status check failed", e);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [step, status, userEmail]);

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
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${step >= s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : 'bg-white border-2 border-gray-100 text-gray-300'
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
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-50 animate-ping"></div>
                        <div className="relative w-full h-full rounded-full bg-white flex items-center justify-center shadow-xl border border-indigo-50">
                            <span className="text-3xl animate-bounce">🧠</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight font-display">Estamos conociéndote...</h1>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            Tuqui está analizando tus últimos emails para entender tu ritmo de trabajo, tus temas clave y quiénes son tus contactos VIP.
                        </p>
                    </div>
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-1.5 h-12 bg-indigo-500 rounded-full animate-pulse"></div>
                            <p className="text-sm font-bold text-indigo-700 leading-tight">
                                "Esto nos permite armarte un briefing 100% a medida, descartando el spam y priorizando lo que importa."
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest animate-pulse">Analizando historial de Gmail...</p>
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
                            <div className="bg-white p-8 rounded-3xl border-2 border-indigo-50 shadow-sm focus-within:border-indigo-600 transition-colors">
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

                            <div className="bg-white p-8 rounded-3xl border-2 border-indigo-50 shadow-sm focus-within:border-indigo-600 transition-colors">
                                <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest mb-3">Hora del Briefing</label>
                                <input
                                    type="time"
                                    required
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full text-4xl font-black text-indigo-600 focus:outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-indigo-600 text-white h-16 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50"
                        >
                            {isSaving ? "Guardando..." : "Confirmar y Seguir"}
                        </button>
                    </form>
                </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <div className="text-center space-y-10 animate-in fade-in zoom-in duration-700">
                    <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-4xl shadow-inner shadow-emerald-200">
                        ✅
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight font-display">¡Todo listo, Che!</h1>
                        <div className="text-lg text-gray-500 font-medium space-y-4 leading-relaxed">
                            <p>Mañana a las <span className="text-indigo-600 font-black">{time}</span> vas a recibir tu primer **Tuqui de tus mañanas**.</p>
                            <p className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-sm">
                                🔔 <span className="font-bold">TIP:</span> Agendá este número en tus contactos como "Tuqui" para que los audios se carguen rápido.
                            </p>
                        </div>
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
