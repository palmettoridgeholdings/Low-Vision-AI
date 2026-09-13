import { createStore } from "@/utils/createStore";

export interface LastAnswer {
  text: string;
  /** Where the answer came from, for Help/debugging copy — not shown as a badge in the UI. */
  source: "question" | "camera" | "voice";
  createdAt: number;
}

/**
 * Session-only (not persisted to disk) record of the most recent answer, so
 * "Repeat last answer" works from the Home screen regardless of which
 * feature produced it. Intentionally in-memory: an answer may reflect a
 * photo or a spoken question the user would not expect to survive an app
 * restart.
 */
export const lastAnswerStore = createStore<LastAnswer | null>(null);

export function recordLastAnswer(text: string, source: LastAnswer["source"]): void {
  lastAnswerStore.setState({ text, source, createdAt: Date.now() });
}

export function clearLastAnswer(): void {
  lastAnswerStore.setState(null);
}
