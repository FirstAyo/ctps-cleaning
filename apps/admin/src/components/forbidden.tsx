import { Alert } from "@ctps/ui/content";
export function Forbidden() {
  return (
    <Alert title="Permission required" tone="warning">
      Your account is authenticated, but it does not have permission to view this area.
    </Alert>
  );
}
