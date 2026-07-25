import { BeforeAfterEditor } from "@/components/before-after-editor";
import { Forbidden } from "@/components/forbidden";
import { can, currentIdentity } from "@/lib/admin-api";
export default async function Page() {
  const identity = await currentIdentity();
  if (!identity || !can(identity, "projects.beforeAfter.create")) return <Forbidden />;
  return (
    <BeforeAfterEditor
      canArchive={false}
      canDelete={false}
      canPublish={false}
      canUpload={can(identity, "media.beforeAfter.upload")}
      canUpdateMedia={can(identity, "media.beforeAfter.update")}
      canDeleteMedia={can(identity, "media.beforeAfter.delete")}
    />
  );
}
