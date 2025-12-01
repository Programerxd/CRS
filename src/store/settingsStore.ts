import { map } from 'nanostores';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase/client';
import type { SystemSettings } from '../types/db';

export const $settings = map<SystemSettings>({
    studioName: 'Cuervo Rosa Studio',
    contactPhone: '',
    contactEmail: '',
    address: '',
    schedule: '',
    googleMapsUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    depositAmount: 500
});

// Función para conectar a Firebase
export function initSettingsListener() {
    console.log("📡 Iniciando escucha de configuración...");
    // Escucha el documento 'settings/general'
    return onSnapshot(doc(db, "settings", "general"), (snap) => {
        if (snap.exists()) {
            const data = snap.data() as SystemSettings;
            console.log("🔄 Datos actualizados recibidos:", data);
            $settings.set(data);
        }
    });
}