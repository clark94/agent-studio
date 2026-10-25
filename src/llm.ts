import type { ChatMessage, LLMProvider } from "./types.js";

/**
 * LLM factice et déterministe : permet de tester la plateforme sans clé d'API.
 * Il répond selon le protocole JSON attendu par l'agent.
 */
export class MockLLM implements LLMProvider {
  name = "mock";

  async chat(messages: ChatMessage[]): Promise<string> {
    const last = messages[messages.length - 1];
    if (last.content.startsWith("Observation :")) {
      const obs = last.content.replace("Observation :", "").trim();
      return JSON.stringify({ final: obs });
    }
    const question = last.content;
    const math = question.match(/[0-9][0-9+\-*/().\s]*[0-9)]/);
    if (math && /[+\-*/]/.test(math[0])) {
      return JSON.stringify({ tool: "calculator", input: math[0].trim() });
    }
    if (/compte les mots/i.test(question)) {
      const text = question.split(":").slice(1).join(":").trim();
      return JSON.stringify({ tool: "word_count", input: text });
    }
    return JSON.stringify({ final: "Je ne sais pas répondre à cette question." });
  }
}

/** Client pour toute API de chat compatible OpenAI (baseURL, clé et modèle configurables). */
export class OpenAICompatibleLLM implements LLMProvider {
  name: string;
  constructor(
    private baseUrl: string,
    private apiKey: string,
    private model: string,
  ) {
    this.name = `openai-compatible:${model}`;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, messages, temperature: 0 }),
    });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0].message.content;
  }
}

/** Choisit le fournisseur selon les variables d'environnement, sinon le mock. */
export function llmFromEnv(): LLMProvider {
  const { LLM_BASE_URL, LLM_API_KEY, LLM_MODEL } = process.env;
  if (LLM_BASE_URL && LLM_API_KEY && LLM_MODEL) {
    return new OpenAICompatibleLLM(LLM_BASE_URL, LLM_API_KEY, LLM_MODEL);
  }
  return new MockLLM();
}
