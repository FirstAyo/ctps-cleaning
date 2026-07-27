# Upgrade and Rollback Runbook

1. Announce maintenance if the migration or capacity plan requires it.
2. Confirm current health, alerts, disk space, certificate state, and fresh verified off-host database/media backups.
3. Fetch the intended immutable release; review source, dependencies, environment changes, Dockerfiles, Compose, and migrations.
4. Run automated verification and build images without replacing running containers.
5. Determine migration compatibility. Additive migrations permit application rollback; destructive/contract migrations require a forward-recovery plan and explicit backup approval.
6. Pause write-heavy scheduled tasks when backup/media consistency requires it. Run `prisma migrate deploy` through the profile-gated migration service.
7. Replace API, web, and Admin; wait for readiness; replace Nginx only after its configuration validates.
8. Run smoke and representative workflow checks, inspect structured logs/outbox/schedulers, resume tasks, and record the release.

Rollback triggers include repeated readiness failure, authentication/authorization regression, private-data exposure, migration incompatibility, widespread 5xx, or corrupt media behavior. Stop new writes if necessary, restore the previous application images/configuration, and verify health. Never blindly migrate down. When the new schema has received writes or is not backward compatible, prefer a reviewed corrective forward migration. Restore database/media only into isolation first and only after incident leadership approves production recovery.
