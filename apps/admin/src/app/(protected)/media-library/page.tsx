import { redirect } from "next/navigation";
import { MediaLibraryManager } from "@/components/media-library-manager";
import { adminApi, currentIdentity } from "@/lib/admin-api";
import type { PublicMediaPage } from "@/lib/marketing-types";

export default async function MediaLibraryPage() {
  const identity = await currentIdentity();
  if (!identity) redirect("/login");
  if (!identity.permissions.includes("mediaLibrary.read"))
    return <p>You do not have access to the public media library.</p>;
  const initialPage = await adminApi<PublicMediaPage>("admin/media-library?page=1&pageSize=24");
  return (
    <MediaLibraryManager
      canUpdate={identity.permissions.includes("mediaLibrary.update")}
      canUpload={identity.permissions.includes("mediaLibrary.upload")}
      canArchive={identity.permissions.includes("mediaLibrary.archive")}
      canRestore={identity.permissions.includes("mediaLibrary.restore")}
      canDelete={identity.permissions.includes("mediaLibrary.delete")}
      initialPage={initialPage}
    />
  );
}
