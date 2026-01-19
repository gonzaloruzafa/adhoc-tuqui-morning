"use client";

import { useState } from "react";
import { updateUserProfile, retriggerProfileAnalysis } from "@/app/actions";
import { useRouter } from "next/navigation";

interface ProfileEditorProps {
    initialBio: string | null;
}

export function ProfileEditor({ initialBio }: ProfileEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(initialBio || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isRecalculating, setIsRecalculating] = useState(false);
    const router = useRouter();

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
        try {
            const result = await retriggerProfileAnalysis();
            alert(result.message);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Error al iniciar el recalculado");
        } finally {
            setIsRecalculating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight">Tu Bio Profesional</h2>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
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
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest disabled:opacity-50"
                            >
                                {isSaving ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    )}
                </div>

                {!isEditing ? (
                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 min-h-[100px]">
                        <p className="text-sm text-gray-700 leading-relaxed italic">
                            {bio || "Aún no hay una descripción generada. Hacé clic en 'Recalcular' para generarla automáticamente."}
                        </p>
                    </div>
                ) : (
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full p-5 rounded-2xl bg-white border-2 border-indigo-100 focus:border-indigo-500 focus:outline-none text-sm text-gray-700 leading-relaxed min-h-[150px] transition-all"
                        placeholder="Describite brevemente..."
                    />
                )}
            </div>

            <div className="flex justify-center">
                <button
                    onClick={handleRecalculate}
                    disabled={isRecalculating}
                    className="group relative flex items-center gap-2 bg-indigo-50 text-indigo-700 px-6 py-3 rounded-2xl font-bold hover:bg-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                >
                    <svg className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isRecalculating ? "Analizando emails..." : "Recalcular con Inteligencia"}
                </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center font-medium max-w-xs mx-auto">
                El recalculado analizará tus últimos 300 emails (incluyendo Gmail, Enviados y Archivados) para refinar tu perfil.
            </p>
        </div>
    );
}
