import type {
  ImageAnalysisMode,
  ImageAnalysisRequest,
  ImageAnalysisResult,
  ImageAnalysisService,
} from "@/types/services";

const SAFETY_DISCLAIMER =
  "This is a mock description for testing only. Real analysis is not verified and must never be relied on for navigation, safety, medication, or other high-stakes decisions.";

const MODE_DESCRIPTIONS: Record<ImageAnalysisMode, string> = {
  read_text: "(Mock) The photo appears to contain some text, but this build cannot read it yet.",
  describe_scene:
    "(Mock) This would describe the general scene: indoors or outdoors, and roughly what's in view.",
  find_inspect:
    "(Mock) This would describe roughly where a requested object is, using clock-position and distance language.",
};

/**
 * Mock image analysis: returns a fixed, mode-appropriate placeholder and
 * the same safety disclaimer real analysis would carry, so the camera
 * screen's UI and copy can be built and tested without a vision model.
 */
export const mockImageAnalysisService: ImageAnalysisService = {
  async analyze(request: ImageAnalysisRequest): Promise<ImageAnalysisResult> {
    if (!request.imageUri) {
      throw new Error("No photo was provided to analyze.");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    const base = MODE_DESCRIPTIONS[request.mode];
    const description = request.question ? `${base} You asked: "${request.question}".` : base;
    return { description, disclaimer: SAFETY_DISCLAIMER };
  },
};
