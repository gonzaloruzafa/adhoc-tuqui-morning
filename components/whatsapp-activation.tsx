"use client";

import { useState, useEffect } from "react";
import { getClient } from "@/lib/supabase/client";

interface WhatsAppActivationProps {
    userEmail: string;
}

export function WhatsAppActivation({ userEmail }: WhatsAppActivationProps) {
    const [status, setStatus] = useState<'pending' | 'active' | 'expired'>('pending');
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            const db = getClient();
            const { data } = await db
                .from("tuqui_morning_users")
                .select("whatsapp_status, whatsapp_window_expires_at")
                .eq("email", userEmail)
                .single();

            if (data) {
                setStatus(data.whatsapp_status as any || 'pending');
                setExpiresAt(data.whatsapp_window_expires_at);
            }
            setIsLoading(false);
        };

        fetchStatus();

        // Subscription para cambios en tiempo real
        const db = getClient();
        const channel = db.channel(`user-whatsapp-${userEmail}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'tuqui_morning_users',
                filter: `email=eq.${userEmail}`
            }, (payload) => {
                setStatus(payload.new.whatsapp_status);
                setExpiresAt(payload.new.whatsapp_window_expires_at);
            })
            .subscribe();

        return () => {
            db.removeChannel(channel);
        };
    }, [userEmail]);

    if (isLoading) return null;

    const isActive = status === 'active' && expiresAt && new Date(expiresAt) > new Date();

    // Twilio WhatsApp Number (Sandbox o Prod)
    const WA_NUMBER = "+14155238886";
    const ACTIVATION_TEXT = "Hola Tuqui! Despertate ☀️";
    const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(ACTIVATION_TEXT)}`;

    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative group transition-all duration-500 hover:shadow-2xl">
            {isActive ? (
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">WhatsApp Activado</h3>
                    <p className="text-sm text-gray-500 font-medium mb-6">
                        Ventana abierta hasta: <br />
                        <span className="font-black text-adhoc-violet">{new Date(expiresAt!).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                    </p>
                    <div className="bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-green-100">
                        Delivery Directo Habilitado
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-adhoc-violet/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                        <svg className="w-8 h-8 text-adhoc-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Despertar a Tuqui</h3>
                    <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed max-w-[200px]">
                        {status === 'expired'
                            ? "Tu ventana de 24hs se cerró. Mandá un mensaje para reactivar el delivery."
                            : "Activá WhatsApp para recibir tus audios cada mañana con costo reducido."}
                    </p>

                    <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:translate-y-[-2px] hover:shadow-lg hover:shadow-green-200 transition-all active:translate-y-0"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        Activar Ahora
                    </a>
                </div>
            )}

            <div className="absolute top-0 right-0 w-32 h-32 bg-adhoc-violet/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-adhoc-violet/10 transition-all duration-1000" />
        </div>
    );
}
