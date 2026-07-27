FROM node:22.12.0-bookworm-slim AS build
RUN npm install --global pnpm@10.15.1
WORKDIR /workspace
COPY . .
RUN pnpm install --frozen-lockfile
ENV NODE_ENV=production \
    API_URL=http://api:4000 \
    ADMIN_URL=https://admin.ctps.example.com
RUN pnpm --filter @ctps/admin... build

FROM node:22.12.0-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0
WORKDIR /app
RUN groupadd --system --gid 1001 ctps && useradd --system --uid 1001 --gid ctps ctps
COPY --from=build --chown=ctps:ctps /workspace/apps/admin/.next/standalone ./
COPY --from=build --chown=ctps:ctps /workspace/apps/admin/.next/static ./apps/admin/.next/static
USER ctps
EXPOSE 3001
CMD ["node", "apps/admin/server.js"]
