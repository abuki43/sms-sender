export const theme = {
  colors: {
    // Canvas & Surfaces
    bg: "#FAF7F2",              // Warm Alabaster Canvas
    card: "#FFFFFF",            // Crisp White Surface
    cardSubtle: "#F5EFE8",      // Warm Sand Surface
    cardHover: "#EFE6DC",       // Slightly darker Sand
    border: "#EDE5DA",          // Hairline Warm Border
    borderFocus: "#3D2619",     // Espresso Focus Border

    // Primary Brand (Warm Espresso)
    primary: "#3D2619",         // Rich Espresso Brown
    primaryHover: "#543725",    // Warm Dark Mocha
    primaryMuted: "#8C5835",    // Terracotta Cinnamon Accent
    primaryLight: "#F3ECE4",    // Soft Espresso Tint
    primaryUltraLight: "#FAF5EF", // Ultra light Espresso Tint

    // Typography
    textPrimary: "#201610",     // Deep Charcoal Roast (High contrast)
    textSecondary: "#6E5F55",   // Warm Slate Body Text
    textMuted: "#9C8E84",       // Warm Taupe Placeholder
    textInverse: "#FFFFFF",     // Pure White

    // Status Accents
    success: "#266A48",         // Deep Forest Emerald
    successBg: "#EBF5EF",       // Sage Tint
    successText: "#184A32",     // Dark Forest Green
    warning: "#B45309",         // Warm Ochre Amber
    warningBg: "#FEF6EB",       // Amber Tint
    warningText: "#853B03",     // Dark Amber
    error: "#B91C1C",           // Terracotta Red
    errorBg: "#FDF2F2",         // Rose Tint
    errorText: "#7F1D1D",       // Dark Crimson
    info: "#3B6D8C",            // Soft Muted Teal/Blue
    infoBg: "#EDF5FA",          // Soft Teal Tint
    accent: "#D97736",          // Warm Amber Cinnamon
  },
  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
  shadow: {
    sm: {
      shadowColor: "#2A180E",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    md: {
      shadowColor: "#2A180E",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
      elevation: 4,
    },
    lg: {
      shadowColor: "#2A180E",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
  },
};
