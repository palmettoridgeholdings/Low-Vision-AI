import { mockQuestionService } from "@/services/qa/mockQuestionService";
import { mockTranscriptionService } from "@/services/transcription/mockTranscriptionService";
import { mockImageAnalysisService } from "@/services/analysis/mockImageAnalysisService";

describe("mockQuestionService", () => {
  it("rejects an empty question instead of returning a placeholder answer", async () => {
    await expect(mockQuestionService.ask({ text: "   " })).rejects.toThrow();
  });

  it("echoes the question inside a clearly-labeled mock answer", async () => {
    const result = await mockQuestionService.ask({ text: "What is this?" });
    expect(result.answerText).toContain("What is this?");
    expect(result.answerText.toLowerCase()).toContain("mock");
    // Mock mode never fabricates server-generated audio.
    expect(result.answerAudioUri).toBeUndefined();
  });
});

describe("mockTranscriptionService", () => {
  it("rejects when no recording was provided", async () => {
    await expect(mockTranscriptionService.transcribe({ audioUri: "" })).rejects.toThrow();
  });

  it("returns placeholder text for a provided recording", async () => {
    const result = await mockTranscriptionService.transcribe({ audioUri: "file:///tmp/clip.m4a" });
    expect(result.text.length).toBeGreaterThan(0);
  });
});

describe("mockImageAnalysisService", () => {
  it("rejects when no photo was provided", async () => {
    await expect(
      mockImageAnalysisService.analyze({ imageUri: "", mode: "describe_scene" }),
    ).rejects.toThrow();
  });

  it("always returns a safety disclaimer alongside the description", async () => {
    const result = await mockImageAnalysisService.analyze({
      imageUri: "file:///tmp/photo.jpg",
      mode: "find_inspect",
      question: "where are my keys",
    });
    expect(result.description).toContain("where are my keys");
    expect(result.disclaimer.length).toBeGreaterThan(0);
    expect(result.disclaimer.toLowerCase()).toContain("navigation");
  });

  it("never claims a result is verified or safe for navigation", async () => {
    const result = await mockImageAnalysisService.analyze({
      imageUri: "file:///tmp/photo.jpg",
      mode: "read_text",
    });
    expect(result.disclaimer.toLowerCase()).toMatch(/not verified/);
  });
});
