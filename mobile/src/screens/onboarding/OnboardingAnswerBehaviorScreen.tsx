import { useRouter } from "expo-router";
import { View } from "react-native";

import { AccessibleToggle, ChoiceList, OnboardingStepShell } from "@/components";
import { usePersistedAppState } from "@/hooks/usePersistedAppState";
import { chooseAnswerBehavior, goToOnboardingStep, updateSettings } from "@/state/appStateStore";
import type { AnswerStyle } from "@/types/onboarding";
import {
  ANSWER_BEHAVIOR_PROMPT,
  ANSWER_STYLE_LABELS,
  ANSWER_STYLE_ORDER,
} from "@/constants/onboardingCopy";
import { spacing } from "@/theme/spacing";

/** State E (Answer Behavior) from docs/BLIND_FIRST_ONBOARDING_SPEC.md. */
export function OnboardingAnswerBehaviorScreen() {
  const router = useRouter();
  const { onboarding, settings } = usePersistedAppState();

  const options = ANSWER_STYLE_ORDER.map((value) => ({
    value,
    label: ANSWER_STYLE_LABELS[value],
  }));

  const handleSelectStyle = (style: AnswerStyle) => {
    chooseAnswerBehavior(style, settings.autoSpeakAnswers);
  };

  const handleToggleAutoSpeak = (autoSpeakAnswers: boolean) => {
    updateSettings({ autoSpeakAnswers });
    if (onboarding.answerStyle) {
      chooseAnswerBehavior(onboarding.answerStyle, autoSpeakAnswers);
    }
  };

  return (
    <OnboardingStepShell
      heading="Answer behavior"
      prompt={ANSWER_BEHAVIOR_PROMPT}
      autoSpeak={onboarding.setupRoute === "spoken"}
      onBack={() => {
        goToOnboardingStep("device");
        router.back();
      }}
      onContinue={() => router.push("/onboarding/confirmation")}
      continueDisabled={!onboarding.answerStyle}
      testID="onboarding-answer-behavior-screen"
    >
      <View style={{ marginBottom: spacing.md }}>
        <AccessibleToggle
          label="Automatically speak answers"
          description="Read every answer aloud as soon as it's ready"
          value={settings.autoSpeakAnswers}
          onValueChange={handleToggleAutoSpeak}
          testID="onboarding-auto-speak-toggle"
        />
      </View>
      <ChoiceList
        groupLabel="Answer style"
        options={options}
        selectedValue={onboarding.answerStyle}
        onSelect={handleSelectStyle}
      />
    </OnboardingStepShell>
  );
}
