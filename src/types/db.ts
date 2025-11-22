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