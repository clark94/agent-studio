import { compareLLMs } from "./evaluate.js";
import { llmFromEnv, MockLLM } from "./llm.js";
import { startServer } from "./server.js";
import { builtinTools } from "./tools.js";
import type { AgentSpec, TestCase } from "./types.js";

// 1. CRÉER : un agent est une simple spécification déclarative.
const assistant: AgentSpec = {
  name: "assistant-calcul",
  systemPrompt: "Tu es un assistant précis qui utilise des outils plutôt que de deviner.",
  tools: ["calculator", "word_count"],
  maxSteps: 4,
};
const agents = new Map<string, AgentSpec>([[assistant.name, assistant]]);

// 2. TESTER : un jeu de cas avec la réponse attendue.
const cases: TestCase[] = [
  { question: "Combien font 12 * (3 + 4) ?", expected: "84" },
  { question: "Calcule 100 / 8", expected: "12.5" },
  { question: "Compte les mots : le logiciel libre se partage", expected: "5" },
  { question: "Quelle est la capitale de la France ?", expected: "Paris" },
];

const mode = process.argv[2] ?? "demo";

if (mode === "serve") {
  // 3. DÉPLOYER : l'agent est exposé via une API HTTP.
  startServer(agents, builtinTools, llmFromEnv());
} else {
  // Comparer le mock et, si configuré, un vrai LLM sur les mêmes tests.
  const llms = [new MockLLM()];
  const real = llmFromEnv();
  if (real.name !== "mock") llms.push(real as MockLLM);
  const reports = await compareLLMs(assistant, builtinTools, llms, cases);
  for (const r of reports) {
    console.log(`\n=== ${r.llm} : ${r.passed}/${r.total} réussis, ${r.avgMs.toFixed(0)} ms en moyenne ===`);
    for (const c of r.cases) {
      console.log(`${c.passed ? "OK " : "KO "} ${c.question}\n     -> ${c.answer} (${c.steps} étape(s), ${c.ms} ms)`);
    }
  }
}
