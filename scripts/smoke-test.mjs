import process from "node:process";

const bases = {
  web: process.env.SMOKE_WEB_URL ?? "http://127.0.0.1:3000",
  admin: process.env.SMOKE_ADMIN_URL ?? "http://127.0.0.1:3001",
  api: process.env.SMOKE_API_URL ?? "http://127.0.0.1:4000",
};
const checks = [
  ["Public homepage", `${bases.web}/`],
  ["Services", `${bases.web}/services`],
  ["Blog", `${bases.web}/blog`],
  ["Before and after", `${bases.web}/before-after`],
  ["Quote request", `${bases.web}/request-a-quote`],
  ["Estimator", `${bases.web}/estimate`],
  ["Robots", `${bases.web}/robots.txt`],
  ["Sitemap", `${bases.web}/sitemap.xml`],
  ["Admin login", `${bases.admin}/login`],
  ["API liveness", `${bases.api}/health`],
  ["API readiness", `${bases.api}/health/ready`],
];
let failed = 0;
for (const [name, url] of checks) {
  try {
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    failed += 1;
    process.stderr.write(
      `FAIL ${name}: ${error instanceof Error ? error.message : "request failed"}\n`,
    );
  }
}
process.stdout.write(`Smoke summary: ${checks.length - failed} passed, ${failed} failed.\n`);
if (failed) process.exitCode = 1;
