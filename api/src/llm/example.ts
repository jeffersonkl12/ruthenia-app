/**
 * Smoke test manual da infraestrutura de agente.
 *
 * Uso:
 *   cd api
 *   cp .env.example .env   # e preencha ao menos uma API key
 *   bunx tsx src/llm/example.ts
 *
 * Troque `provider` por "openai" | "google-genai" | "deepseek" (com a chave
 * correspondente no .env) para verificar a seleção dinâmica de provedor.
 */
import { agentFactory, providerRegistry } from "./index";

async function main(): Promise<void> {
  console.log(
    "Provedores registrados:",
    providerRegistry.list().map((p) => `${p.name} (${p.defaultModel})`),
  );

  const agent = await agentFactory.create({
    name: "smoke",
    model: { provider: "google-genai" },
    systemPrompt: "Responda em uma única frase.",
  });

  const result = await agent.invoke({
    messages: [{ role: "user", content: "Saúde o mundo de Ruthenia." }],
  });

  console.log("\nResposta:", result.content);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
