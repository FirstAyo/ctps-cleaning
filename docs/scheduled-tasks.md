# Scheduled Tasks

| Command                                      | Purpose / frequency                        | Safety and failure                                                    |
| -------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| `pnpm blog:publish-due`                      | Publish due posts every minute             | Bounded, conditional, repeat-safe; monitor invalid totals             |
| `pnpm jobs:send-reminders`                   | Queue/deliver reminders every 5–15 minutes | Deduplication key prevents repeats; bounded batch                     |
| `pnpm email:process-outbox`                  | Retry quote/job outbox every minute        | Maximum five attempts, bounded batches, summary only; no body logging |
| `pnpm maintenance:cleanup-dry-run`           | Daily retention report                     | Read-only; `--execute` is rejected until policy approval              |
| Existing session/quote cleanup               | In-process hourly cleanup                  | Expired/revoked technical records only; monitor service errors        |
| `pnpm backup:database` / `pnpm backup:media` | Coordinated daily window                   | Non-overwriting, checksum-verified; alert/copy off-host               |

No submitted quote, job, audit log, published content, or business record is automatically deleted by Phase 10.

## Cron example

```cron
* * * * * flock -n /run/lock/ctps-blog.lock sh -c 'cd /srv/ctps/app && set -a && . /srv/ctps/.env.production && set +a && pnpm blog:publish-due' >>/var/log/ctps/scheduled.log 2>&1
*/5 * * * * flock -n /run/lock/ctps-email.lock sh -c 'cd /srv/ctps/app && set -a && . /srv/ctps/.env.production && set +a && pnpm email:process-outbox && pnpm jobs:send-reminders' >>/var/log/ctps/scheduled.log 2>&1
```

Use an environment file readable only by the deployment user; do not put secrets in crontab. Server and application scheduling use UTC where stored; job rendering remains America/Vancouver.

## systemd example

Create a oneshot service with `User=ctps`, `WorkingDirectory=/srv/ctps/app`, `EnvironmentFile=/srv/ctps/.env.production`, and `ExecStart=/usr/local/bin/pnpm email:process-outbox`. Pair with a timer using `OnBootSec=2min`, `OnUnitActiveSec=1min`, `Persistent=true`, and `RandomizedDelaySec=10`. Use separate units/locks per command, `TimeoutStartSec`, failure notification, journal retention, and `RequiresMountsFor` persistent media. Validate absolute pnpm paths with `command -v pnpm`.
