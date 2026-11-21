// Characters Windows, macOS or Linux refuse in a file name, control characters included
// eslint-disable-next-line no-control-regex
const FORBIDDEN_CHARACTERS = /[\\/:*?"<>|\u0000-\u001f]/g
const MAX_LENGTH = 60

/**
 * @group Core/Std
 * @summary A file name made of the first words of a text, without extension
 * @returns undefined when the text has no word a file name can hold
 */
export const fileNameFromText = (text: string, wordCount: number): string | undefined => {
  const words = text.replace(FORBIDDEN_CHARACTERS, " ").split(/\s+/).filter(Boolean).slice(0, wordCount)
  // A leading dot hides the file on Linux and macOS, a trailing one is dropped by Windows
  const name = words
    .join(" ")
    .slice(0, MAX_LENGTH)
    .replace(/^[.\s]+|[.\s]+$/g, "")
  return name || undefined
}

/**
 * @group Core/Std
 * @summary The default file name, after the date to the second: `iink-ts-2026-11-21T10-30-15`
 * @remarks An ISO instant, so it reads the same in every locale, without the `:` file names refuse
 */
export const datedFileName = (date: Date = new Date()): string =>
  `iink-ts-${date
    .toISOString()
    .replace(/\.\d+Z$/, "")
    .replace(/:/g, "-")}`
