// Web version of lib/alarms.ts. A browser can't ring while the tab is closed, so alarms ring
// while the app is open: a looping sound and the same ringing screen (app/alarm.tsx) as Android
import { startAlarmSound } from "@/lib/web-sound";

export const alarmsSupported = true;
export const SNOOZE_MINUTES = 5;
// Stop ringing on its own after 10 minutes, like a clock alarm
const RING_FOR_MS = 10 * 60_000;
// setTimeout can't wait longer than about 24.8 days; later alarms are scheduled on a later sync
const MAX_DELAY = 2 ** 31 - 1;

export type AlarmInput = {
    identifier: string;
    date: Date;
    title: string;
    body: string;
    applicationId: string;
};

// Same shape app/alarm.tsx reads from a react-native-notify-kit notification
type WebAlarm = { id: string; title: string; body: string; data: { applicationId: string } };

const scheduled = new Map<string, ReturnType<typeof setTimeout>>();
const ringing = new Map<string, { alarm: WebAlarm; stopSound: () => void; timeout: ReturnType<typeof setTimeout> }>();
const listeners = new Set<(id: string) => void>();

const ring = (alarm: WebAlarm) => {
    if (ringing.has(alarm.id)) return;
    const stopSound = startAlarmSound();
    const timeout = setTimeout(() => stopAlarm(alarm.id), RING_FOR_MS);
    ringing.set(alarm.id, { alarm, stopSound, timeout });
    listeners.forEach((listener) => listener(alarm.id));
};

const scheduleAt = (alarm: WebAlarm, date: Date) => {
    clearTimeout(scheduled.get(alarm.id));
    const delay = date.getTime() - Date.now();
    if (delay > MAX_DELAY) return;
    scheduled.set(alarm.id, setTimeout(() => {
        scheduled.delete(alarm.id);
        ring(alarm);
    }, Math.max(0, delay)));
};

const toAlarm = (id: string, title: string, body: string, applicationId: string): WebAlarm => ({
    id,
    title: `⏰ ${title}`,
    body,
    data: { applicationId },
});

// Makes the scheduled alarms match exactly; snoozed ones keep their own timers
export const syncAlarms = async (alarms: AlarmInput[]) => {
    [...scheduled.keys()].filter((id) => id.startsWith("alarm:")).forEach((id) => {
        clearTimeout(scheduled.get(id));
        scheduled.delete(id);
    });
    alarms.forEach((a) => scheduleAt(toAlarm(`alarm:${a.identifier}`, a.title, a.body, a.applicationId), a.date));
};

// Rings right away; used by the "Test alarm" button
export const ringNow = (title: string, body: string, applicationId: string) =>
    ring(toAlarm(`alarm:test-${Date.now()}`, title, body, applicationId));

export const stopAlarm = async (id: string) => {
    const current = ringing.get(id);
    if (!current) return;
    current.stopSound();
    clearTimeout(current.timeout);
    ringing.delete(id);
};

// Silences this alarm and rings it again in a few minutes
export const snoozeAlarm = async (notification: { id?: string; title?: string; body?: string; data?: { applicationId?: unknown } }) => {
    if (!notification.id) return;
    await stopAlarm(notification.id);
    const original = notification.id.replace(/^(alarm|snooze):/, "");
    const alarm = toAlarm(
        `snooze:${original}`,
        (notification.title ?? "").replace(/^⏰ /, ""),
        notification.body ?? "",
        String(notification.data?.applicationId ?? ""),
    );
    scheduleAt(alarm, new Date(Date.now() + SNOOZE_MINUTES * 60_000));
};

export const handleAlarmEvent = async () => false;
export const registerAlarmBackgroundHandler = () => {};
export const ensureAlarmPermissions = async () => {};

export const getRingingAlarm = async () => [...ringing.values()][0]?.alarm ?? null;
export const getAlarm = async (id: string) => ringing.get(id)?.alarm ?? null;

export const subscribeToAlarms = (onRing: (id: string) => void) => {
    listeners.add(onRing);
    return () => {
        listeners.delete(onRing);
    };
};
