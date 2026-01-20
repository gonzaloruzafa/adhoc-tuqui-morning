"use client";

import { useState, useEffect } from "react";
import { updateUserProfile, retriggerProfileAnalysis, cancelProfileAnalysis } from "@/app/actions";
import { useRouter } from "next/navigation";

interface ProfileEditorProps {
    initialBio: string | null;
    profileStatus?: string;
    userEmail: string;
    variant?: "default" | "button";
}

export function ProfileEditor({ initialBio, profileStatus, userEmail, variant = "default" }: ProfileEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(initialBio || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(profileStatus === 'analyzing');
    const [progress, setProgress] = useState({ count: 0, total: 0 });
    const [lastProgressAt, setLastProgressAt] = useState(Date.now());
    const [isStuck, setIsStuck] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [showModal, setShowModal] = useState(false);
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

                // If stuck for more than 40 seconds
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

    if (variant === "button") {
        return (
            <>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-adhoc-violet text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-adhoc-violet/90 transition shadow-lg shadow-adhoc-violet/20"
                >
                    Actualizar Perfil
                </button>

                {showModal && (
                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setShowModal(false);
                        }}
                    >
                        <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300 my-8" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Gestión de Perfil</h3>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Tu Biografía Profesional</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-adhoc-violet/20 focus:bg-white focus:outline-none text-sm text-gray-700 leading-relaxed min-h-[120px] transition-all"
                                        placeholder="Describite brevemente..."
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="text-xs font-black text-adhoc-violet uppercase tracking-widest hover:text-adhoc-violet/80 disabled:opacity-50"
                                        >
                                            {isSaving ? "Guardando..." : "Guardar Cambios"}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-3 w-full">
                                        <button
                                            onClick={handleRecalculate}
                                            disabled={isRecalculating && !isStuck}
                                            className="flex-1 group relative flex items-center justify-center gap-2 bg-adhoc-violet text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-adhoc-violet/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-adhoc-violet/10"
                                        >
                                            <svg className={`w-4 h-4 ${isRecalculating && !isStuck ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            {isStuck ? "Reiniciar" : isRecalculating ? "Analizando..." : "Recalcular con IA"}
                                        </button>

                                        {isRecalculating && (
                                            <button
                                                onClick={handleStop}
                                                disabled={isStopping}
                                                className="bg-gray-100 text-gray-500 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
                                            >
                                                {isStopping ? "..." : "Detener"}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-widest leading-relaxed">
                                        Analizaremos tus últimos 500 emails para refinar tu perfil profesional v3.0
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Biografía Generada</h2>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-[10px] font-black text-adhoc-violet hover:text-adhoc-violet/80 uppercase tracking-widest"
                        >
                            Editar
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-[10px] font-black text-gray-400 hover:text-gray-500 uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="text-[10px] font-black text-adhoc-violet hover:text-adhoc-violet/80 uppercase tracking-widest disabled:opacity-50"
                            >
                                {isSaving ? "..." : "Guardar"}
                            </button>
                        </div>
                    )}
                </div>

                {!isEditing ? (
                    <div className="p-6 rounded-[1.5rem] bg-gray-50/50 border border-gray-100 min-h-[100px] flex items-center italic">
                        <p className="text-lg text-gray-600 leading-relaxed font-medium">
                            "{bio || "Aún no hay una descripción generada."}"
                        </p>
                    </div>
                ) : (
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full p-6 rounded-[1.5rem] bg-white border-2 border-adhoc-violet/20 focus:border-adhoc-violet focus:outline-none text-lg text-gray-700 leading-relaxed min-h-[180px] transition-all"
                        placeholder="Describite brevemente..."
                    />
                )}
            </div>

            <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRecalculate}
                        disabled={isRecalculating && !isStuck}
                        className="group relative flex items-center gap-3 bg-adhoc-violet text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-adhoc-violet/90 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-adhoc-violet/10"
                    >
                        <svg className={`w-4 h-4 ${isRecalculating && !isStuck ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {isStuck ? "Reiniciar Análisis" : isRecalculating ? "Analizando emails..." : "Actualizar con Inteligencia"}
                    </button>

                    {isRecalculating && (
                        <button
                            onClick={handleStop}
                            disabled={isStopping}
                            className="bg-gray-100 text-gray-500 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
                        >
                            {isStopping ? "..." : "Detener"}
                        </button>
                    )}
                </div>

                {isRecalculating && progress.total >= 0 && (
                    <div className="w-full max-w-sm space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-adhoc-violet/60">
                            <span>Analizando Historial</span>
                            <span>{progress.count} / {progress.total} emails</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                            <div
                                className="bg-adhoc-violet h-full rounded-full transition-all duration-700 animate-pulse"
                                style={{ width: `${Math.round((progress.count / Math.max(1, progress.total)) * 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-widest leading-relaxed">
                Analizaremos tus últimos 500 emails para refinar tu perfil profesional v3.0
            </p>
        </div>
    );
}
