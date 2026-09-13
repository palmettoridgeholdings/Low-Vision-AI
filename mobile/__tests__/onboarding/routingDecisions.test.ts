import { getOnboardingHref, shouldRedirectToOnboarding } from "@/state/routingDecisions";

describe("shouldRedirectToOnboarding", () => {
  it("does not redirect before hydration has finished", () => {
    expect(shouldRedirectToOnboarding({ hydrated: false, onboarding: { completed: false } })).toBe(
      false,
    );
  });

  it("redirects once hydrated if onboarding is incomplete", () => {
    expect(shouldRedirectToOnboarding({ hydrated: true, onboarding: { completed: false } })).toBe(
      true,
    );
  });

  it("does not redirect once onboarding is complete", () => {
    expect(shouldRedirectToOnboarding({ hydrated: true, onboarding: { completed: true } })).toBe(
      false,
    );
  });
});

describe("getOnboardingHref", () => {
  it.each([
    ["welcome", "/onboarding/welcome"],
    ["vision", "/onboarding/vision"],
    ["interaction", "/onboarding/interaction"],
    ["device", "/onboarding/device"],
    ["answer_behavior", "/onboarding/answer-behavior"],
    ["confirmation", "/onboarding/confirmation"],
  ] as const)("resumes %s at %s", (step, href) => {
    expect(getOnboardingHref(step)).toBe(href);
  });

  it("falls back safely for an inconsistent done state", () => {
    expect(getOnboardingHref("done")).toBe("/onboarding/welcome");
  });
});
