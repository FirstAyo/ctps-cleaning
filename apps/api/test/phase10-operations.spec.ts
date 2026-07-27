import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

describe("Phase 10 production operations", () => {
  it("keeps PostgreSQL and application ports private in production Compose", () => {
    const compose = read("compose.production.yml");
    const beforeNginx = compose.slice(0, compose.indexOf("  nginx:"));
    expect(beforeNginx).not.toMatch(/\n\s+ports:/);
    expect(compose).toContain("ctps_postgres_data:/var/lib/postgresql/data");
    expect(compose).toContain("ctps_public_media:/app/storage/public");
    expect(compose).toContain("ctps_private_media:/app/storage/private");
  });

  it("uses guarded verified backup and isolated restore scripts", () => {
    const databaseBackup = read("scripts/deployment/backup-database.sh");
    const mediaBackup = read("scripts/deployment/backup-media.sh");
    const databaseRestore = read("scripts/deployment/restore-database.sh");
    expect(databaseBackup).toMatch(/set -eu[\s\S]*pg_dump[\s\S]*pg_restore --list[\s\S]*sha256sum/);
    expect(mediaBackup).toMatch(/set -eu[\s\S]*tar[\s\S]*gzip -t[\s\S]*sha256sum/);
    expect(databaseRestore).toContain("--confirm-isolated-restore");
    expect(databaseRestore).toContain("Refusing to restore into DATABASE_URL");
  });

  it("defines TLS, safe proxy headers, restrictive headers, and no unsafe eval", () => {
    const nginx = read("infrastructure/nginx/templates/default.conf.template");
    expect(nginx).toContain("ssl_protocols TLSv1.2 TLSv1.3");
    expect(nginx).toContain("proxy_set_header X-Request-ID $request_id");
    expect(nginx).toContain("Content-Security-Policy");
    expect(nginx).not.toContain("'unsafe-eval'");
  });
});
