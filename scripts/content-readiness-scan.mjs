import { readFileSync } from "node:fs";
import process from "node:process";

const customerContentFiles = [
  "apps/api/src/marketing/marketing-content.ts",
  "apps/web/src/content/site.ts",
  "apps/web/src/components/homepage-sections.tsx",
  "apps/web/src/components/marketing-comparison.tsx",
  "apps/web/src/components/marketing-page-sections.tsx",
  "apps/web/src/components/marketing.tsx",
  "apps/web/src/components/portfolio.tsx",
  "apps/web/src/components/public-pages.tsx",
];

const prohibited = [
  /approved content coming soon/i,
  /before production/i,
  /confirmed communities/i,
  /development demonstration/i,
  /development placeholder/i,
  /design system preview/i,
  /policy foundation/i,
  /service families/i,
  /template thinking/i,
];

const findings = [];
for (const file of customerContentFiles) {
  const content = readFileSync(file, "utf8");
  for (const pattern of prohibited)
    if (pattern.test(content))
      findings.push(`${file}: prohibited customer-facing phrase ${pattern}`);
}

const homepage = readFileSync("apps/web/src/app/page.tsx", "utf8");
if (/http:\/\/localhost/i.test(homepage))
  findings.push("apps/web/src/app/page.tsx: hardcoded localhost in Homepage output");

const sitemap = readFileSync("apps/web/src/app/sitemap.ts", "utf8");
for (const legalPath of ["/privacy", "/terms", "/accessibility"])
  if (sitemap.includes(`"${legalPath}"`))
    findings.push(`apps/web/src/app/sitemap.ts: unapproved legal foundation ${legalPath}`);

if (findings.length) {
  process.stderr.write(`${findings.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Content-readiness scan passed across ${customerContentFiles.length} customer-content sources.\n`,
  );
}
