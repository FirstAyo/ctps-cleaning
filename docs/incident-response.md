# Incident Response

1. **Detect and declare:** record UTC time, reporter, symptoms, affected services/data, release, and incident lead. Use request IDs and safe identifiers, not customer data in broad channels.
2. **Contain:** preserve evidence; revoke compromised sessions/credentials; pause affected scheduler or writes; remove public routing only where needed; never destroy logs or blindly restore.
3. **Assess:** classify availability, confidentiality, integrity, scope, persistence, and legal/privacy notification needs. Restrict evidence access.
4. **Recover:** choose corrective release, image rollback, credential rotation, or isolated verified restore. Recheck migrations, permissions, private-media boundaries, outbox duplication, and health.
5. **Validate:** smoke representative public/Admin workflows, inspect logs/alerts, confirm backups and TLS, and monitor recurrence.
6. **Close:** document timeline, root cause, data impact, decisions, communications, follow-up owners/dates, and control improvements.

For suspected private-data exposure, immediately restrict the route, preserve access/audit logs, identify exact records/actors, rotate affected credentials, and obtain privacy/legal guidance. For database/media loss, stop writes, verify off-host checksums, restore into isolation, reconcile versions, then seek explicit production recovery approval. For TLS failure, retain the prior valid configuration or take service offline; never fall back to insecure staff cookies.
