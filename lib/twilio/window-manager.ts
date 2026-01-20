import { getClient } from "@/lib/supabase/client";

/**
 * Busca usuarios con ventanas de WhatsApp expiradas y actualiza su estado.
 * Esto asegura que la UI muestre el estado correcto sin esperar a la próxima corrida.
 */
export async function cleanupExpiredWindows() {
    const db = getClient();
    const now = new Date().toISOString();

    console.log(`[WhatsApp Window Manager] Checking for expired windows at ${now}...`);

    // 1. Encontrar usuarios que están 'active' pero cuya ventana ya expiró
    const { data: expiredUsers, error } = await db
        .from("tuqui_morning_users")
        .select("email, whatsapp_window_expires_at")
        .eq("whatsapp_status", "active")
        .lt("whatsapp_window_expires_at", now);

    if (error) {
        console.error("[WhatsApp Window Manager] Error fetching expired users:", error);
        return { success: false, error };
    }

    if (!expiredUsers || expiredUsers.length === 0) {
        console.log("[WhatsApp Window Manager] No expired windows found.");
        return { success: true, updatedCount: 0 };
    }

    console.log(`[WhatsApp Window Manager] Found ${expiredUsers.length} expired windows. Updating...`);

    // 2. Actualizar estado a 'expired'
    const { error: updateError } = await db
        .from("tuqui_morning_users")
        .update({ whatsapp_status: "expired" })
        .in("email", expiredUsers.map(u => u.email));

    if (updateError) {
        console.error("[WhatsApp Window Manager] Error updating users:", updateError);
        return { success: false, error: updateError };
    }

    console.log(`[WhatsApp Window Manager] Successfully updated ${expiredUsers.length} users to 'expired'.`);
    return { success: true, updatedCount: expiredUsers.length };
}
