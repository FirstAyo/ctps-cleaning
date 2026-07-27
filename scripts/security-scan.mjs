import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";

const files = execFileSync(
  "git",
  [
    "-c",
    `safe.directory=${process.cwd().replaceAll("\\", "/")}`,
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
  ],
  { encoding: "utf8" },
)
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => !file.endsWith("pnpm-lock.yaml"));
const findings = [];
const secretPatterns = [
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/\b(?:sk_live|rk_live)_[A-Za-z0-9]{16,}\b/, "live payment key"],
  [/SMTP_PASSWORD\s*=\s*[^\s#]*(?!CHANGE_ME)[A-Za-z0-9]{12,}/, "possible SMTP password"],
];
for (const file of files) {
  const content = readFileSync(file, "utf8");
  for (const [pattern, label] of secretPatterns)
    if (pattern.test(content)) findings.push(`${file}: ${label}`);
  if (!/(?:^|\/)test\//.test(file) && /\b(?:eval\s*\(|new\s+Function\s*\()/.test(content))
    findings.push(`${file}: dynamic code execution`);
  if (
    /apps[\\/]web[\\/]src/.test(file) &&
    /https?:\/\/[^\s"')]+\.(?:png|jpe?g|webp|gif|svg)/i.test(content)
  )
    findings.push(`${file}: remote image URL`);
}
if (findings.length) {
  process.stderr.write(`${findings.join("\n")}\n`);
  process.exitCode = 1;
} else process.stdout.write(`Security scan passed across ${files.length} tracked files.\n`);
