import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider 
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"; // <--- IMPORTACIONES NUEVAS
import { auth, db } from "../../firebase/client"; // <--- AGREGAMOS 'db'

// --- TIPOS ---
interface AuthCredentials {
  email: string;
  password: string;
  name?: string;
}

// --- REGISTRO CON CORREO (Y GUARDADO EN BD) ---
export const registerUser = async ({ email, password, name }: AuthCredentials) => {
  try {
    // 1. Crear usuario en Authentication (El sistema de Login)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Actualizar nombre en el perfil de Auth
    if (name) {
      await updateProfile(user, { displayName: name });
    }

    // 3. GUARDAR EN FIRESTORE (ESTO ES LO QUE FALTABA)
    // Creamos el documento en la colección 'users' usando el mismo UID que nos dio Auth
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: name || "Usuario",
      role: 'client', // Por defecto, todos nacen como clientes
      createdAt: serverTimestamp(), // Marca de tiempo del servidor
      photoURL: user.photoURL || null,
      phoneNumber: null
    });

    return { success: true, user: user };
  } catch (error: any) {
    console.error("Error en registro:", error);
    return { success: false, error: error.code };
  }
};

// --- LOGIN CON CORREO ---
export const loginUser = async ({ email, password }: AuthCredentials) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    console.error("Error en login:", error);
    return { success: false, error: error.code };
  }
};

// --- LOGIN CON GOOGLE (MEJORADO) ---
export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Validar si el usuario ya existe en Firestore para no sobrescribirlo
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // Si es la primera vez que entra con Google, lo guardamos en la BD
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "Usuario Google",
        role: 'client',
        createdAt: serverTimestamp(),
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber || null
      });
    }

    return { success: true, user: user };
  } catch (error: any) {
    console.error("Error Google:", error);
    return { success: false, error: error.code };
  }
};

// --- CERRAR SESIÓN ---
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

// --- ACTUALIZAR PERFIL ---
export const updateUserProfile = async (name: string) => {
    try {
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName: name });
            
            return { success: true };
        }
        return { success: false, error: "No hay usuario" };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}