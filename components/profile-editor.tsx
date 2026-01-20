"use client";

import { useState, useEffect } from "react";
import { updateUserProfile, retriggerProfileAnalysis, cancelProfileAnalysis } from "@/app/actions";
import { useRouter } from "next/navigation";

interface ProfileEditorProps {
    initialBio: string | null;
    profileStatus?: string;
    userEmail: string;
}

export function ProfileEditor({ initialBio, profileStatus, userEmail }: ProfileEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(initialBio || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(profileStatus === 'analyzing');
    const [progress, setProgress] = useState({ count: 0, total: 0 });
    const [lastProgressAt, setLastProgressAt] = useState(Date.now());
    const [isStuck, setIsStuck] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const router = useRouter();

    // Polling for progress when recalculating
    useEffect(() => {
        if (!isRecalculating) {
            setIsStuck(false);
            return;
        }

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/internal/analyze-profile/status?email=${userEmail}`);
                const data = await res.json();

                if (data.count !== undefined && data.total !== undefined) {
                    if (data.count > progress.count || (data.total > 0 && progress.total === 0)) {
                        setLastProgressAt(Date.now());
                        setIsStuck(false);
                    }
                    setProgress({ count: data.count, total: data.total });
                }

                if (data.status === 'completed' || data.status === 'failed' || !data.status) {
                    setIsRecalculating(false);
                    router.refresh();
                }

                // If stuck for more than 40 seconds without progress change or if it hasn't even started
                if (Date.now() - lastProgressAt > 40000) {
                    setIsStuck(true);
                }
            } catch (e) {
                console.error("Progress check failed", e);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [isRecalculating, userEmail, router, progress.count, progress.total, lastProgressAt]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateUserProfile({ persona_description: bio });
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Error al guardar la bio");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRecalculate = async () => {
        setIsRecalculating(true);
        setIsStuck(false);
        setIsStopping(false);
        setLastProgressAt(Date.now());
        try {
            await retriggerProfileAnalysis();
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Error al iniciar el recalculado");
            setIsRecalculating(false);
        }
    };

    const handleStop = async () => {
        setIsStopping(true);
        try {
            await cancelProfileAnalysis();
            setIsRecalculating(false);
            setIsStuck(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Error al detener el análisis");
        } finally {
            setIsStopping(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight font-display">Tu Bio Profesional</h2>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs font-bold text-adhoc-violet hover:text-adhoc-violet/80 uppercase tracking-widest"
                        >
                            Editar
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-xs font-bold text-gray-400 hover:text-gray-500 uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="text-xs font-bold text-adhoc-violet hover:text-adhoc-violet/80 uppercase tracking-widest disabled:opacity-50"
                            >
                                {isSaving ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    )}
                </div>

                {!isEditing ? (
                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 min-h-[100px]">
                        <p className="text-sm text-gray-700 leading-relaxed italic">
                            {bio || "Aún no hay una descripción generada. Hacé clic en 'Actualizar Perfil' para generarla automáticamente."}
                        </p>
                    </div>
                ) : (
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full p-5 rounded-2xl bg-white border-2 border-adhoc-violet/20 focus:border-adhoc-violet focus:outline-none text-sm text-gray-700 leading-relaxed min-h-[150px] transition-all"
                        placeholder="Describite brevemente..."
                    />
                )}
            </div>

            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRecalculate}
                        disabled={isRecalculating && !isStuck}
                        className="group relative flex items-center gap-2 bg-adhoc-violet/10 text-adhoc-violet px-6 py-3 rounded-2xl font-bold hover:bg-adhoc-violet/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <svg className={`w-4 h-4 ${isRecalculating && !isStuck ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {isStuck ? "Reiniciar (Parece trabado)" : isRecalculating ? "Analizando emails..." : "Actualizar Perfil"}
                    </button>

                    {isRecalculating && (
                        <button
                            onClick={handleStop}
                            disabled={isStopping}
                            className="bg-gray-100 text-gray-500 px-4 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                        >
                            {isStopping ? "..." : "Detener"}
                        </button>
                    )}
                </div>

                {isRecalculating && progress.total >= 0 && (
                    <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-adhoc-violet/60">
                            <span>Progreso</span>
                            <span>{progress.count} / {progress.total}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-adhoc-violet h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${Math.round((progress.count / Math.max(1, progress.total)) * 100)}%` }}
                            ></div>
                        </div>
                        {isStuck && (
                            <p className="text-[9px] text-adhoc-coral font-bold text-center animate-pulse uppercase">
                                El análisis está tomando más tiempo. Podés detenerlo y volver a intentarlo.
                            </p>
                        )}
                    </div>
                )}
            </div>
            <p className="text-[10px] text-gray-400 text-center font-medium max-w-xs mx-auto">
                El recalculado analizará tus últimos 100 emails (incluyendo Gmail, Enviados y Archivados) para refinar tu perfil profesional.
            </p>
        </div>
    );
}
