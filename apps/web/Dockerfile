FROM node:22.12.0-bookworm-slim AS build
RUN npm install --global pnpm@10.15.1
WORKDIR /workspace
COPY . .
RUN pnpm install --frozen-lockfile
ENV NODE_ENV=production \
    API_URL=http://api:4000 \
    WEB_URL=https://ctps.example.com \
    NEXT_PUBLIC_SITE_URL=https://ctps.example.com
RUN pnpm --filter @ctps/web... build

FROM node:22.12.0-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN groupadd --system --gid 1001 ctps && useradd --system --uid 1001 --gid ctps ctps
COPY --from=build --chown=ctps:ctps /workspace/apps/web/.next/standalone ./
COPY --from=build --chown=ctps:ctps /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=ctps:ctps /workspace/apps/web/public ./apps/web/public
USER ctps
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
