# Restore Rehearsal

Perform quarterly and before material storage/migration changes in an isolated local or staging environment.

1. Record current release/migrations and create verified database/media backups.
2. Create a new empty PostgreSQL database and empty media target; never reuse the main development/production targets.
3. Set `RESTORE_DATABASE_URL` to the isolated database and run `restore-database.sh --confirm-isolated-restore BACKUP`.
4. Run `restore-media.sh --confirm-isolated-restore ARCHIVE EMPTY_TARGET`.
5. Configure an isolated application environment pointing only to restored resources. Apply no migration until the backup release/schema compatibility is understood.
6. Start the matching release and verify liveness/readiness, Super Admin login, quote/estimate/blog/project/job representative records, public published media, and signed-out denial of private quote/job/Draft media.
7. Verify no storage paths/secrets appear, run smoke checks, compare row/media counts, and document duration and discrepancies.
8. Stop the rehearsal. Resolve and verify exact isolated paths, then remove only those isolated resources through platform-native commands.

This phase documents and argument-tests restoration. A destructive restore against the main database was not performed.
