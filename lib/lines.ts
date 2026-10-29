import { useApplications } from "@/lib/applications-store";

// Metro look: every application is a "line" with a short code (J1, U1, P1…) and its own colour
export type Line = { code: string; color: string; textColor: string };

// The colours a line can have, in the order new lines get them; also the choices in the form
// One balanced set: every colour has the same OKLCH lightness (0.55) and chroma (0.16), only the hue
// changes, so no line looks louder than another and white text stays readable on all of them
export const LINE_COLORS = ["#3A6CCE", "#7A59C3", "#A3489D", "#BC3F53", "#B55000", "#008A39", "#008D7E", "#0081B7"];
// Colours too light for white text (none in the current set)
const DARK_TEXT_COLORS: string[] = [];

export const lineTextColor = (color: string) => (DARK_TEXT_COLORS.includes(color.toUpperCase()) ? "#0E0E10" : "#FFFFFF");

const LETTER: Record<ApplicationType, string> = { job: "J", university: "U", professor: "P" };

export const LINE_NAME: Record<ApplicationType, string> = {
    job: "Job",
    university: "University",
    professor: "Professor",
};

// Numbered in the order they were added, so a line keeps its code and colour when others change;
// a colour picked in the form wins over the automatic one
export const getLines = (applications: Application[]) => {
    const lines: Record<string, Line> = {};
    const perType: Record<ApplicationType, number> = { job: 0, university: 0, professor: 0 };
    [...applications]
        .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))
        .forEach((application, index) => {
            const color = application.color ?? LINE_COLORS[index % LINE_COLORS.length];
            perType[application.type] += 1;
            lines[application.id] = {
                code: `${LETTER[application.type]}${perType[application.type]}`,
                color,
                textColor: lineTextColor(color),
            };
        });
    return lines;
};

const FALLBACK: Line = { code: "·", color: "#6E6E76", textColor: "#FFFFFF" };

export const useLine = (id?: string) => {
    const { applications } = useApplications();
    return (id && getLines(applications)[id]) || FALLBACK;
};
