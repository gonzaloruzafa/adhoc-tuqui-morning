"use client";

import { saveConfiguration } from "@/app/actions";
import { useTransition } from "react";
import { toast } from "sonner";

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
                        <svg className="w-4 h-4 text-adhoc-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Hora del Briefing
                    </label>
                    <input
                        type="time"
                        name="timeLocal"
                        defaultValue={initialData.timeLocal}
                        className="block w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-adhoc-violet focus:ring-4 focus:ring-adhoc-violet/10 focus:outline-none hover:border-gray-300 font-medium shadow-sm"
                    />
                    <p className="mt-2 text-xs text-gray-500 font-medium">¿A qué hora salís de casa?</p>
                </div>

                {/* Timezone Select */}
                <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                        <svg className="w-4 h-4 text-adhoc-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Timezone
                    </label>
                    <select
                        name="timezone"
                        defaultValue={initialData.timezone}
                        className="block w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 transition-all duration-200 focus:border-adhoc-violet focus:ring-4 focus:ring-adhoc-violet/10 focus:outline-none hover:border-gray-300 font-medium shadow-sm appearance-none cursor-pointer"
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
                    <svg className="w-4 h-4 text-adhoc-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    WhatsApp
                </label>
                <input
                    type="tel"
                    name="phone"
                    placeholder="+54 9 11 1234-5678"
                    defaultValue={initialData.phone}
                    className="block w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-adhoc-violet focus:ring-4 focus:ring-adhoc-violet/10 focus:outline-none hover:border-gray-300 font-medium shadow-sm"
                />
                <p className="mt-2 text-xs text-gray-500 font-medium">Incluí el código de país (ej: +54911...)</p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-adhoc-violet to-adhoc-violet/90 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-adhoc-violet/30 transition-all duration-300 hover:shadow-xl hover:shadow-adhoc-violet/40 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-adhoc-violet/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {isPending ? (
                            <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Guardar Cambios
                            </>
                        )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-adhoc-violet/0 via-white/20 to-adhoc-violet/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
            </div>
        </form>
    );
}
