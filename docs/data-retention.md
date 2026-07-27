# Data Retention

| Data                    | Current behaviour                                      | Decision required before automated deletion                         |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| Sessions/throttles      | Expired/revoked technical records are cleaned          | Approve security-log evidence period                                |
| Quote drafts/uploads    | Expired unsubmitted drafts are cleanup candidates      | Confirm privacy window and orphan reconciliation                    |
| Submitted quotes/photos | Retained unless explicit staff action permits deletion | Business/legal retention and backup deletion implications           |
| Estimate results        | Default seven-day expiry; records remain/archivable    | Approve purge timing and reporting needs                            |
| Email outbox            | Attempts/status retained                               | Approve operational/audit period and recipient-data handling        |
| Before/after media      | Lifecycle/reference controlled                         | Consent, public archive, and backup expiry policy                   |
| Blog/revisions          | Retained with lifecycle history                        | Editorial revision/redirect policy                                  |
| Jobs/media/incidents    | Preserved through archive                              | Operational, insurance, safety, and legal review                    |
| Audit logs              | No ordinary deletion                                   | Security/legal retention and restricted export policy               |
| Logs                    | Host-dependent                                         | Approve short operational period and masking/access                 |
| Backups                 | No automatic deletion                                  | Approve daily/weekly/monthly example and encryption/off-host policy |

Deletion from the primary database does not immediately remove retained backups. CTPS must document restoration-time deletion handling. Phase 10 adds only a dry-run report and does not delete submitted quotes, jobs, media, audit logs, or business records automatically.
