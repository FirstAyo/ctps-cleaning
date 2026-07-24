import { forwardProtectedMutation } from "@/lib/route-handler";
export async function POST(request: Request) {
  return forwardProtectedMutation(request, "auth/change-password");
}
