import { NextResponse } from "next/server";
import { forwardProtectedMutation } from "@/lib/route-handler";

const legacyAllowed =
  /^(users(?:\/[0-9a-f-]+(?:\/(?:roles|disable|reactivate|reset-password))?)?|roles(?:\/[0-9a-f-]+(?:\/permissions)?)?|before-after-projects(?:\/[0-9a-f-]+(?:\/(?:media-order|publish|unpublish|archive))?)?|media\/before-after\/[0-9a-f-]+|quote-requests\/[0-9a-f-]+(?:\/(?:status|assignment|notes|archive))?|pricing\/versions(?:\/[0-9a-f-]+(?:\/(?:publish|archive|preview|services\/[a-z-]+(?:\/rules)?|rules\/[0-9a-f-]+))?)?|estimator-results\/[0-9a-f-]+\/archive|blog\/(?:posts(?:\/[0-9a-f-]+(?:\/(?:publish|unpublish|schedule|submit-review|archive))?)?|media\/[0-9a-f-]+|categories(?:\/[0-9a-f-]+)?|tags(?:\/[0-9a-f-]+)?|authors\/[0-9a-f-]+)|jobs(?:\/from-quote\/[0-9a-f-]+|\/[0-9a-f-]+(?:\/(?:schedule|status|complete|cancel|assignments(?:\/[0-9a-f-]+)?|checklist(?:\/[0-9a-f-]+)?|notes(?:\/[0-9a-f-]+)?|incidents(?:\/[0-9a-f-]+)?|notifications|media\/[0-9a-f-]+))?)?)$/i;
const marketingAllowed =
  /^(?:pages\/[A-Z_]+(?:\/(?:publish|revisions\/[0-9a-f-]+\/restore))?|navigation|site-settings|media-library\/[0-9a-f-]+(?:\/(?:archive|restore))?)$/i;

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const path = (await context.params).path.join("/");
  if (!legacyAllowed.test(path) && !marketingAllowed.test(path))
    return NextResponse.json({ code: "NOT_FOUND", message: "Not found." }, { status: 404 });
  return forwardProtectedMutation(request, `admin/${path}`);
}
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
