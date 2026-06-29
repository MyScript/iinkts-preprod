/**
 * Predefined editor themes — passed to `editor.setCssVars()`.
 * `vars: undefined` resets to the stylesheet defaults.
 * @group Editor
 */
export type TEditorTheme =
{
  id: string
  label: string
  /** Representative accent color shown as a swatch in the picker */
  swatch: string
  /** Primary color used for labels and highlights */
  color: string
  vars: Record<string, string> | undefined
}

/** @group hidden */
const EDITOR_THEMES: TEditorTheme[] = [
  {
    id: "default",
    label: "Default",
    swatch: "#ffffff",
    color: "#000000",
    vars: undefined,
  },
  {
    id: "dark",
    label: "Dark",
    swatch: "#1a1a1a",
    color: "#e2e2e2",
    vars: {
      "--iink-primary":        "#60a5fa",
      "--iink-color":          "#e2e2e2",
      "--iink-editor-bg":      "#1a1a1a",
      "--iink-surface":        "#242424",
      "--iink-guide-color":    "#333333",
      "--iink-text-muted":     "#888888",
      "--iink-menu-bg":        "#141414",
      "--iink-menu-title-bg":  "#2c2c2c",
      "--iink-menu-hover":     "rgba(96, 165, 250, 0.12)",
      "--iink-input-bg":       "#1a1a1a",
      "--iink-input-color":    "#e2e2e2",
      "--iink-input-border":   "#333333",
      "--iink-section-bg":     "#1a1a1a",
      "--iink-border-color":   "#333333",
      "--iink-secondary":      "#6c6c6c",
      "--iink-tertiary":       "#242424",
      "--iink-success":        "#a6e3a1",
      "--iink-warning":        "#f9e2af",
      "--iink-error":          "#f38ba8",
      "--iink-info":           "#89dceb",
    },
  },
  {
    id: "sepia",
    label: "Sepia",
    swatch: "#f4ede0",
    color: "#3d2b1f",
    vars: {
      "--iink-primary":        "#8B5E3C",
      "--iink-color":          "#3d2b1f",
      "--iink-editor-bg":      "#f4ede0",
      "--iink-surface":        "#ede0d0",
      "--iink-guide-color":    "#d4c4b0",
      "--iink-text-muted":     "#8c7b6b",
      "--iink-menu-bg":        "#fffcf5",
      "--iink-menu-title-bg":  "#e8d5bc",
      "--iink-menu-hover":     "rgba(139, 94, 60, 0.10)",
      "--iink-input-bg":       "#fffdf8",
      "--iink-input-color":    "#3d2b1f",
      "--iink-input-border":   "#c9b49a",
      "--iink-section-bg":     "#f0e8d8",
      "--iink-border-color":   "#d8c8b0",
      "--iink-secondary":      "#a08060",
      "--iink-tertiary":       "#e8d5bc",
      "--iink-success":        "#4a7c59",
      "--iink-warning":        "#c07820",
      "--iink-error":          "#b03a2e",
      "--iink-info":           "#2e6da4",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    swatch: "#0a1628",
    color: "#a8d8ea",
    vars: {
      "--iink-primary":        "#00c9c8",
      "--iink-color":          "#a8d8ea",
      "--iink-editor-bg":      "#0a1628",
      "--iink-surface":        "#0f2040",
      "--iink-guide-color":    "#1a3060",
      "--iink-text-muted":     "#4a7a9b",
      "--iink-menu-bg":        "#071220",
      "--iink-menu-title-bg":  "#0a2a4a",
      "--iink-menu-hover":     "rgba(0, 201, 200, 0.12)",
      "--iink-input-bg":       "#0a1628",
      "--iink-input-color":    "#a8d8ea",
      "--iink-input-border":   "#1a3060",
      "--iink-section-bg":     "#081018",
      "--iink-border-color":   "#1a3060",
      "--iink-secondary":      "#2a5a7a",
      "--iink-tertiary":       "#0f2040",
      "--iink-success":        "#00e5a0",
      "--iink-warning":        "#ffd060",
      "--iink-error":          "#ff6b8a",
      "--iink-info":           "#00b8d9",
    },
  },
  {
    id: "forest",
    label: "Forest",
    swatch: "#f5f9f4",
    color: "#1a3320",
    vars: {
      "--iink-primary":        "#4caf6e",
      "--iink-color":          "#1a3320",
      "--iink-editor-bg":      "#f5f9f4",
      "--iink-surface":        "#e8f2e6",
      "--iink-guide-color":    "#c8dfc4",
      "--iink-text-muted":     "#6a8c66",
      "--iink-menu-bg":        "#ffffff",
      "--iink-menu-title-bg":  "#c8e6c9",
      "--iink-menu-hover":     "rgba(76, 175, 110, 0.10)",
      "--iink-input-bg":       "#ffffff",
      "--iink-input-color":    "#1a3320",
      "--iink-input-border":   "#a5c8a0",
      "--iink-section-bg":     "#edf5eb",
      "--iink-border-color":   "#c5dfc0",
      "--iink-secondary":      "#7aaa76",
      "--iink-tertiary":       "#d8eed5",
      "--iink-success":        "#2e7d32",
      "--iink-warning":        "#f57f17",
      "--iink-error":          "#b71c1c",
      "--iink-info":           "#01579b",
    },
  },
]

/** @group Editor */
export const THEME_STORAGE_KEY = "iink-editor-theme"

/** @group Editor */
export class EditorThemes
{
  static EDITOR_THEMES = EDITOR_THEMES
  static THEME_STORAGE_KEY = THEME_STORAGE_KEY
  static getSavedThemeId(): string
  {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) ?? "default"
    } catch {
      return "default"
    }
  }
  static saveThemeId(id: string): void
  {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id)
    } catch {
      // ignore (private browsing)
    }
  }
  static getThemeById(id: string): TEditorTheme
  {
    return EDITOR_THEMES.find(t => t.id === id) ?? EDITOR_THEMES[0]
  }
}
