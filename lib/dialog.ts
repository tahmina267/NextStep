import { Alert, Linking, Platform } from "react-native";

// Alert.alert does nothing in a browser, and window.alert/confirm can be blocked (for example
// inside an embedded page), so on web these show an in-app dialog (components/DialogHost) instead

export type DialogRequest = {
    title: string;
    message?: string;
    confirmLabel?: string;
    destructive?: boolean;
    // Present for a question; the dialog then shows Cancel too
    onAnswer?: (confirmed: boolean) => void;
    link?: string;
};

let host: ((request: DialogRequest) => void) | null = null;

export const registerDialogHost = (show: (request: DialogRequest) => void) => {
    host = show;
    return () => {
        if (host === show) host = null;
    };
};

export const showMessage = (title: string, message?: string) => {
    if (Platform.OS !== "web") return Alert.alert(title, message);
    host?.({ title, message });
};

// Resolves true when the user confirms
export const confirmAction = (title: string, message: string, confirmLabel: string, destructive = false) =>
    new Promise<boolean>((resolve) => {
        if (Platform.OS !== "web") {
            Alert.alert(title, message, [
                { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                { text: confirmLabel, style: destructive ? "destructive" : "default", onPress: () => resolve(true) },
            ]);
            return;
        }
        if (!host) return resolve(false);
        host({ title, message, confirmLabel, destructive, onAnswer: resolve });
    });

// Opens a website or email link; a browser can block the new tab, and then the link is shown
// in a dialog to open or copy by hand
export const openLink = async (url: string) => {
    if (Platform.OS !== "web") return Linking.openURL(url);
    try {
        const opened = url.startsWith("mailto:") ? null : globalThis.open?.(url, "_blank");
        if (opened) {
            opened.opener = null;
            return;
        }
    } catch {
        // Fall through to the dialog
    }
    host?.({
        title: url.startsWith("mailto:") ? "Email" : "Open link",
        message: url.startsWith("mailto:") ? "Copy the address into your email app:" : "Your browser blocked the new tab. Open it here:",
        link: url.replace(/^mailto:/, "").split("?")[0],
    });
};
