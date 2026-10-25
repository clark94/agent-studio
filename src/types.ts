export type Role = "system" | "user" | "assistant";
export interface ChatMessage { role: Role; content: string }

/** Un fournisseur de LLM : mock local ou API compatible OpenAI. */
export interface LLMProvider {
  name: string;
  chat(messages: ChatMessage[]): Promise<string>;
}

/** Un outil que l'agent peut appeler. */
export interface Tool {
  name: string;
  description: string;
  run(input: string): Promise<string>;
}

/** Description déclarative d'un agent (ce que l'utilisateur crée). */
export interface AgentSpec {
  name: string;
  systemPrompt: string;
  tools: string[];
  maxSteps?: number;
}

export interface Step { tool: string; input: string; observation: string }
export interface AgentResult { answer: string; steps: Step[] }

export interface TestCase { question: string; expected: string }
