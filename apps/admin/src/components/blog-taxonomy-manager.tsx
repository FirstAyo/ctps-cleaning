"use client";

import { useState } from "react";
import { Button, Input, Label, Textarea } from "@ctps/ui/primitives";

import type { BlogTaxonomy } from "@/lib/blog-types";

export function BlogTaxonomyManager({
  kind,
  initialItems,
}: {
  readonly kind: "categories" | "tags";
  readonly initialItems: readonly BlogTaxonomy[];
}) {
  const [items, setItems] = useState([...initialItems]);
  const [message, setMessage] = useState("");
  async function save(event: React.FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name")),
      slug: String(form.get("slug")),
      ...(kind === "categories" ? { description: String(form.get("description") ?? "") } : {}),
    };
    const response = await fetch(`/api/admin/blog/${kind}${id ? `/${id}` : ""}`, {
      method: id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => ({}))) as BlogTaxonomy & { message?: string };
    if (!response.ok) return setMessage(result.message ?? "The taxonomy item could not be saved.");
    setItems((current) =>
      id
        ? current.map((item) => (item.id === id ? { ...item, ...result } : item))
        : [...current, result].sort((a, b) => a.name.localeCompare(b.name)),
    );
    if (!id) event.currentTarget.reset();
    setMessage(`${kind === "categories" ? "Category" : "Tag"} saved.`);
  }
  async function remove(id: string) {
    if (!confirm("Delete this item? Referenced items cannot be deleted.")) return;
    const response = await fetch(`/api/admin/blog/${kind}/${id}`, { method: "DELETE" });
    const result = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) return setMessage(result.message ?? "The item could not be deleted.");
    setItems((current) => current.filter((item) => item.id !== id));
    setMessage("Item deleted.");
  }
  return (
    <div className="grid gap-6">
      <form
        className="grid gap-3 rounded-lg border bg-card p-5 md:grid-cols-2"
        onSubmit={(event) => void save(event)}
      >
        <h3 className="md:col-span-2 text-lg font-semibold">
          Add {kind === "categories" ? "category" : "tag"}
        </h3>
        <div>
          <Label htmlFor="new-name">Name</Label>
          <Input id="new-name" name="name" required />
        </div>
        <div>
          <Label htmlFor="new-slug">Slug</Label>
          <Input id="new-slug" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
        </div>
        {kind === "categories" ? (
          <div className="md:col-span-2">
            <Label htmlFor="new-description">Description</Label>
            <Textarea id="new-description" name="description" />
          </div>
        ) : null}
        <Button type="submit">Add</Button>
      </form>
      <div className="grid gap-4">
        {items.map((item) => (
          <form
            className="grid gap-3 rounded-lg border p-4 md:grid-cols-2"
            key={item.id}
            onSubmit={(event) => void save(event, item.id)}
          >
            <div>
              <Label>Name</Label>
              <Input defaultValue={item.name} name="name" required />
            </div>
            <div>
              <Label>Slug</Label>
              <Input defaultValue={item.slug} name="slug" required />
            </div>
            {kind === "categories" ? (
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea defaultValue={item.description} name="description" />
              </div>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {item._count?.posts ?? 0} published posts
            </p>
            <div className="flex gap-2">
              <Button type="submit">Save</Button>
              <Button onClick={() => void remove(item.id)} type="button" variant="destructive">
                Delete
              </Button>
            </div>
          </form>
        ))}
      </div>
      <p aria-live="polite">{message}</p>
    </div>
  );
}
