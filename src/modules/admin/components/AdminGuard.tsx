import { useState, useEffect } from 'react';
import { auth, db } from '../../../firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AdminLoginForm from './AdminLoginForm';

interface Props {
    children: React.ReactNode;
}

export default function AdminGuard({ children }: Props) {
    const [status, setStatus] = useState<'loading' | 'authorized' | 'login_required'>('loading');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            // CASO 1: No hay nadie logueado -> Mostrar Login Admin
            if (!user) {
                setStatus('login_required');
                return;
            }

            // CASO 2: Hay usuario, verificamos si es ADMIN
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const userData = userDoc.data();

                if (userData && userData.role === 'admin') {
                    // Es Admin -> DEJAR PASAR
                    setStatus('authorized');
                } else {
                    // CASO 3: Es usuario normal -> EXPULSAR
                    // "No carga nada, se queda donde estaba" (Redirigimos al home inmediatamente)
                    window.location.href = "/"; 
                }
            } catch (error) {
                console.error("Error verificando rol:", error);
                setStatus('login_required');
            }
        });

        return () => unsubscribe();
    }, []);

    // 1. Pantalla de carga (mientras verifica)
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // 2. Si requiere login (porque no es admin o no hay sesión)
    if (status === 'login_required') {
        return <AdminLoginForm />;
    }

    // 3. Si está autorizado, mostramos el contenido (El Dashboard)
    return <>{children}</>;
}