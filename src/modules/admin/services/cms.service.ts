import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

import { db } from "../../../firebase/client";

// 1. IMPORTAMOS LOS TIPOS DESDE TU ARCHIVO db.ts
import type { Artist, Service, PortfolioAlbum } from "../../../types/db";

// 2. MANTENEMOS SOLO PortfolioItem SI NO ESTÁ EN DB.TS (Para la compatibilidad con lo viejo)
export interface PortfolioItem {
  id?: string;
  title: string;
  imageUrl: string;
  category: "tatuaje" | "piercing" | "micro";
}

// --- ARTISTAS ---
// Nota: Ya no definimos 'interface Artist' aquí, usamos la importada
export const getArtists = async () => {
  const snap = await getDocs(collection(db, "artists"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Artist));
};

export const addArtist = async (artist: Artist) => {
  await addDoc(collection(db, "artists"), {
    ...artist,
    createdAt: serverTimestamp(),
  });
};

export const updateArtist = async (id: string, data: Partial<Artist>) => {
    await updateDoc(doc(db, "artists", id), data);
};

export const deleteArtist = async (id: string) => {
  await deleteDoc(doc(db, "artists", id));
};

// --- PORTAFOLIO (Legacy / Simple) ---
export const getPortfolio = async () => {
  const snap = await getDocs(collection(db, "portfolio"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PortfolioItem));
};

export const addPortfolioItem = async (item: PortfolioItem) => {
  await addDoc(collection(db, "portfolio"), {
    ...item,
    createdAt: serverTimestamp(),
  });
};

export const deletePortfolioItem = async (id: string) => {
  await deleteDoc(doc(db, "portfolio", id));
};

// --- SERVICIOS ---
export const getServices = async () => {
  const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));
};

export const addService = async (service: Service) => {
  await addDoc(collection(db, "services"), {
    ...service,
    createdAt: serverTimestamp(),
  });
};

export const deleteService = async (id: string) => {
  await deleteDoc(doc(db, "services", id));
};

export const updateService = async (id: string, data: Partial<Service>) => {
  await updateDoc(doc(db, "services", id), data);
};

// --- ÁLBUMES DE PORTAFOLIO (NUEVO SISTEMA) ---
export const getAlbums = async () => {
  const q = query(
    collection(db, "portfolio_albums"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PortfolioAlbum));
};

export const createAlbum = async (album: PortfolioAlbum) => {
  await addDoc(collection(db, "portfolio_albums"), {
    ...album,
    createdAt: serverTimestamp(),
  });
};

export const updateAlbum = async (
  id: string,
  data: Partial<PortfolioAlbum>
) => {
  await updateDoc(doc(db, "portfolio_albums", id), data);
};

export const addImagesToAlbum = async (albumId: string, newUrls: string[]) => {
  const albumRef = doc(db, "portfolio_albums", albumId);
  await updateDoc(albumRef, {
    galleryUrls: arrayUnion(...newUrls),
  });
};

export const removeImageFromAlbum = async (
  albumId: string,
  urlToRemove: string
) => {
  const albumRef = doc(db, "portfolio_albums", albumId);
  await updateDoc(albumRef, {
    galleryUrls: arrayRemove(urlToRemove),
  });
};

export const deleteAlbum = async (id: string) => {
  await deleteDoc(doc(db, "portfolio_albums", id));
};
