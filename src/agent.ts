import type { AgentResult, AgentSpec, ChatMessage, LLMProvider, Step, Tool } from "./types.js";

function buildSystemPrompt(spec: AgentSpec, tools: Tool[]): string {
  const list = tools.map((t) => `- ${t.name} : ${t.description}`).join("\n");
  return [
    spec.systemPrompt,
    "Outils disponibles :",
    list,
    'Réponds UNIQUEMENT en JSON : {"tool":"<nom>","input":"<entrée>"} pour appeler un outil,',
    'ou {"final":"<réponse>"} quand tu as la réponse.',
  ].join("\n");
}

/** Extrait le premier objet JSON d'une réponse de LLM (souvent entourée de texte). */
function parseAction(raw: string): { tool?: string; input?: string; final?: string } | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

/** Boucle d'agent : le LLM choisit un outil, on exécute, on renvoie l'observation. */
export async function runAgent(
  spec: AgentSpec,
  available: Record<string, Tool>,
  llm: LLMProvider,
  question: string,
): Promise<AgentResult> {
  const tools = spec.tools.map((n) => available[n]).filter(Boolean);
  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(spec, tools) },
    { role: "user", content: question },
  ];
  const steps: Step[] = [];
  const maxSteps = spec.maxSteps ?? 5;

  for (let i = 0; i < maxSteps; i++) {
    const raw = await llm.chat(messages);
    messages.push({ role: "assistant", content: raw });
    const action = parseAction(raw);

    if (!action) {
      messages.push({ role: "user", content: "Observation : réponse JSON invalide, réessaie." });
      continue;
    }
    if (action.final !== undefined) return { answer: String(action.final), steps };

    const tool = action.tool ? available[action.tool] : undefined;
    const allowed = tool && spec.tools.includes(tool.name);
    const observation = allowed
      ? await tool.run(action.input ?? "")
      : `Erreur : outil inconnu ou non autorisé (${action.tool})`;
    steps.push({ tool: action.tool ?? "?", input: action.input ?? "", observation });
    messages.push({ role: "user", content: `Observation : ${observation}` });
  }
  return { answer: "Limite d'étapes atteinte sans réponse.", steps };
}
