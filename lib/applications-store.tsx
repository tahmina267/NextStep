import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import * as database from "@/lib/database";
import { DEMO_MODE, clearDemoApplications, loadDemoApplications, sampleApplications, saveDemoApplications } from "@/lib/demo";
import { showMessage } from "@/lib/dialog";
import { withoutUndefined } from "@/lib/utils";

type ApplicationsState = {
    applications: Application[];
    loading: boolean;
    error: string | null;
    // Returns the new id right away
    addApplication: (input: ApplicationInput) => string;
    updateApplication: (id: string, changes: Partial<ApplicationInput>) => void;
    // Like updateApplication, but fields left undefined are cleared instead of kept
    editApplication: (id: string, changes: Partial<ApplicationInput>) => void;
    deleteApplication: (id: string) => void;
    // Demo build only: puts the sample data back
    resetDemo?: () => void;
};

// A write reaches the local cache (and the listener) at once, but its promise settles only when the
// server confirms, which never happens while offline. So screens don't wait for it; a write the
// server rejects (e.g. by the security rules) is rolled back by Firebase and reported here
const reportFailure = (title: string) => (error: unknown) =>
    showMessage(title, error instanceof Error ? error.message : "Please try again");

const ApplicationsContext = createContext<ApplicationsState | null>(null);

// One shared empty list, so effects that depend on `applications` don't re-run on every render
const NO_APPLICATIONS: Application[] = [];

// Same order as the database query: by deadline, entries without one first
const byDeadline = (list: Application[]) =>
    [...list].sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));

// The demo build keeps the sample applications in memory (and in this browser's storage)
const DemoApplicationsProvider = ({ children }: { children: ReactNode }) => {
    const [applications, setApplications] = useState<Application[]>(() => byDeadline(loadDemoApplications()));

    const commit = (update: (current: Application[]) => Application[]) =>
        setApplications((current) => {
            const next = byDeadline(update(current));
            saveDemoApplications(next);
            return next;
        });

    const change = (id: string, apply: (application: Application) => Application) =>
        commit((current) => current.map((a) => (a.id === id ? apply(a) : a)));

    const stamp = () => new Date().toISOString();

    const value: ApplicationsState = {
        applications,
        loading: false,
        error: null,
        addApplication: (input) => {
            const id = `demo-${Date.now()}`;
            commit((current) => [...current, { ...withoutUndefined(input), id, createdAt: stamp(), updatedAt: stamp() } as Application]);
            return id;
        },
        updateApplication: (id, changes) =>
            change(id, (a) => ({ ...a, ...withoutUndefined(changes), updatedAt: stamp() }) as Application),
        // Fields left undefined are removed, like the database version
        editApplication: (id, changes) =>
            change(id, (a) => {
                const next = { ...a, ...changes, updatedAt: stamp() } as Record<string, unknown>;
                Object.keys(changes).forEach((key) => next[key] === undefined && delete next[key]);
                return next as unknown as Application;
            }),
        deleteApplication: (id) => commit((current) => current.filter((a) => a.id !== id)),
        resetDemo: () => {
            clearDemoApplications();
            setApplications(byDeadline(sampleApplications()));
        },
    };

    return <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>;
};

// Keeps the signed-in user's applications in sync with Realtime Database
const FirebaseApplicationsProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const uid = user?.uid;
    // Tagged with the uid it belongs to, so a previous user's data is never shown
    const [snapshot, setSnapshot] = useState<{ uid: string; applications: Application[]; error: string | null } | null>(null);

    // Start listening when a user signs in; the cleanup stops it on sign-out
    useEffect(() => {
        if (!uid) return;
        return database.subscribeToApplications(
            uid,
            (list) => setSnapshot({ uid, applications: list, error: null }),
            (err) => setSnapshot({ uid, applications: [], error: err.message }),
        );
    }, [uid]);

    // Derived during render instead of reset inside the effect
    const current = uid && snapshot?.uid === uid ? snapshot : null;
    const applications = current?.applications ?? NO_APPLICATIONS;
    const error = current?.error ?? null;
    const loading = !!uid && !current;

    const requireUid = () => {
        if (!user) throw new Error("You must be signed in");
        return user.uid;
    };

    // No need to update state by hand: the listener above picks up every write
    const value: ApplicationsState = {
        applications,
        loading,
        error,
        addApplication: (input) => {
            const { id, saved } = database.addApplication(requireUid(), input);
            saved.catch(reportFailure("Could not save"));
            return id;
        },
        updateApplication: (id, changes) => {
            database.updateApplication(requireUid(), id, changes).catch(reportFailure("Update failed"));
        },
        editApplication: (id, changes) => {
            database.editApplication(requireUid(), id, changes).catch(reportFailure("Could not save"));
        },
        deleteApplication: (id) => {
            database.deleteApplication(requireUid(), id).catch(reportFailure("Delete failed"));
        },
    };

    return <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>;
};

export const ApplicationsProvider = DEMO_MODE ? DemoApplicationsProvider : FirebaseApplicationsProvider;

export const useApplications = () => {
    const context = useContext(ApplicationsContext);
    if (!context) throw new Error("useApplications must be used inside ApplicationsProvider");
    return context;
};