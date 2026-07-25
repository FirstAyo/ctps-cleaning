"use client";

/* eslint-disable @next/next/no-img-element -- authenticated managed profile thumbnail */

import { useState } from "react";
import { Button, Input, Label, Textarea } from "@ctps/ui/primitives";

export interface BlogAuthor {
  id: string;
  displayName: string;
  authorProfile: {
    slug: string;
    displayName: string;
    bio: string;
    profileMediaId: string | null;
  } | null;
  _count: { blogPosts: number };
}

export function BlogAuthorManager({
  authors,
  currentUserId,
  canUpdateAll,
  canUpdateOwn,
  canUpload,
}: {
  readonly authors: readonly BlogAuthor[];
  readonly currentUserId: string;
  readonly canUpdateAll: boolean;
  readonly canUpdateOwn: boolean;
  readonly canUpload: boolean;
}) {
  const [message, setMessage] = useState("");
  const [profileMediaIds, setProfileMediaIds] = useState<Record<string, string | null>>(
    Object.fromEntries(
      authors.map((author) => [author.id, author.authorProfile?.profileMediaId ?? null]),
    ),
  );
  async function uploadProfile(userId: string, file?: File) {
    if (!file) return;
    const data = new FormData();
    data.append("files", file);
    const response = await fetch("/api/blog-media", { method: "POST", body: data });
    const result = (await response.json().catch(() => ({}))) as {
      items?: { id: string }[];
      message?: string;
    };
    const mediaId = result.items?.[0]?.id;
    if (!response.ok || !mediaId) {
      setMessage(result.message ?? "The profile image could not be uploaded.");
      return;
    }
    await fetch(`/api/admin/blog/media/${mediaId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ altText: "Author profile portrait", caption: null }),
    });
    setProfileMediaIds((current) => ({ ...current, [userId]: mediaId }));
    setMessage("Profile image uploaded privately. Save the profile to apply it.");
  }
  async function save(event: React.FormEvent<HTMLFormElement>, userId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/blog/authors/${userId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slug: String(form.get("slug")),
        displayName: String(form.get("displayName")),
        bio: String(form.get("bio")),
        profileMediaId: profileMediaIds[userId] ?? null,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    setMessage(
      response.ok ? "Author profile saved." : (result.message ?? "The profile could not be saved."),
    );
  }
  return (
    <div className="grid gap-5">
      {authors.map((author) => {
        const editable = canUpdateAll || (canUpdateOwn && author.id === currentUserId);
        return (
          <form
            className="grid gap-3 rounded-lg border bg-card p-5"
            key={author.id}
            onSubmit={(event) => void save(event, author.id)}
          >
            <h3 className="text-lg font-semibold">{author.displayName}</h3>
            <p className="text-sm text-muted-foreground">
              {author._count.blogPosts} published posts
            </p>
            <div>
              <Label>Public display name</Label>
              <Input
                defaultValue={author.authorProfile?.displayName ?? author.displayName}
                disabled={!editable}
                name="displayName"
                required
              />
            </div>
            <div>
              <Label>Public author slug</Label>
              <Input
                defaultValue={author.authorProfile?.slug ?? ""}
                disabled={!editable}
                name="slug"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
              />
            </div>
            <div>
              <Label>Biography</Label>
              <Textarea
                defaultValue={author.authorProfile?.bio ?? ""}
                disabled={!editable}
                name="bio"
                required
              />
            </div>
            {profileMediaIds[author.id] ? (
              <img
                alt="Current managed author profile"
                className="h-24 w-24 rounded-full object-cover"
                src={`/api/blog-media/${profileMediaIds[author.id]}/thumbnail`}
              />
            ) : null}
            {editable && canUpload ? (
              <div>
                <Label htmlFor={`profile-${author.id}`}>Managed profile image</Label>
                <Input
                  accept="image/jpeg,image/png,image/webp"
                  id={`profile-${author.id}`}
                  onChange={(event) =>
                    void uploadProfile(author.id, event.currentTarget.files?.[0])
                  }
                  type="file"
                />
              </div>
            ) : null}
            {editable ? <Button type="submit">Save profile</Button> : null}
          </form>
        );
      })}
      <p aria-live="polite">{message}</p>
    </div>
  );
}
