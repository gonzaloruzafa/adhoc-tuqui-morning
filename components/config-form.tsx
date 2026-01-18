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
        <form action={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Hora del Briefing</label>
                    <input
                        type="time"
                        name="timeLocal"
                        defaultValue={initialData.timeLocal}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-adhoc-violet focus:ring-adhoc-violet sm:text-sm p-2 border"
                    />
                    <p className="mt-1 text-xs text-gray-500">¿A qué hora salís de casa?</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                    <select
                        name="timezone"
                        defaultValue={initialData.timezone}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-adhoc-violet focus:ring-adhoc-violet sm:text-sm p-2 border bg-white"
                    >
                        <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                        <option value="America/New_York">New York (EST)</option>
                        <option value="Europe/Madrid">Madrid (CET)</option>
                        <option value="UTC">UTC</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">WhatsApp (con código de país)</label>
                <input
                    type="tel"
                    name="phone"
                    placeholder="+54911..."
                    defaultValue={initialData.phone}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-adhoc-violet focus:ring-adhoc-violet sm:text-sm p-2 border"
                />
                <p className="mt-1 text-xs text-gray-500">Donde te enviaremos el audio.</p>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-md bg-adhoc-violet px-4 py-2 text-sm font-medium text-white hover:bg-adhoc-violet/90 focus:outline-none focus:ring-2 focus:ring-adhoc-violet focus:ring-offset-2 disabled:opacity-50 transition-colors"
                >
                    {isPending ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>
        </form>
    );
}
