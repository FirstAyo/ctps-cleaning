import { BeforeAfterEditor } from "@/components/before-after-editor";
import { Forbidden } from "@/components/forbidden";
import { adminApi, can, currentIdentity } from "@/lib/admin-api";
import type { AdminProject } from "@/lib/before-after-types";
export default async function Page({ params }: { readonly params: Promise<{ id: string }> }) {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "projects.beforeAfter.read")) return <Forbidden />;
  const project = await adminApi<AdminProject>(`admin/before-after-projects/${(await params).id}`);
  if (!can(identity, "projects.beforeAfter.update"))
    return (
      <div className="rounded-lg border p-6">
        <h2 className="text-2xl font-semibold">{project.title}</h2>
        <p className="mt-2">{project.status} · Read-only access</p>
      </div>
    );
  return (
    <BeforeAfterEditor
      canArchive={can(identity, "projects.beforeAfter.archive")}
      canDelete={can(identity, "projects.beforeAfter.delete")}
      canPublish={can(identity, "projects.beforeAfter.publish")}
      canUpload={can(identity, "media.beforeAfter.upload")}
      canUpdateMedia={can(identity, "media.beforeAfter.update")}
      canDeleteMedia={can(identity, "media.beforeAfter.delete")}
      project={project}
    />
  );
}
