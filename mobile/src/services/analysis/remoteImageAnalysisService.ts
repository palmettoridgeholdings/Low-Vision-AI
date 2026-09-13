import { backendConfig } from "@/services/config/backendConfig";
import type {
  ImageAnalysisRequest,
  ImageAnalysisResult,
  ImageAnalysisService,
} from "@/types/services";

const SAFETY_DISCLAIMER =
  "This description is not verified and must never be relied on for navigation, safety, medication, or other high-stakes decisions.";

/**
 * Minimal real implementation: uploads the captured photo to
 * `${baseUrl}/v1/analyze-image` and expects `{ description: string }` back.
 * The safety disclaimer is applied here unconditionally rather than trusted
 * from the response, so no backend response can ever omit it.
 *
 * Foundation only — no backend exists to test this against yet. Runs only
 * when mock mode is off and a base URL is configured.
 */
export const remoteImageAnalysisService: ImageAnalysisService = {
  async analyze(request: ImageAnalysisRequest): Promise<ImageAnalysisResult> {
    if (!backendConfig.baseUrl) {
      throw new Error("No backend base URL is configured.");
    }

    const formData = new FormData();
    formData.append("image", {
      uri: request.imageUri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as unknown as Blob);
    formData.append("mode", request.mode);
    if (request.question) {
      formData.append("question", request.question);
    }

    const response = await fetch(`${backendConfig.baseUrl}/v1/analyze-image`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Image analysis request failed (${response.status}).`);
    }

    const json = (await response.json()) as { description?: string };
    if (!json.description) {
      throw new Error("Image analysis response was missing a description.");
    }
    return { description: json.description, disclaimer: SAFETY_DISCLAIMER };
  },
};
