import { Translator } from "@/i18n"

/**
 * @group Constants
 * @summary Severity of a math diagnostic, as its message shows it
 */
export type TMathDiagnosticSeverity = "success" | "warning" | "error" | "info"

/**
 * @group Constants
 * @remarks Severity per MathDiagnostic code; title and message are translated under
 * `math.diagnostic.<code>.title` and `math.diagnostic.<code>.message`
 */
export const MathDiagnosticMessages: Record<string, TMathDiagnosticSeverity> = {
  ALLOWED: "success",
  ALLOWED_BUT_PREVIOUSLY_DISCARDED: "warning",
  UNSUPPORTED: "error",
  NON_EVALUABLE: "error",
  INCOMPLETE_EXPRESSION: "warning",
  NO_VARIABLE: "info",
  TOO_MANY_VARIABLES: "warning",
  NOT_APPLICABLE: "info",
  DIVISION_BY_ZERO: "error",
  NUMBER_OVERFLOW: "error",
  NUMBER_UNDERFLOW: "error",
  INVALID_OPERATION: "error",
}

/**
 * @group Constants
 * @summary Get diagnostic message for a given diagnostic code
 * @param diagnostic - The diagnostic code (e.g., "ALLOWED", "DIVISION_BY_ZERO")
 * @param i18n - Translates the title and the message; English when absent
 * @returns Message object with title, message, and severity
 */
export function getMathDiagnosticMessage(
  diagnostic: string,
  i18n: Translator = new Translator()
): {
  title: string
  message: string
  severity: TMathDiagnosticSeverity
} {
  const severity = MathDiagnosticMessages[diagnostic]
  if (!severity) {
    return {
      title: i18n.t("math.diagnostic.unknown.title"),
      message: i18n.t("math.diagnostic.unknown.message", { code: diagnostic }),
      severity: "info",
    }
  }
  return {
    title: i18n.t(`math.diagnostic.${diagnostic}.title`),
    message: i18n.t(`math.diagnostic.${diagnostic}.message`),
    severity,
  }
}
