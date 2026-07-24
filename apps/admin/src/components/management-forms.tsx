"use client";

import { useState, type FormEvent } from "react";
import { Button, Checkbox, Input, Label } from "@ctps/ui/primitives";
import { useRouter } from "next/navigation";

interface Choice {
  readonly id: string;
  readonly key: string;
  readonly displayName?: string;
  readonly label?: string;
}

async function mutation(path: string, method: "POST" | "PATCH" | "PUT", body: unknown) {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as Record<string, unknown>;
  if (!response.ok)
    throw new Error(
      typeof result.message === "string" ? result.message : "The change could not be saved.",
    );
  return result;
}

function Feedback({ message, error }: { readonly message: string; readonly error: boolean }) {
  return message ? (
    <p
      aria-live="polite"
      className={error ? "text-sm text-destructive" : "text-sm text-success"}
      role={error ? "alert" : "status"}
    >
      {message}
    </p>
  ) : null;
}

export function CreateUserForm({ roles }: { readonly roles: readonly Choice[] }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const [temporary, setTemporary] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    setTemporary("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await mutation("users", "POST", {
        displayName: form.get("displayName"),
        email: form.get("email"),
        roleIds: form.getAll("roleIds"),
      });
      setTemporary(String(result.temporaryPassword ?? ""));
      setFeedback("User created. Copy the temporary password now; it will not be shown again.");
      setFailed(false);
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setFailed(true);
      setFeedback(error instanceof Error ? error.message : "User creation failed.");
    }
  }
  return (
    <form className="grid gap-3 rounded-md border p-4" onSubmit={submit}>
      <h3 className="font-semibold">Create staff user</h3>
      <Label htmlFor="create-display">Display name</Label>
      <Input id="create-display" name="displayName" required />
      <Label htmlFor="create-email">Email</Label>
      <Input autoComplete="off" id="create-email" name="email" required type="email" />
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Roles</legend>
        {roles.map((role) => (
          <Label className="flex gap-2" key={role.id}>
            <Checkbox name="roleIds" type="checkbox" value={role.id} />
            {role.displayName} <code>{role.key}</code>
          </Label>
        ))}
      </fieldset>
      <Button type="submit">Create user</Button>
      <Feedback error={failed} message={feedback} />
      {temporary ? (
        <div className="rounded-md border border-warning bg-warning/10 p-3">
          <strong>One-time temporary password</strong>
          <p className="mt-1 break-all font-mono">{temporary}</p>
          <Button
            className="mt-2"
            onClick={() => navigator.clipboard.writeText(temporary)}
            type="button"
            variant="outline"
          >
            Copy password
          </Button>
          <p className="mt-2 text-xs">
            Share through an approved secure channel. It is not stored separately or written to
            audit logs.
          </p>
        </div>
      ) : null}
    </form>
  );
}

export function UserControls({
  canAssignRoles,
  canDisable,
  canUpdate,
  user,
  roles,
}: {
  readonly canAssignRoles: boolean;
  readonly canDisable: boolean;
  readonly canUpdate: boolean;
  readonly user: {
    id: string;
    displayName: string;
    email: string;
    status: string;
    roleIds: readonly string[];
  };
  readonly roles: readonly Choice[];
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const [temporary, setTemporary] = useState("");
  async function run(
    path: string,
    method: "POST" | "PATCH" | "PUT",
    body: unknown,
    confirmation?: string,
  ) {
    if (confirmation && !window.confirm(confirmation)) return;
    try {
      const result = await mutation(path, method, body);
      setTemporary(String(result.temporaryPassword ?? ""));
      setFeedback("Change saved.");
      setFailed(false);
      router.refresh();
    } catch (error) {
      setFailed(true);
      setFeedback(error instanceof Error ? error.message : "Change failed.");
    }
  }
  return (
    <div className="grid gap-5">
      {canUpdate ? (
        <form
          className="grid gap-3 rounded-md border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(`users/${user.id}`, "PATCH", {
              displayName: data.get("displayName"),
              email: data.get("email"),
            });
          }}
        >
          <h3 className="font-semibold">Profile</h3>
          <Label htmlFor="edit-name">Display name</Label>
          <Input defaultValue={user.displayName} id="edit-name" name="displayName" required />
          <Label htmlFor="edit-email">Email</Label>
          <Input defaultValue={user.email} id="edit-email" name="email" required type="email" />
          <Button type="submit">Save profile</Button>
        </form>
      ) : null}
      {canAssignRoles ? (
        <form
          className="grid gap-2 rounded-md border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void run(`users/${user.id}/roles`, "PUT", {
              roleIds: new FormData(event.currentTarget).getAll("roleIds"),
            });
          }}
        >
          <fieldset className="grid gap-2">
            <legend className="font-semibold">Assigned roles</legend>
            {roles.map((role) => (
              <Label className="flex gap-2" key={role.id}>
                <Checkbox
                  defaultChecked={user.roleIds.includes(role.id)}
                  name="roleIds"
                  type="checkbox"
                  value={role.id}
                />
                {role.displayName} <code>{role.key}</code>
              </Label>
            ))}
          </fieldset>
          <Button type="submit">Save roles</Button>
        </form>
      ) : null}
      <div className="flex flex-wrap gap-3">
        {canDisable ? (
          <Button
            onClick={() =>
              void run(
                `users/${user.id}/${user.status === "ACTIVE" ? "disable" : "reactivate"}`,
                "POST",
                {},
                `${user.status === "ACTIVE" ? "Disable" : "Reactivate"} this account?`,
              )
            }
            variant={user.status === "ACTIVE" ? "destructive" : "outline"}
          >
            {user.status === "ACTIVE" ? "Disable account" : "Reactivate account"}
          </Button>
        ) : null}
        {canUpdate ? (
          <Button
            onClick={() =>
              void run(
                `users/${user.id}/reset-password`,
                "POST",
                {},
                "Reset this password and revoke every active session?",
              )
            }
            variant="outline"
          >
            Reset password
          </Button>
        ) : null}
      </div>
      <Feedback error={failed} message={feedback} />
      {temporary ? (
        <div className="rounded-md border border-warning p-3">
          <strong>One-time temporary password</strong>
          <p className="font-mono break-all">{temporary}</p>
          <Button
            className="mt-2"
            onClick={() => navigator.clipboard.writeText(temporary)}
            type="button"
            variant="outline"
          >
            Copy password
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function CreateRoleForm() {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  return (
    <form
      className="grid gap-3 rounded-md border p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        try {
          await mutation("roles", "POST", {
            key: data.get("key"),
            displayName: data.get("displayName"),
            description: data.get("description"),
          });
          setFeedback("Role created.");
          event.currentTarget.reset();
          router.refresh();
        } catch (error) {
          setFeedback(error instanceof Error ? error.message : "Role creation failed.");
        }
      }}
    >
      <h3 className="font-semibold">Create custom role</h3>
      <Label htmlFor="role-key">Machine key</Label>
      <Input id="role-key" name="key" pattern="[A-Z][A-Z0-9_]{2,63}" required />
      <Label htmlFor="role-name">Display name</Label>
      <Input id="role-name" name="displayName" required />
      <Label htmlFor="role-description">Description</Label>
      <Input id="role-description" name="description" required />
      <Button type="submit">Create role</Button>
      <Feedback error={false} message={feedback} />
    </form>
  );
}

export function RoleControls({
  canAssignPermissions,
  canUpdate,
  role,
  permissions,
}: {
  readonly canAssignPermissions: boolean;
  readonly canUpdate: boolean;
  readonly role: {
    id: string;
    isSystem: boolean;
    key: string;
    displayName: string;
    description: string;
    permissionKeys: readonly string[];
  };
  readonly permissions: readonly (Choice & { group: string; description: string })[];
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  async function run(path: string, method: "PATCH" | "PUT", body: unknown) {
    try {
      await mutation(path, method, body);
      setFeedback("Role saved.");
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Role update failed.");
    }
  }
  return (
    <div className="grid gap-5">
      {canUpdate && !role.isSystem ? (
        <form
          className="grid gap-3 rounded-md border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(`roles/${role.id}`, "PATCH", {
              displayName: data.get("displayName"),
              description: data.get("description"),
            });
          }}
        >
          <Label htmlFor="role-display">Display name</Label>
          <Input defaultValue={role.displayName} id="role-display" name="displayName" />
          <Label htmlFor="role-desc">Description</Label>
          <Input defaultValue={role.description} id="role-desc" name="description" />
          <Button type="submit">Save role details</Button>
        </form>
      ) : role.isSystem ? (
        <p className="rounded-md border p-3 text-sm">
          This system role’s identity and description are protected.
        </p>
      ) : null}
      {canAssignPermissions ? (
        <form
          className="grid gap-3 rounded-md border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void run(`roles/${role.id}/permissions`, "PUT", {
              permissionKeys: new FormData(event.currentTarget).getAll("permissionKeys"),
            });
          }}
        >
          <fieldset className="grid gap-3" disabled={role.key === "SUPER_ADMIN"}>
            <legend className="font-semibold">Permissions control server capabilities</legend>
            {permissions.map((permission) => (
              <Label className="grid grid-cols-[auto_1fr] gap-x-2" key={permission.key}>
                <Checkbox
                  defaultChecked={role.permissionKeys.includes(permission.key)}
                  name="permissionKeys"
                  type="checkbox"
                  value={permission.key}
                />
                <span>
                  {permission.label} <code className="text-xs">{permission.key}</code>
                  <small className="block text-muted-foreground">
                    {permission.group}: {permission.description}
                  </small>
                </span>
              </Label>
            ))}
          </fieldset>
          {role.key !== "SUPER_ADMIN" ? (
            <Button type="submit">Save permissions</Button>
          ) : (
            <p className="text-sm">Super Admin always receives every permission.</p>
          )}
        </form>
      ) : null}
      <Feedback error={false} message={feedback} />
    </div>
  );
}
