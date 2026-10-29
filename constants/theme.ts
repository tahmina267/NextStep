// Light and dark palettes with the same keys; every screen reads `colors`, which returns the active one
const light = {
    background: "#F3F3F5",
    foreground: "#0E0E10",
    card: "#FFFFFF",
    muted: "#EEEEF1",
    mutedForeground: "#6E6E76",
    primary: "#0E0E10",
    // Text and icons on a primary-coloured fill
    onPrimary: "#FFFFFF",
    accent: "#1E6BFF",
    border: "#E6E6EA",
    success: "#16a34a",
    destructive: "#dc2626",
    subscription: "#8fd1bd",
    job: "#DCE9FF",
    university: "#F3E3FB",
    professor: "#DDF5CF",
    urgent: "#B624C4",
    // Stronger versions of the type colors, for small dots and bars on the calendar
    jobStrong: "#3A6CCE",
    universityStrong: "#7A59C3",
    professorStrong: "#008A39",
};

export type Palette = typeof light;

// Same roles at night: near-black ground, raised dark cards, light ink, and accents lifted for contrast
const dark: Palette = {
    background: "#0E0E11",
    foreground: "#F2F2F5",
    card: "#18181D",
    muted: "#24242B",
    mutedForeground: "#A3A3AD",
    primary: "#F2F2F5",
    onPrimary: "#0E0E11",
    accent: "#6E9BFF",
    border: "#2A2A32",
    success: "#22c55e",
    destructive: "#F2555A",
    subscription: "#2F6B5C",
    job: "#1B2740",
    university: "#2A2140",
    professor: "#1A3124",
    urgent: "#D56BE0",
    jobStrong: "#7EA2F0",
    universityStrong: "#A88EE8",
    professorStrong: "#3FBF6E",
};

export type ColorScheme = "light" | "dark";
export const palettes: Record<ColorScheme, Palette> = { light, dark };

let active: Palette = light;

// Called by the appearance provider before the app renders with a new scheme
export const setActivePalette = (scheme: ColorScheme) => {
    active = palettes[scheme];
};

export const activeScheme = (): ColorScheme => (active === dark ? "dark" : "light");

export const colors = new Proxy({} as Palette, {
    get: (_, key) => active[key as keyof Palette],
}) as Readonly<Palette>;

// The same palette as the CSS variables the className styles read (global.css @theme)
export const cssVariables = (scheme: ColorScheme) =>
    Object.fromEntries(
        Object.entries(palettes[scheme]).map(([key, value]) => [`--color-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`, value]),
    ) as Record<`--${string}`, string>;

export const spacing = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    18: 72,
    20: 80,
    24: 96,
    30: 120,
} as const;

export const components = {
    tabBar: {
        height: spacing[18],
        horizontalInset: spacing[5],
        radius: spacing[8],
        iconFrame: spacing[12],
        itemPaddingVertical: spacing[2],
    },
} as const;

export const theme = {
    colors,
    spacing,
    components,
} as const;