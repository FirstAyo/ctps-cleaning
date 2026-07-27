import { apiEnvironmentSchema } from "@ctps/validation";

const result = apiEnvironmentSchema.safeParse(process.env);
if (!result.success) {
  for (const issue of result.error.issues)
    process.stderr.write(`${issue.path.join(".") || "environment"}: ${issue.message}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    JSON.stringify({
      valid: true,
      environment: result.data.NODE_ENV,
      release: result.data.RELEASE_VERSION,
      emailMode: result.data.EMAIL_DELIVERY_MODE,
      trustedProxyHops: result.data.TRUST_PROXY_HOPS,
    }) + "\n",
  );
}
