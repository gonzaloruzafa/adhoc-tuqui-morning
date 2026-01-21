"use client";

import { saveConfiguration } from "@/app/actions";
import { useTransition, useState } from "react";
import { toast } from "sonner";

function PreviewControl() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ audioUrl: string, script: string } | null>(null);

    async function handlePreview() {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch("/api/internal/preview-audio", { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed");
            }
            setResult(data);
            toast.success("Audio generado con éxito");
        } catch (e: any) {
            toast.error("Error generando audio: " + e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-3 bg-white/60 backdrop-blur-xl border border-white p-5 rounded-3xl">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Preview Audio</span>
                <button
                    type="button"
                    onClick={handlePreview}
                    disabled={loading}
                    className="text-xs bg-[#7C6CD8] text-white px-4 py-2 rounded-2xl hover:bg-[#7C6CD8]/90 transition-all disabled:opacity-50 font-bold"
                >
                    {loading ? "Generando..." : "Generar"}
                </button>
            </div>

            {result && (
                <div className="space-y-3 animate-in fade-in">
                    <audio controls src={result.audioUrl} className="w-full rounded-2xl" />
                    <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer font-medium hover:text-[#7C6CD8]">Ver Script</summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded-2xl whitespace-pre-wrap max-h-40 overflow-y-auto text-[10px] font-mono">
                            {result.script}
                        </div>
                    </details>
                </div>
            )}
        </div>
    )
}

interface ConfigFormProps {
    initialData: {
        phone: string;
        timezone: string;
        timeLocal: string;
        enabled: boolean;
    };
}

export function ConfigForm({ initialData }: ConfigFormProps) {
    const [isPending, startTransition] = useTransition();

    function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await saveConfiguration(formData);
            if (result.error) {
                toast.error("Error al guardar");
            } else {
                toast.success("Configuración guardada");
            }
        });
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            {/* Info Card */}
            <div className="bg-[#F0F9FF] p-6 rounded-[32px] border border-[#BAE6FD]/50 space-y-4">
                <p className="text-sm text-[#0369A1] font-medium leading-relaxed">
                    Ajusta cómo quieres recibir tu dosis matutina de información. Estamos aquí para hacer que tu comienzo del día sea despejado.
                </p>
            </div>

            {/* Time Input */}
            <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-2">
                    Hora del Briefing
                </label>
                <div className="relative">
                    <input
                        type="time"
                        name="timeLocal"
                        defaultValue={initialData.timeLocal}
                        className="w-full p-5 bg-white border border-[#E0F2FE] rounded-3xl text-2xl font-display focus:ring-4 focus:ring-[#7C6CD8]/5 focus:border-[#7C6CD8] outline-none transition-all"
                    />
                    <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>

            {/* WhatsApp Input */}
            <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-2">
                    WhatsApp
                </label>
                <div className="relative">
                    <input
                        type="tel"
                        name="phone"
                        placeholder="+54 9 11 1234 5678"
                        defaultValue={initialData.phone}
                        className="w-full p-5 bg-white border border-[#E0F2FE] rounded-3xl text-xl font-medium focus:ring-4 focus:ring-[#7C6CD8]/5 focus:border-[#7C6CD8] outline-none transition-all placeholder:text-gray-200"
                    />
                    <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
            </div>

            {/* Timezone Select */}
            <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-2">
                    Zona Horaria
                </label>
                <select
                    name="timezone"
                    defaultValue={initialData.timezone}
                    className="w-full p-5 bg-white border border-[#E0F2FE] rounded-3xl text-lg font-medium focus:ring-4 focus:ring-[#7C6CD8]/5 focus:border-[#7C6CD8] outline-none transition-all appearance-none cursor-pointer"
                >
                    <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                    <option value="America/New_York">New York (EST)</option>
                    <option value="Europe/Madrid">Madrid (CET)</option>
                    <option value="UTC">UTC</option>
                </select>
            </div>

            {/* Enabled Toggle */}
            <div className="flex items-center justify-between p-6 bg-white/60 backdrop-blur-xl border border-white rounded-[32px]">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#7C6CD8]/10 flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#7C6CD8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Envío Diario</p>
                        <p className="text-xs text-gray-500">Todos los días</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        name="enabled"
                        defaultChecked={initialData.enabled}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7C6CD8]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7C6CD8]"></div>
                </label>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isPending}
                className="w-full py-6 bg-[#7C6CD8] text-white rounded-[32px] font-bold text-lg shadow-xl shadow-[#7C6CD8]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
                {isPending ? "Guardando..." : "Guardar cambios"}
            </button>

            {/* Debug & Preview Zone */}
            <div className="pt-6 space-y-4">
                <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>

                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF7348]"></span>
                    Testing & Debug
                </h3>

                {/* Audio Preview */}
                <PreviewControl />

                {/* Debug User Status */}
                <button
                    type="button"
                    onClick={async () => {
                        const res = await fetch('/api/internal/debug-user');
                        const data = await res.json();
                        console.log("🔍 Debug Info:", data);

                        const status = data.diagnosis?.canReceiveMessages
                            ? `✅ WhatsApp Activo (expira en ${data.window.timeUntilExpiry})`
                            : `❌ WhatsApp Inactivo - ${data.diagnosis?.phoneConfigured ? 'Ventana cerrada' : 'Teléfono no configurado'}`;

                        toast.info(status, { duration: 5000 });
                    }}
                    className="w-full rounded-3xl bg-blue-50 border border-blue-100 px-5 py-4 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-all"
                >
                    Ver Estado WhatsApp
                </button>

                {/* Force Send */}
                <button
                    type="button"
                    onClick={async () => {
                        toast.promise(
                            fetch('/api/internal/trigger-pipeline', { method: 'POST' }).then(async r => {
                                if (!r.ok) throw new Error("Error");
                                return r.json();
                            }),
                            {
                                loading: 'Iniciando briefing...',
                                success: 'Briefing iniciado! Te llegará por WhatsApp hoy.',
                                error: 'Error al iniciar briefing'
                            }
                        );
                    }}
                    className="w-full rounded-3xl bg-white/60 backdrop-blur-xl border border-white px-5 py-4 text-sm font-medium text-gray-700 hover:bg-white transition-all"
                >
                    Forzar Envío Ahora
                </button>
            </div>
        </form>
    );
}
