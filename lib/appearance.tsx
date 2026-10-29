import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { Platform, View, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VariableContextProvider } from "nativewind";
import { cssVariables, setActivePalette, type ColorScheme } from "@/constants/theme";

// Light, dark, or whatever the phone is set to
export type AppearancePreference = "system" | ColorScheme;

type AppearanceState = {
    preference: AppearancePreference;
    scheme: ColorScheme;
    setPreference: (preference: AppearancePreference) => void;
};

const AppearanceContext = createContext<AppearanceState>({ preference: "system", scheme: "light", setPreference: () => {} });

const STORAGE_KEY = "appearance";

// Picks the palette for the whole app: the className styles read it as CSS variables, and code that
// reads `colors` gets it straight from constants/theme. The app redraws from the top when it changes
export const AppearanceProvider = ({ children }: { children: ReactNode }) => {
    const system = useColorScheme() === "dark" ? "dark" : "light";
    const [preference, setPreferenceState] = useState<AppearancePreference>("system");
    const scheme: ColorScheme = preference === "system" ? system : preference;

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then((saved) => {
                if (saved === "light" || saved === "dark" || saved === "system") setPreferenceState(saved);
            })
            .catch(() => {});
    }, []);

    const setPreference = (next: AppearancePreference) => {
        setPreferenceState(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    };

    // Before this render's children read `colors`
    setActivePalette(scheme);

    // On web, dialogs and sheets are drawn outside the app's own element, so the variables also go on the page root
    const useIsomorphicLayoutEffect = Platform.OS === "web" ? useLayoutEffect : useEffect;
    useIsomorphicLayoutEffect(() => {
        if (Platform.OS !== "web" || typeof document === "undefined") return;
        const root = document.documentElement;
        Object.entries(cssVariables(scheme)).forEach(([name, value]) => root.style.setProperty(name, value));
        root.style.colorScheme = scheme;
    }, [scheme]);

    return (
        <AppearanceContext.Provider value={{ preference, scheme, setPreference }}>
            <StatusBar style={scheme === "dark" ? "light" : "dark"} />
            <VariableContextProvider value={cssVariables(scheme)}>
                {/* Keyed on the scheme so every screen redraws with the new colours */}
                <View key={scheme} style={{ flex: 1 }}>
                    {children}
                </View>
            </VariableContextProvider>
        </AppearanceContext.Provider>
    );
};

export const useAppearance = () => useContext(AppearanceContext);
