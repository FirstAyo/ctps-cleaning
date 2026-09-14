export function emailFromAddress(displayName: string | undefined, address: string) {
  const escapedName = (displayName?.trim() || "CTPS")
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"');
  return `"${escapedName}" <${address}>`;
}
