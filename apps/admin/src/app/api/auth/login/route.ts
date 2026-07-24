import { forwardAuthRequest } from "@/lib/route-handler";
export async function POST(request: Request) {
  return forwardAuthRequest(request, "auth/login");
}
