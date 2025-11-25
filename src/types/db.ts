import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: 'admin' | 'artist' | 'client';
    phoneNumber?: string;
    photoURL?: string;
    createdAt: Timestamp;
}

export interface Product {
    id?: string;
    name: string;
    sku: string;
    category: 'insumo' | 'venta';
    currentStock: number;
    minStock: number;
    price: number;
    unit: string;
    imageUrl?: string;
    description?: string;
}

export interface Batch {
    id?: string;
    productId: string;
    batchNumber: string;
    entryDate: Timestamp;
    expiryDate?: Timestamp;
    remainingQuantity: number;
    costPerUnit: number;
}

export interface Quote {
    id?: string;
    clientName: string;
    clientPhone: string;
    description: string;
    bodyPart: string;
    status: 'nueva' | 'negociacion' | 'agendada' | 'archivada';
    createdAt: Timestamp;
}

// ... (tus otras interfaces)

export interface ServiceDetail {
    title: string;       // Ej: "Proceso"
    description: string; // Ej: "Desde el diseño..."
    iconKey: 'edit' | 'shield' | 'check' | 'star'; // Para mapear el icono en el frontend
}

export interface Service {
    id?: string;
    title: string;           // Ej: "Tatuajes"
    mainDescription: string; // La descripción larga principal
    imageUrl: string;        // URL de Firebase Storage
    details: ServiceDetail[]; // Array con los puntos (Proceso, Materiales, etc.)
    active: boolean;
    createdAt?: any;
}

export interface PortfolioAlbum {
    id?: string;
    title: string;        // Ej: "Tatuajes Realistas"
    subtitle?: string;    // Ej: "Nuestros mejores trabajos en sombra"
    coverUrl: string;     // La imagen que se ve en la tarjeta principal
    galleryUrls: string[]; // Array con TODAS las fotos de adentro
    createdAt?: any;
}

export interface Artist {
    id?: string;
    name: string;         // Ej: "Alex Cuervo"
    specialty: string;    // Ej: "Tatuador Residente & Fundador"
    bio: string;          // La descripción larga
    photoUrl: string;     // Foto vertical principal
    active: boolean;
    
    // --- NUEVOS CAMPOS DE CONTACTO ---
    instagramUrl?: string; // URL completa (https://instagram.com/...)
    facebookUrl?: string;  // URL completa
    whatsappNumber?: string; // Solo el número (Ej: 52199999999) para generar el link API
    portfolioAlbumId?: string; // ID del álbum de portafolio que creamos en el paso anterior (opcional)
    
    createdAt?: any;
}

export interface Appointment {
    id?: string;
    // Datos Cliente
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    
    // Datos Proyecto
    serviceType: 'tatuaje' | 'piercing' | 'cotizacion' | 'micro';
    bodyPart?: string;
    description?: string;
    referenceImage?: string;

    // Datos Agenda
    artistId: string; // ID del artista seleccionado
    artistName: string; // Guardamos el nombre para no hacer tantas lecturas
    date: Timestamp; // Fecha y Hora exacta de inicio
    durationMin: number; // Duración estimada (ej. 60, 120 min)
    
    // Estado
    status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'noshow';
    depositAmount: number;
    googleCalendarEventId?: string; // Para futura integración

    notes?: string;
    createdAt: Timestamp;

    
}