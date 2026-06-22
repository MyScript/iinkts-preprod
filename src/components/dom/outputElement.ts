
/** @group DOM */
export interface OutputElConfig {
  id?: string
  htmlFor?: string
  text?: string
}

/** @group DOM */
export function buildOutput(config?: OutputElConfig): HTMLOutputElement {
  const el = document.createElement("output")
  if (config?.id) el.id = config.id
  if (config?.htmlFor) el.setAttribute("for", config.htmlFor)
  if (config?.text) el.innerHTML = config.text
  return el
}
