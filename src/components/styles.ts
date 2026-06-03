/**
 * Shared CSS styles for components
 */

export const COLORS = {
  primary: "#2196F3",
  secondary: "#FF9800",
  success: "#4CAF50",
  danger: "#f44336",
  warning: "#ff9800",
  info: "#2196F3",
  purple: "#9C27B0",
  gray: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#eeeeee",
    300: "#e0e0e0",
    400: "#bdbdbd",
    500: "#9e9e9e",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121"
  },
  blue: {
    50: "#e3f2fd",
    100: "#bbdefb",
    500: "#2196F3",
    700: "#1976d2"
  }
} as const

export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px"
} as const

export const BORDER_RADIUS = {
  sm: "4px",
  md: "6px",
  lg: "8px",
  full: "50%"
} as const

/**
 * Common button styles
 */
export const buttonStyle = (backgroundColor: string = COLORS.primary): string => `
  padding: ${SPACING.sm} ${SPACING.lg};
  background-color: ${backgroundColor};
  color: white;
  border: none;
  border-radius: ${BORDER_RADIUS.sm};
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
`

export const buttonDisabledStyle = `
  opacity: 0.5;
  cursor: not-allowed;
`

/**
 * Common container styles
 */
export const flexContainerStyle = (gap: string = SPACING.sm): string => `
  display: flex;
  gap: ${gap};
`

export const flexColumnStyle = (gap: string = SPACING.sm): string => `
  display: flex;
  flex-direction: column;
  gap: ${gap};
`

export const gridContainerStyle = (columns: string, gap: string = SPACING.md): string => `
  display: grid;
  grid-template-columns: ${columns};
  gap: ${gap};
`

/**
 * Common section/card styles
 */
export const cardStyle = `
  padding: ${SPACING.md};
  background: white;
  border-radius: ${BORDER_RADIUS.md};
  border: 1px solid ${COLORS.gray[300]};
`

export const sectionStyle = `
  padding: ${SPACING.lg};
  background: ${COLORS.gray[100]};
  border-radius: ${BORDER_RADIUS.lg};
  border: 1px solid #ddd;
`

/**
 * Common input styles
 */
export const inputStyle = `
  padding: ${SPACING.sm} ${SPACING.md};
  border: 1px solid #ccc;
  border-radius: ${BORDER_RADIUS.sm};
  font-size: 14px;
`

export const selectStyle = `
  padding: ${SPACING.sm} ${SPACING.sm};
  border: 1px solid #ccc;
  border-radius: ${BORDER_RADIUS.sm};
  font-size: 12px;
  background: white;
  cursor: pointer;
`

/**
 * Common text styles
 */
export const titleStyle = `
  font-weight: 600;
  margin-bottom: ${SPACING.sm};
  color: ${COLORS.gray[800]};
`

export const subtitleStyle = `
  font-weight: 600;
  font-size: 16px;
  margin-bottom: ${SPACING.md};
  color: ${COLORS.blue[700]};
  padding: ${SPACING.sm} ${SPACING.md};
  background: ${COLORS.blue[50]};
  border-radius: ${BORDER_RADIUS.sm};
`

export const labelStyle = `
  font-size: 12px;
  color: #666;
  margin-bottom: ${SPACING.xs};
`

export const monoTextStyle = `
  font-family: monospace;
`

/**
 * Color dot for function/series indicators
 */
export const colorDotStyle = (color: string, size: string = "12px"): string => `
  width: ${size};
  height: ${size};
  border-radius: ${BORDER_RADIUS.full};
  background-color: ${color};
  display: inline-block;
  flex-shrink: 0;
`

/**
 * Common wrapper styles
 */
export const scrollableWrapperStyle = (maxHeight: string = "400px"): string => `
  max-height: ${maxHeight};
  overflow: auto;
  margin-bottom: ${SPACING.xl};
`

/**
 * Tab styles
 */
export const tabButtonStyle = (active: boolean): string => `
  padding: ${SPACING.md} ${SPACING.xl};
  background: ${active ? "white" : COLORS.gray[200]};
  color: ${active ? COLORS.primary : COLORS.gray[700]};
  border: none;
  border-bottom: ${active ? `3px solid ${COLORS.primary}` : "3px solid transparent"};
  cursor: pointer;
  font-size: 14px;
  font-weight: ${active ? "600" : "normal"};
  transition: all 0.2s;
`

/**
 * Message/alert styles
 */
export const messageStyle = (type: "info" | "warning" | "error" | "success" = "info"): string => {
  const colors = {
    info: { bg: COLORS.blue[50], text: COLORS.blue[700] },
    warning: { bg: "#fff3e0", text: COLORS.warning },
    error: { bg: "#ffebee", text: COLORS.danger },
    success: { bg: "#e8f5e9", text: COLORS.success }
  }
  const { bg, text } = colors[type]

  return `
    padding: ${SPACING.md};
    background: ${bg};
    color: ${text};
    border-radius: ${BORDER_RADIUS.sm};
    text-align: center;
  `
}

/**
 * Diagnostic severity styles
 */
export const diagnosticColors = {
  success: COLORS.success,
  warning: COLORS.warning,
  error: COLORS.danger,
  info: COLORS.info
} as const

export const diagnosticIconStyle = (severity: keyof typeof diagnosticColors): string => `
  color: ${diagnosticColors[severity]};
  font-weight: bold;
  font-size: 18px;
  margin-right: ${SPACING.sm};
`
