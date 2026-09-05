# Shim HTTP OpenAI-compatível que executa o agente LangGraph (api/src/server).
# IMPORTANTE: o contexto de build é a RAIZ do repo — as dependências vivem no
# package.json raiz, não em api/package.json.
#
#   docker build -f api/Dockerfile -t ruthenia-agent-api .

FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock ./
COPY api ./api
WORKDIR /app/api
EXPOSE 8787
# Bun executa TypeScript nativamente e respeita os paths do tsconfig.
CMD ["bun", "run", "src/index.ts"]
