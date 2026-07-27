# Monitoring and Alerting

Monitor public/Admin availability, `/health` liveness, `/health/ready` database/storage readiness, 5xx rate, latency, container restarts, PostgreSQL connections/latency/size, disk/inodes, media and backup growth, backup/checksum/off-host success, SMTP/outbox failures, scheduler last success, failed publication/reminders, login/rate-limit anomalies, TLS expiry/renewal, CPU/memory, and Nginx upstream errors.

Suggested starting alerts—not guarantees—are readiness failure for two minutes, repeated restarts, disk above 80% warning/90% urgent, no successful daily backup by the approved deadline, certificate under 21 days, exhausted outbox attempts, scheduler overdue by two expected intervals, and sustained 5xx/latency above measured baseline. Tune after observing normal operation.

Nginx and API emit structured JSON with request IDs. Retain access/application logs for an approved short operational period, restrict access, mask customer data, and rotate by size/daily with compression and delayed removal. Docker `json-file` should use bounded `max-size`/`max-file` or a reviewed logging driver. Do not log bodies, cookies, tokens, CSRF, SMTP data, addresses, full emails/phones, or filesystem paths.

No vendor is required. Operators may use Prometheus/Grafana, Uptime Kuma, journald, or another portable system. Monitoring credentials and incident contacts remain outside the repository.
