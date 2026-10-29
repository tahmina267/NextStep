import dayjs from "dayjs";
import type { User } from "firebase/auth";
import { APPLICATIONS, USER } from "@/constants/data";

// Demo mode runs the app on the sample data in constants/data.json instead of Firebase,
// for a shareable preview build: EXPO_PUBLIC_DEMO=1 npx expo export --platform web
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO === "1";

// Stands in for a signed-in Firebase user; only the fields the app reads are filled in
export const DEMO_USER = {
    uid: USER.uid,
    email: USER.email,
    displayName: USER.name,
    photoURL: null,
    providerData: [{ providerId: "google.com" }],
} as unknown as User;

// Example circulars so "Ask NextStep" has something to search in the demo
const SAMPLE_CIRCULARS: Record<string, CircularSource> = {
    "job-technova-frontend": {
        text: `TechNova Ltd is hiring a Frontend Developer for our Dhaka office (hybrid).
Responsibilities
Build and maintain our customer dashboard in React and React Native. Work with designers to turn Figma designs into accessible components. Write unit tests and review pull requests.
Requirements
2+ years of experience with React or React Native. Good knowledge of TypeScript and state management (Redux or Zustand). Experience with REST APIs. A portfolio or GitHub with recent work.
Benefits
Salary 60,000–80,000 BDT per month, festival bonuses, health insurance, two work-from-home days a week.
How to apply
Send your CV and portfolio link through the careers page before 22 October, 11:59 PM. Shortlisted candidates will have a technical interview on Google Meet.`,
        headings: ["Responsibilities", "Requirements", "Benefits", "How to apply"],
    },
    "uni-alberta-mscs": {
        text: `University of Alberta, Department of Computing Science — MSc in Computing Science (thesis-based), Fall 2027 intake.
Admission requirements
A four-year bachelor's degree in computer science or a related field with a GPA of at least 3.3 on a 4.0 scale in the last two years. English proficiency: IELTS 7.0 overall with no band below 6.0, or TOEFL iBT 100.
Documents
Statement of purpose, CV, official transcripts, two reference letters, and English test scores. A writing sample is optional.
Funding
Admitted thesis-based students receive a guaranteed funding package through teaching and research assistantships.
Supervisors
Applicants are encouraged to contact potential supervisors before applying and to name them in the statement of purpose.
Deadline
Applications for Fall 2027 close on 15 December 2026.`,
        headings: ["Admission requirements", "Documents", "Funding", "Supervisors", "Deadline"],
    },
};

// The sample data is written around this day; moving every date by the same amount keeps
// "2 days left" and "follow up today" true whenever the demo is opened
const SAMPLE_TODAY = dayjs("2026-10-20");
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/;

const shiftDates = <T,>(value: T, days: number): T => {
    if (typeof value === "string") return (ISO_DATE.test(value) ? dayjs(value).add(days, "day").format() : value) as T;
    if (Array.isArray(value)) return value.map((item) => shiftDates(item, days)) as T;
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shiftDates(item, days)])) as T;
    }
    return value;
};

export const sampleApplications = (): Application[] =>
    shiftDates(APPLICATIONS, dayjs().startOf("day").diff(SAMPLE_TODAY, "day")).map((application) =>
        SAMPLE_CIRCULARS[application.id] ? { ...application, circular: SAMPLE_CIRCULARS[application.id] } : application,
    );

// Saved in this browser only, so a visitor's edits survive a reload but never reach anyone else
const STORAGE_KEY = "nextstep-demo-applications-v2";

export const loadDemoApplications = (): Application[] => {
    try {
        const saved = globalThis.localStorage?.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch {
        // Storage can be blocked (private windows); fall back to the sample data
    }
    return sampleApplications();
};

export const saveDemoApplications = (applications: Application[]) => {
    try {
        globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(applications));
    } catch {
        // Nothing to do: the demo still works for this visit
    }
};

export const clearDemoApplications = () => {
    try {
        globalThis.localStorage?.removeItem(STORAGE_KEY);
    } catch {
        // Ignore: the in-memory list is reset by the caller anyway
    }
};
