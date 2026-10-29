// Web stand-in for expo-notifications: delivers reminders while the app is open as an in-app
// banner with a chime, plus a browser notification when the browser allows it
import { playChime } from "@/lib/web-sound";

export type WebReminder = {
    identifier: string;
    date: Date;
    title: string;
    body: string;
    applicationId: string;
    alarm: boolean;
};

// setTimeout can't wait longer than about 24.8 days; later reminders are scheduled on a later sync
const MAX_DELAY = 2 ** 31 - 1;

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const bannerListeners = new Set<(reminder: WebReminder) => void>();
const tapListeners = new Set<(applicationId: string) => void>();
let delivered: WebReminder[] = [];

const showBrowserNotification = (reminder: WebReminder) => {
    try {
        const Notify = (globalThis as unknown as { Notification?: typeof Notification }).Notification;
        if (!Notify || Notify.permission !== "granted") return;
        const n = new Notify(reminder.title, { body: reminder.body, tag: reminder.identifier });
        n.onclick = () => {
            globalThis.focus?.();
            tap(reminder.applicationId);
        };
    } catch {
        // Not available in this browser or frame; the in-app banner still shows
    }
};

export const deliver = (reminder: WebReminder) => {
    delivered = [{ ...reminder, date: new Date() }, ...delivered].slice(0, 20);
    playChime();
    showBrowserNotification(reminder);
    bannerListeners.forEach((listener) => listener(reminder));
};

// Replaces every scheduled reminder with this list
export const syncWebReminders = (reminders: WebReminder[]) => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    const now = Date.now();
    reminders.forEach((reminder) => {
        const delay = reminder.date.getTime() - now;
        if (delay < 0 || delay > MAX_DELAY) return;
        timers.set(reminder.identifier, setTimeout(() => {
            timers.delete(reminder.identifier);
            deliver(reminder);
        }, delay));
    });
};

// Asks for browser notifications once; reminders work without them as in-app banners
export const requestWebPermission = async () => {
    try {
        const Notify = (globalThis as unknown as { Notification?: typeof Notification }).Notification;
        if (Notify && Notify.permission === "default") await Notify.requestPermission();
    } catch {
        // Refused or unsupported: banners only
    }
    return true;
};

export const getDeliveredReminders = () => delivered;

export const onReminderBanner = (listener: (reminder: WebReminder) => void) => {
    bannerListeners.add(listener);
    return () => {
        bannerListeners.delete(listener);
    };
};

export const tap = (applicationId: string) => tapListeners.forEach((listener) => listener(applicationId));

export const onReminderTap = (listener: (applicationId: string) => void) => {
    tapListeners.add(listener);
    return () => {
        tapListeners.delete(listener);
    };
};
