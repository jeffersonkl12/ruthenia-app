# chat-test — LibreChat + agente Ruthenia (Docker)

Harness interativo para testar o **ecossistema do agente** (`api/src/llm/`) por uma UI de chat.
Toda mensagem digitada na LibreChat passa pelo shim `agent-api` → `agentFactory` → grafo LangGraph.
Nenhum provedor de LLM é exposto direto na interface.

```
LibreChat (3080) ──HTTP /v1/chat/completions──▶ agent-api (8787) ──▶ grafo LangGraph ──▶ provedor
      │
   MongoDB (histórico das conversas)
```

## Serviços

| Serviço     | Imagem / build                         | Porta |
|-------------|----------------------------------------|-------|
| `librechat` | `ghcr.io/danny-avila/librechat:latest` | 3080  |
| `agent-api` | build de `../api/Dockerfile`           | 8787  |
| `mongodb`   | `mongo:8.0.20`                         | —     |

## Passos

```bash
cd chat-test
cp .env.example .env
```

Edite `.env`:

1. **Segredos da LibreChat** — gere valores reais:
   ```bash
   openssl rand -hex 32   # CREDS_KEY, JWT_SECRET, JWT_REFRESH_SECRET
   openssl rand -hex 16   # CREDS_IV
   ```
2. **Chave de provedor** — preencha ao menos `ANTHROPIC_API_KEY` (ou ajuste
   `LLM_DEFAULT_PROVIDER` e a chave correspondente).

Suba tudo:

```bash
docker compose up -d           # a 1ª vez baixa imagens e builda o agent-api
docker compose logs -f agent-api
```

Abra <http://localhost:3080>, clique em **Register** (o 1º usuário vira admin),
escolha o endpoint **Ruthenia Agent**, selecione um modelo (`anthropic/…`, `openai/…`,
`google-genai/…`, `deepseek/…`) e converse.

Trocar o modelo no seletor troca provedor/modelo dinamicamente — desde que a chave
correspondente esteja no `.env`.

## Testar o shim isolado (sem a UI)

```bash
curl localhost:8787/health
curl localhost:8787/v1/models

curl -N localhost:8787/v1/chat/completions \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer local-dev' \
  -d '{"model":"anthropic/claude-haiku-4-5","stream":true,
       "messages":[{"role":"user","content":"Descreva uma taverna em uma frase."}]}'
```

## Manutenção

```bash
docker compose restart agent-api           # após mexer em api/src/**
docker compose up -d --build agent-api     # rebuild da imagem do shim
docker compose down                        # parar tudo (mantém ./data)
docker compose logs librechat              # logs da UI
```

Dados persistem em `./data/` (git-ignored). Apague para começar do zero.

## Troubleshooting

- **UI sem o endpoint "Ruthenia Agent"** → `librechat.yaml` inválido ou `AGENT_API_KEY`
  ausente no `.env`. Ver `docker compose logs librechat`.
- **"Provedor sem credencial"** → falta a API key daquele provedor no `.env`;
  `docker compose up -d` para recarregar.
- **Porta 3080/8787 ocupada** → ajuste o mapeamento em `docker-compose.yml`.
