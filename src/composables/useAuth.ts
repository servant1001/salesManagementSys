import { ref } from "vue";
import { auth } from "@/firebase";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";
import type { User } from "firebase/auth";

const user = ref<User | null>(null);
const error = ref<string | null>(null);

onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser;
});

const loginWithEmail = async (email: string, password: string) => {
    error.value = null;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
        error.value = err.message;
    }
};

const loginWithGoogle = async () => {
    error.value = null;
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (err: any) {
        error.value = err.message;
    }
};

const logout = async () => {
    await signOut(auth);
};

export function useAuth() {
    return { user, error, loginWithEmail, loginWithGoogle, logout };
}
