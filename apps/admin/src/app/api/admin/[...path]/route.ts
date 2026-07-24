import { NextResponse } from "next/server";
import { forwardProtectedMutation } from "@/lib/route-handler";

const allowed =
  /^(users(?:\/[0-9a-f-]+(?:\/(?:roles|disable|reactivate|reset-password))?)?|roles(?:\/[0-9a-f-]+(?:\/permissions)?)?)$/i;

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const path = (await context.params).path.join("/");
  if (!allowed.test(path))
    return NextResponse.json({ code: "NOT_FOUND", message: "Not found." }, { status: 404 });
  return forwardProtectedMutation(request, `admin/${path}`);
}
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
