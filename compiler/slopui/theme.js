/**
 * SlopUI Theme Generator
 * Generates CSS variables from slop.json theme config
 */

const defaultTheme = {
  light: {
    bg: '#ffffff',
    bgSecondary: '#f9fafb',
    bgTertiary: '#f3f4f6',
    text: '#111827',
    textSecondary: '#4b5563',
    textTertiary: '#9ca3af',
    border: '#e5e7eb',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    secondary: '#6b7280',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  dark: {
    bg: '#0f172a',
    bgSecondary: '#1e293b',
    bgTertiary: '#334155',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#64748b',
    border: '#334155',
    primary: '#60a5fa',
    primaryHover: '#3b82f6',
    secondary: '#94a3b8',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa'
  },
  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem'
  },
  radius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px'
  },
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontMono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function adjustColor(hex, amount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const adjust = (c) => Math.min(255, Math.max(0, c + amount));
  const toHex = (c) => adjust(c).toString(16).padStart(2, '0');

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function generateThemeCSS(config = {}) {
  const theme = {
    light: { ...defaultTheme.light, ...config.light },
    dark: { ...defaultTheme.dark, ...config.dark },
    spacing: { ...defaultTheme.spacing, ...config.spacing },
    radius: { ...defaultTheme.radius, ...config.radius },
    fontFamily: config.fontFamily || defaultTheme.fontFamily,
    fontMono: config.fontMono || defaultTheme.fontMono
  };

  // Generate hover/active variants if not provided
  if (theme.light.primary && !config.light?.primaryHover) {
    theme.light.primaryHover = adjustColor(theme.light.primary, -20);
    theme.light.primaryActive = adjustColor(theme.light.primary, -40);
  }
  if (theme.dark.primary && !config.dark?.primaryHover) {
    theme.dark.primaryHover = adjustColor(theme.dark.primary, -20);
    theme.dark.primaryActive = adjustColor(theme.dark.primary, -40);
  }

  // Generate success/warning/error bg colors for light theme
  const generateBgColor = (color, isDark) => {
    const rgb = hexToRgb(color);
    if (!rgb) return color;
    if (isDark) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;
    }
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
  };

  let css = `/**
 * SlopUI Custom Theme
 * Generated from slop.json
 */

:root {
  /* Font */
  --font-family: ${theme.fontFamily};
  --font-mono: ${theme.fontMono};

  /* Spacing */
${Object.entries(theme.spacing).map(([k, v]) => `  --space-${k}: ${v};`).join('\n')}

  /* Border Radius */
${Object.entries(theme.radius).map(([k, v]) => `  --radius-${k}: ${v};`).join('\n')}
}

/* Light Theme */
[data-theme="light"], :root {
  --bg: ${theme.light.bg};
  --bg-secondary: ${theme.light.bgSecondary};
  --bg-tertiary: ${theme.light.bgTertiary};
  --text: ${theme.light.text};
  --text-secondary: ${theme.light.textSecondary};
  --text-tertiary: ${theme.light.textTertiary};
  --border: ${theme.light.border};
  --border-hover: ${adjustColor(theme.light.border, -20)};
  --primary: ${theme.light.primary};
  --primary-hover: ${theme.light.primaryHover || adjustColor(theme.light.primary, -20)};
  --primary-active: ${theme.light.primaryActive || adjustColor(theme.light.primary, -40)};
  --primary-text: #ffffff;
  --secondary: ${theme.light.secondary};
  --secondary-hover: ${adjustColor(theme.light.secondary, -20)};
  --secondary-text: #ffffff;
  --success: ${theme.light.success};
  --success-hover: ${adjustColor(theme.light.success, -20)};
  --success-bg: ${generateBgColor(theme.light.success, false)};
  --success-text: ${adjustColor(theme.light.success, -60)};
  --warning: ${theme.light.warning};
  --warning-hover: ${adjustColor(theme.light.warning, -20)};
  --warning-bg: ${generateBgColor(theme.light.warning, false)};
  --warning-text: ${adjustColor(theme.light.warning, -60)};
  --error: ${theme.light.error};
  --error-hover: ${adjustColor(theme.light.error, -20)};
  --error-bg: ${generateBgColor(theme.light.error, false)};
  --error-text: ${adjustColor(theme.light.error, -60)};
  --info: ${theme.light.info};
  --info-hover: ${adjustColor(theme.light.info, -20)};
  --info-bg: ${generateBgColor(theme.light.info, false)};
  --info-text: ${adjustColor(theme.light.info, -60)};
}

/* Dark Theme */
[data-theme="dark"] {
  --bg: ${theme.dark.bg};
  --bg-secondary: ${theme.dark.bgSecondary};
  --bg-tertiary: ${theme.dark.bgTertiary};
  --text: ${theme.dark.text};
  --text-secondary: ${theme.dark.textSecondary};
  --text-tertiary: ${theme.dark.textTertiary};
  --border: ${theme.dark.border};
  --border-hover: ${adjustColor(theme.dark.border, 20)};
  --primary: ${theme.dark.primary};
  --primary-hover: ${theme.dark.primaryHover || adjustColor(theme.dark.primary, -20)};
  --primary-active: ${theme.dark.primaryActive || adjustColor(theme.dark.primary, -40)};
  --primary-text: #0f172a;
  --secondary: ${theme.dark.secondary};
  --secondary-hover: ${adjustColor(theme.dark.secondary, 20)};
  --secondary-text: #0f172a;
  --success: ${theme.dark.success};
  --success-hover: ${adjustColor(theme.dark.success, -20)};
  --success-bg: ${generateBgColor(theme.dark.success, true)};
  --success-text: ${adjustColor(theme.dark.success, 40)};
  --warning: ${theme.dark.warning};
  --warning-hover: ${adjustColor(theme.dark.warning, -20)};
  --warning-bg: ${generateBgColor(theme.dark.warning, true)};
  --warning-text: ${adjustColor(theme.dark.warning, 40)};
  --error: ${theme.dark.error};
  --error-hover: ${adjustColor(theme.dark.error, -20)};
  --error-bg: ${generateBgColor(theme.dark.error, true)};
  --error-text: ${adjustColor(theme.dark.error, 40)};
  --info: ${theme.dark.info};
  --info-hover: ${adjustColor(theme.dark.info, -20)};
  --info-bg: ${generateBgColor(theme.dark.info, true)};
  --info-text: ${adjustColor(theme.dark.info, 40)};
}
`;

  return css;
}

module.exports = { generateThemeCSS, defaultTheme };
