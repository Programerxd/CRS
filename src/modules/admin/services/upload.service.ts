import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase/client";

export const uploadImage = async (file: File, folder: string): Promise<string | null> => {
  try {
    // Crear nombre único: carpeta/timestamp_nombrearchivo
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    // Subir el archivo
    const snapshot = await uploadBytes(storageRef, file);
    
    // Obtener la URL pública
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error subiendo imagen:", error);
    return null;
  }
};