import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { DEMO_MODE, DEMO_USER } from "@/lib/demo";

type AuthState = {
    user: User | null;
    // True until Firebase has restored the saved session on app start
    initializing: boolean;
};

// Demo build only: signs in and out without Firebase
type DemoAuth = {
    demoSignIn?: (email: string, name?: string) => void;
    demoSignOut?: () => void;
};

const AuthContext = createContext<AuthState & DemoAuth>({ user: null, initializing: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // The demo build starts signed in as the sample user and never talks to Firebase
    const [state, setState] = useState<AuthState>(
        DEMO_MODE ? { user: DEMO_USER, initializing: false } : { user: null, initializing: true },
    );

    // Fires once with the restored session, then again on every sign-in or sign-out
    useEffect(() => {
        if (DEMO_MODE) return;
        return onAuthStateChanged(auth, (user) => setState({ user, initializing: false }));
    }, []);

    const demo: DemoAuth = DEMO_MODE
        ? {
              demoSignIn: (email, name) =>
                  setState({
                      user: { ...DEMO_USER, email, displayName: name || DEMO_USER.displayName } as User,
                      initializing: false,
                  }),
              demoSignOut: () => setState({ user: null, initializing: false }),
          }
        : {};

    return <AuthContext.Provider value={{ ...state, ...demo }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
