"use client";

import { useState, type FormEvent } from "react";
import { Button, Input, Label } from "@ctps/ui/primitives";
import { ThemeToggle } from "@ctps/ui/theme";
import { useRouter } from "next/navigation";

function safeNext(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export function LoginForm({ next }: { readonly next: string | null }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const body = (await response.json()) as {
        user?: { mustChangePassword: boolean };
        message?: string;
      };
      if (!response.ok)
        throw new Error(
          response.status === 429
            ? "Too many attempts. Please wait and try again."
            : (body.message ?? "Unable to sign in."),
        );
      router.replace(body.user?.mustChangePassword ? "/change-password" : safeNext(next));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input autoComplete="username" id="email" name="email" required type="email" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          autoComplete="current-password"
          id="password"
          name="password"
          required
          type={visible ? "text" : "password"}
        />
        <button
          className="justify-self-start text-sm underline"
          onClick={() => setVisible((value) => !value)}
          type="button"
        >
          {visible ? "Hide" : "Show"} password
        </button>
      </div>
      {error ? (
        <p aria-live="polite" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          newPassword: form.get("newPassword"),
          confirmPassword: form.get("confirmPassword"),
        }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(body.message ?? "Password change failed.");
      router.replace("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Password change failed.");
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          autoComplete="current-password"
          id="currentPassword"
          name="currentPassword"
          required
          type={visible ? "text" : "password"}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          autoComplete="new-password"
          id="newPassword"
          minLength={12}
          name="newPassword"
          required
          type={visible ? "text" : "password"}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          autoComplete="new-password"
          id="confirmPassword"
          minLength={12}
          name="confirmPassword"
          required
          type={visible ? "text" : "password"}
        />
      </div>
      <button
        className="justify-self-start text-sm underline"
        onClick={() => setVisible((value) => !value)}
        type="button"
      >
        {visible ? "Hide" : "Show"} passwords
      </button>
      {error ? (
        <p aria-live="polite" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button disabled={pending} type="submit">
        {pending ? "Updating…" : "Change password"}
      </Button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        });
        router.replace("/login");
        router.refresh();
      }}
      variant="outline"
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
export function LoginThemeToggle() {
  return <ThemeToggle />;
}
