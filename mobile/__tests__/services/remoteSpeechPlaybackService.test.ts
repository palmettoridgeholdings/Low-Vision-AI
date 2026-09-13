import { createAudioPlayer } from "expo-audio";

import { remoteSpeechPlaybackService } from "@/services/speech/remoteSpeechPlaybackService";

const mockedCreateAudioPlayer = jest.mocked(createAudioPlayer);

function makePlayer() {
  return {
    addListener: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    remove: jest.fn(),
  };
}

beforeEach(async () => {
  await remoteSpeechPlaybackService.stop();
  mockedCreateAudioPlayer.mockReset();
});

it("plays a remote answer and releases it when stopped", async () => {
  const player = makePlayer();
  mockedCreateAudioPlayer.mockReturnValue(
    player as unknown as ReturnType<typeof createAudioPlayer>,
  );

  await remoteSpeechPlaybackService.playFromUri("https://api.example.com/answer.mp3");
  expect(player.play).toHaveBeenCalledTimes(1);

  await remoteSpeechPlaybackService.stop();
  expect(player.pause).toHaveBeenCalledTimes(1);
  expect(player.remove).toHaveBeenCalledTimes(1);
});

it("reports and rethrows setup failures so on-device speech can take over", async () => {
  const error = new Error("audio unavailable");
  const onError = jest.fn();
  mockedCreateAudioPlayer.mockImplementation(() => {
    throw error;
  });

  await expect(
    remoteSpeechPlaybackService.playFromUri("https://api.example.com/answer.mp3", { onError }),
  ).rejects.toThrow("audio unavailable");
  expect(onError).toHaveBeenCalledWith(error);
});
