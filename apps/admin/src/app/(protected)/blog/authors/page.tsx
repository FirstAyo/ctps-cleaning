import { BlogAuthorManager, type BlogAuthor } from "@/components/blog-author-manager";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
export default async function Page() {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "authorProfiles.read")) return <Forbidden />;
  const authors = await adminApi<BlogAuthor[]>("admin/blog/authors");
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Blog authors</h2>
        <p className="text-sm text-muted-foreground">
          Public profiles are required before an author’s article can be published.
        </p>
      </div>
      <BlogAuthorManager
        authors={authors}
        canUpdateAll={can(identity, "authorProfiles.updateAll")}
        canUpdateOwn={can(identity, "authorProfiles.updateOwn")}
        canUpload={can(identity, "blogMedia.uploadOwn")}
        currentUserId={identity.id}
      />
    </div>
  );
}
