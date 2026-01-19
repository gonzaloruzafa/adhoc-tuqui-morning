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
            console.log("Requesting preview-audio...");
            const res = await fetch("/api/internal/preview-audio", { method: "POST" });
            console.log("Preview response status:", res.status);

            const data = await res.json();
            if (!res.ok) {
                console.error("Preview failed:", data);
                throw new Error(data.error || "Failed");
            }

            setResult(data);
            toast.success("Audio generado con éxito");
        } catch (e: any) {
            console.error("Preview error:", e);
            toast.error("Error generando audio: " + e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Audio Preview</span>
                <button
                    type="button"
                    onClick={handlePreview}
                    disabled={loading}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {loading ? "Generando..." : "Generar Audio"}
                </button>
            </div>

            {result && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <audio controls src={result.audioUrl} className="w-full h-8" />

                    <details className="text-xs text-gray-500">
                        <summary className="cursor-pointer font-medium hover:text-indigo-600">Ver Script</summary>
                        <div className="mt-2 p-2 bg-white rounded border border-gray-100 whitespace-pre-wrap max-h-40 overflow-y-auto font-mono text-[10px]">
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
        <form action={handleSubmit} className="space-y-7">
            {/* Time & Timezone Row */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Time Input */}
                <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Hora del Briefing
                    </label>
                    <input
                        type="time"
                        name="timeLocal"
                        defaultValue={initialData.timeLocal}
                        className="block w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 focus:outline-none hover:border-gray-300 font-medium shadow-sm"
                    />
                    <p className="mt-2 text-xs text-gray-500 font-medium">¿A qué hora salís de casa?</p>
                </div>

                {/* Timezone Select */}
                <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Timezone
                    </label>
                    <select
                        name="timezone"
                        defaultValue={initialData.timezone}
                        className="block w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 transition-all duration-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 focus:outline-none hover:border-gray-300 font-medium shadow-sm appearance-none cursor-pointer"
                    >
                        <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                        <option value="America/New_York">New York (EST)</option>
                        <option value="Europe/Madrid">Madrid (CET)</option>
                        <option value="UTC">UTC</option>
                    </select>
                </div>
            </div>

            {/* Phone Input */}
            <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    WhatsApp
                </label>
                <input
                    type="tel"
                    name="phone"
                    placeholder="+54 9 11 1234-5678"
                    defaultValue={initialData.phone}
                    className="block w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 focus:outline-none hover:border-gray-300 font-medium shadow-sm"
                />
                <p className="mt-2 text-xs text-gray-500 font-medium">Incluí el código de país (ej: +54911...)</p>
            </div>

            {/* Enabled Toggle */}
            <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Envío Diario Activado</p>
                        <p className="text-xs text-gray-500">Recibir WhatsApp todas las mañanas (Lunes a Viernes)</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        name="enabled"
                        defaultChecked={initialData.enabled}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-2xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-indigo-700 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Guardando...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Guardar Cambios</span>
                        </>
                    )}
                </button>
            </div>

            {/* Debug & Preview Zone */}
            <div className="pt-6 border-t border-gray-100 mt-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Zona de Pruebas & Debugging
                </h3>

                {/* Audio Preview */}
                <PreviewControl />

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
                    className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                    Forzar Envío (WhatsApp)
                </button>
            </div>
        </form>
    );
}
