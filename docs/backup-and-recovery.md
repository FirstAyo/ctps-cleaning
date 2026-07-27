# Backup and Recovery

## Tooling

`pnpm backup:database` runs `pg_dump` custom/compressed format, refuses overwrite, verifies the archive with `pg_restore --list`, writes SHA-256, and uses restrictive permissions. `pnpm backup:media` archives `storage/public` and `storage/private`, excludes temporary probes, verifies gzip, and writes SHA-256. Set `DATABASE_URL`, `BACKUP_ROOT`, and optionally `MEDIA_BACKUP_SOURCE` through a protected environment—not command-line credentials.

The scripts never delete old backups. Example policy requiring CTPS approval: daily for 14 days, weekly for eight weeks, monthly for 12 months. Copy encrypted backups off-host. Standard tools such as restic, age, or GPG may be used; keep recovery keys separately, document rotation, and test decryption. Do not invent custom cryptography.

## Coordinated procedure

1. Confirm health, disk capacity, deployment version, and prior off-host status.
2. Pause blog publication, reminders, outbox processing, and write-heavy maintenance if consistency requires it.
3. Create and verify the PostgreSQL dump.
4. Create and verify the public/private media archive.
5. Record filenames, checksums, release, schema migration, time, operator, and any writes during the window.
6. Copy off-host, verify remote checksum, resume tasks, and alert on any failure.

PostgreSQL and files cannot share one transaction. A quiet/coordinated window reduces mismatch; records and generated storage keys allow reconciliation. Never treat an unverified local archive as a backup.

## Restore

`restore-database.sh` requires `--confirm-isolated-restore`, an adjacent checksum, and `RESTORE_DATABASE_URL` different from `DATABASE_URL`. `restore-media.sh` requires the same confirmation and an empty target. Neither targets production by default. After restore, set ownership, match application release to backup schema, inspect migrations before deploying them, start in isolation, verify readiness/workflows/private/public media, and record the rehearsal. Production overwrite requires separate incident approval and is intentionally not automated.

RPO/RTO, retention, encryption tool, off-host destination, and backup-user separation remain business/operations decisions.
