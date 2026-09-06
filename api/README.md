# api

Backend de Ruthenia: domínio (`database` / `repository` / `service`), agente
(`llm`) e o shim HTTP OpenAI-compatível (`server`) que a LibreChat consome.

## Ambiente

```bash
cp .env.example .env   # preencha ao menos uma chave de provedor de LLM
```

`DATABASE_URL` é opcional (default `file:./ruthenia.db`).

## Banco de dados (libSQL/SQLite + Drizzle)

```bash
bun run db:push          # cria/atualiza as tabelas a partir dos schemas
bun run db:seed          # popula o mundo base de exemplo (Valdheim)
bun run db:seed --reset  # LIMPA todo o banco e recria a seed
bun run db:studio        # abre o Drizzle Studio
```

A seed (`src/database/seed.ts`) monta um cenário coeso e pequeno para teste:
1 reino (**Valdheim**), 2 regiões (Vale de Pedrálida, Marca de Bruma), a Cidadela
de Correnthal com sub-locais (taverna, forja, castelo), 1 party (**Os Errantes do
Corvo**) e 5 personagens, incluindo o jogador **Kaelen Vharr**. É idempotente:
rodar de novo sem `--reset` não duplica nada.

> Hoje o agente ainda **não lê** esse mundo — a seed é groundwork para as tools /
> RAG do mestre narrador.

## Servidor (shim para a LibreChat)

```bash
bun run start            # ou: bun run dev  (watch)
```

Sobe em `http://0.0.0.0:8787` por padrão. Rotas: `GET /health`,
`GET /v1/models`, `POST /v1/chat/completions` (JSON e streaming SSE).
Config via env: `AGENT_API_PORT`, `AGENT_API_HOST`, `AGENT_API_KEY` (bearer
opcional). Para o stack completo com a LibreChat, ver `../chat-test/`.
