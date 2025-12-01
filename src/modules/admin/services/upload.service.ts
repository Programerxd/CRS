import { ref, uploadBytes, getDownloadURL, deleteObject} from "firebase/storage";
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

export const deleteImageFromStorage = async (imageUrl: string) => {
    try {
        // Firebase es inteligente: si le pasas la URL completa a ref(), él encuentra el archivo
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
        return true;
    } catch (error) {
        console.error("Error borrando imagen de Storage:", error);
        return false;
    }
};