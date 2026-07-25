import { NextResponse } from "next/server";
import { forwardProtectedMutation } from "@/lib/route-handler";

const allowed =
  /^(users(?:\/[0-9a-f-]+(?:\/(?:roles|disable|reactivate|reset-password))?)?|roles(?:\/[0-9a-f-]+(?:\/permissions)?)?|before-after-projects(?:\/[0-9a-f-]+(?:\/(?:media-order|publish|unpublish|archive))?)?|media\/before-after\/[0-9a-f-]+|quote-requests\/[0-9a-f-]+(?:\/(?:status|assignment|notes|archive))?|pricing\/versions(?:\/[0-9a-f-]+(?:\/(?:publish|archive|preview|services\/[a-z-]+(?:\/rules)?|rules\/[0-9a-f-]+))?)?|estimator-results\/[0-9a-f-]+\/archive|blog\/(?:posts(?:\/[0-9a-f-]+(?:\/(?:publish|unpublish|schedule|submit-review|archive))?)?|media\/[0-9a-f-]+|categories(?:\/[0-9a-f-]+)?|tags(?:\/[0-9a-f-]+)?|authors\/[0-9a-f-]+))$/i;

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const path = (await context.params).path.join("/");
  if (!allowed.test(path))
    return NextResponse.json({ code: "NOT_FOUND", message: "Not found." }, { status: 404 });
  return forwardProtectedMutation(request, `admin/${path}`);
}
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
