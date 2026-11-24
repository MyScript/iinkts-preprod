import { getMathDiagnosticMessage, Translator } from "@/iink"

describe("MathDiagnosticMessages.ts", () => {
  test("should give the English title, message and severity of a code by default", () => {
    expect(getMathDiagnosticMessage("DIVISION_BY_ZERO")).toEqual({
      title: "Division by Zero",
      message: expect.stringContaining("division by zero"),
      severity: "error",
    })
  })

  test("should translate the title and the message", () => {
    const message = getMathDiagnosticMessage("ALLOWED", new Translator(undefined, "fr_FR"))
    expect(message.title).toEqual("Tâche autorisée")
    expect(message.severity).toEqual("success")
  })

  test("should name an unknown code in its message", () => {
    expect(getMathDiagnosticMessage("NEW_CODE")).toEqual({
      title: "Unknown Diagnostic",
      message: "Unknown diagnostic code: NEW_CODE",
      severity: "info",
    })
  })
})
