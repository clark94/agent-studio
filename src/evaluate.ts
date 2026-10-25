import { runAgent } from "./agent.js";
import type { AgentSpec, LLMProvider, TestCase, Tool } from "./types.js";

export interface CaseReport {
  question: string;
  expected: string;
  answer: string;
  passed: boolean;
  steps: number;
  ms: number;
}
export interface EvalReport { llm: string; passed: number; total: number; avgMs: number; cases: CaseReport[] }

/** Lance un jeu de tests sur un agent et mesure réussite, étapes et latence. */
export async function evaluateAgent(
  spec: AgentSpec,
  tools: Record<string, Tool>,
  llm: LLMProvider,
  cases: TestCase[],
): Promise<EvalReport> {
  const reports: CaseReport[] = [];
  for (const c of cases) {
    const t0 = Date.now();
    let answer = "";
    let steps = 0;
    try {
      const r = await runAgent(spec, tools, llm, c.question);
      answer = r.answer;
      steps = r.steps.length;
    } catch (e) {
      answer = `Erreur : ${(e as Error).message}`;
    }
    reports.push({
      question: c.question,
      expected: c.expected,
      answer,
      passed: answer.includes(c.expected),
      steps,
      ms: Date.now() - t0,
    });
  }
  const passed = reports.filter((r) => r.passed).length;
  const avgMs = reports.reduce((s, r) => s + r.ms, 0) / Math.max(reports.length, 1);
  return { llm: llm.name, passed, total: reports.length, avgMs, cases: reports };
}

/** Compare plusieurs LLM sur le même agent et les mêmes tests. */
export async function compareLLMs(
  spec: AgentSpec,
  tools: Record<string, Tool>,
  llms: LLMProvider[],
  cases: TestCase[],
): Promise<EvalReport[]> {
  const out: EvalReport[] = [];
  for (const llm of llms) out.push(await evaluateAgent(spec, tools, llm, cases));
  return out;
}
