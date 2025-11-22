import { 
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp 
} from "firebase/firestore";
import { db } from "../../../firebase/client";

// --- TIPOS ---
export interface Artist {
  id?: string;
  name: string;
  specialty: string;
  bio: string;
  photoUrl: string; // Por ahora pondremos URLs manuales, luego implementamos Storage
  active: boolean;
}

export interface PortfolioItem {
  id?: string;
  title: string;
  imageUrl: string;
  category: 'tatuaje' | 'piercing' | 'micro';
}

// --- ARTISTAS ---
export const getArtists = async () => {
  const snap = await getDocs(collection(db, "artists"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Artist));
};

export const addArtist = async (artist: Artist) => {
  await addDoc(collection(db, "artists"), { ...artist, createdAt: serverTimestamp() });
};

export const deleteArtist = async (id: string) => {
  await deleteDoc(doc(db, "artists", id));
};

// --- PORTAFOLIO ---
export const getPortfolio = async () => {
  const snap = await getDocs(collection(db, "portfolio"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioItem));
};

export const addPortfolioItem = async (item: PortfolioItem) => {
  await addDoc(collection(db, "portfolio"), { ...item, createdAt: serverTimestamp() });
};

export const deletePortfolioItem = async (id: string) => {
  await deleteDoc(doc(db, "portfolio", id));
};