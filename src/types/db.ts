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