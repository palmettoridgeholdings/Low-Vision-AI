import { lastAnswerStore, type LastAnswer } from "@/state/lastAnswerStore";
import { useStore } from "@/hooks/useStore";

export function useLastAnswer(): LastAnswer | null {
  return useStore(lastAnswerStore);
}
