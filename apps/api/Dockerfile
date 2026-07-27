FROM node:22.12.0-bookworm-slim AS build
RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@10.15.1
WORKDIR /workspace
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate && pnpm --filter @ctps/api... build
RUN pnpm --filter @ctps/api deploy --prod --legacy /opt/ctps-api

FROM build AS migration
CMD ["pnpm", "--filter", "@ctps/database", "exec", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"]

FROM node:22.12.0-bookworm-slim AS runtime
ENV NODE_ENV=production API_PORT=4000
WORKDIR /app
RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 ctps \
    && useradd --system --uid 1001 --gid ctps ctps
COPY --from=build --chown=ctps:ctps /opt/ctps-api ./
USER ctps
EXPOSE 4000
CMD ["node", "dist/main.js"]
