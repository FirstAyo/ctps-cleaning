# Deployment Runbook

1. Provision a supported Linux VPS sized from measured needs; record owner and recovery access.
2. Create a non-root deployment user and verify key-based SSH before any password/root restriction.
3. Install supported Docker Engine and Compose; configure staged firewall rules for SSH, 80, and 443 only.
4. Clone the tagged/recorded release into a deployment-user-owned directory.
5. Copy `.env.production.example` to untracked `.env.production`, replace all placeholders, set mode `600`, and run `pnpm environment:validate:production`.
6. Create certificate/ACME, backup, and operational log directories with reviewed ownership; never make media world-writable.
7. Configure public/Admin DNS. Confirm resolution before certificate issuance.
8. Run `docker compose -f compose.production.yml config` and build immutable images.
9. Start PostgreSQL only; wait for health. Create and verify database/media backups before every upgrade.
10. Review every pending Prisma migration, then run `scripts/deployment/production-compose.sh migrate` once.
11. Run compiled permission initialisation. On first deployment only, bootstrap Super Admin interactively from a trusted terminal; record completion, not credentials.
12. Start API, web, Admin, and then Nginx. Do not publish their internal ports.
13. Obtain certificates with Certbot/another ACME client using the ACME directory or a controlled temporary HTTP configuration. Mount `fullchain.pem` and `privkey.pem`; never commit them.
14. Verify renewal with a dry run. Enable HTTP→HTTPS. Verify all domains before retaining HSTS; do not preload.
15. Run liveness/readiness, public/Admin smoke, Admin login/session/CSRF, quote/estimator/blog/portfolio/jobs, private-media signed-out denial, Author denial, email mode, and scheduled commands.
16. Configure documented cron/systemd tasks with `flock`, absolute paths, the deployment user, safe environment loading, and log rotation.
17. Configure database/media backups, off-host copy, checksum monitoring, disk/certificate/health/mail alerts, and incident contacts.
18. Complete `docs/release-checklist.md`, record release/version/time/operator, and retain the previous images for rollback.

If certificate issuance fails, keep the prior TLS service active; do not expose direct app ports or weaken cookies. If first deployment has no prior service, keep the site unavailable while DNS/ACME is corrected. This repository does not alter a VPS, DNS, TLS, firewall, or SSH automatically.
