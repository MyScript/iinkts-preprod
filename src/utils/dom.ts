/**
 * Sanitize a JIIX ID to make it a valid DOM ID
 * Replaces special characters that can cause issues in CSS selectors
 * @param jiixId - The JIIX ID (e.g., "raw-content/1210")
 * @returns A sanitized ID safe for use as DOM ID (e.g., "raw-content-1210")
 */
export function sanitizeId(jiixId: string): string {
  return jiixId.replace(/\//g, '-')
}
