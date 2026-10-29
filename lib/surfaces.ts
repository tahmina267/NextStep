import { activeScheme, colors } from "@/constants/theme";

// Shared backgrounds for the app's highlight surfaces. They're functions, so each render gets the
// version for the current light or dark palette

// A CSS gradient as a background: web reads backgroundImage, React Native (new architecture) reads
// experimental_backgroundImage; the plain colour underneath covers anything older
export const gradient = (css: string, fallback: string) =>
    ({ backgroundColor: fallback, backgroundImage: css, experimental_backgroundImage: css }) as object;

const isDark = () => activeScheme() === "dark";

// Gradients from the "Gradient Combinations" cheat sheet, two colours each so they stay calm and readable

// Behind highlighted sections (This week, the calendar, key dates, the profile card):
// soft pastel lilac → sky by day, deep indigo by night
export const wash = () =>
    isDark()
        ? gradient("linear-gradient(135deg, #0F0C29 0%, #302B63 100%)", "#1F1B46")
        : gradient("linear-gradient(135deg, #E0C3FC 0%, #8EC5FC 100%)", "#B7C4FC");

// Main actions (add, send, the countdown badge): the sheet's UI blue → slate blue, white on top
export const brand = () => gradient("linear-gradient(135deg, #3F8EFC 0%, #6A5ACD 100%)", "#5474E4");

// Things that need attention now ("Now", close deadlines): pink → violet
export const hot = () => gradient("linear-gradient(135deg, #FF6EC7 0%, #7873F5 100%)", "#BC70DE");

// The profile number tiles: soft sky, pink → lilac, lime → mint; darker in dark mode
const TILE_GRADIENTS = {
    light: [["#A1C4FD", "#C2E9FB"], ["#FBC2EB", "#A18CD1"], ["#D4FC79", "#96E6A1"]],
    dark: [["#1D2B55", "#1B3A4E"], ["#3A1F45", "#2C2452"], ["#22361C", "#1B3A2E"]],
};
export const tile = (index: number) => {
    const [from, to] = TILE_GRADIENTS[isDark() ? "dark" : "light"][index % 3];
    return gradient(`linear-gradient(135deg, ${from} 0%, ${to} 100%)`, from);
};

// A card with a little of an application's colour in its top-left corner
export const tintedCard = (color: string) =>
    gradient(`linear-gradient(135deg, ${color}${isDark() ? "33" : "1A"} 0%, ${colors.card} 55%)`, colors.card);

// A pale fill of a colour, for date tiles and type chips
export const pale = (color: string) => `${color}${isDark() ? "33" : "1F"}`;
