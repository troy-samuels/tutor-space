import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  VIDEO_PRESETS,
  SIMULCAST_LAYERS_1080P,
  SIMULCAST_LAYERS_720P,
  getVideoCaptureOptions,
  getSimulcastLayers,
  getPreferredCodec,
  buildRoomOptions,
  getMediaConstraints,
} from "../lib/livekit-video-config.ts";

import {
  determineBandwidthAction,
  BANDWIDTH_THRESHOLDS,
} from "../lib/livekit-fallbacks.ts";

describe("LiveKit Video Configuration", () => {
  describe("VIDEO_PRESETS", () => {
    it("has correct resolution for high quality", () => {
      assert.equal(VIDEO_PRESETS.high.resolution.width, 1920);
      assert.equal(VIDEO_PRESETS.high.resolution.height, 1080);
      assert.equal(VIDEO_PRESETS.high.frameRate, 30);
    });

    it("has correct resolution for medium quality", () => {
      assert.equal(VIDEO_PRESETS.medium.resolution.width, 1280);
      assert.equal(VIDEO_PRESETS.medium.resolution.height, 720);
      assert.equal(VIDEO_PRESETS.medium.frameRate, 30);
    });

    it("has correct resolution for low quality", () => {
      assert.equal(VIDEO_PRESETS.low.resolution.width, 640);
      assert.equal(VIDEO_PRESETS.low.resolution.height, 360);
      assert.equal(VIDEO_PRESETS.low.frameRate, 24);
    });

    it("auto defaults to 720p", () => {
      assert.equal(VIDEO_PRESETS.auto.resolution.width, 1280);
      assert.equal(VIDEO_PRESETS.auto.resolution.height, 720);
    });
  });

  describe("SIMULCAST_LAYERS", () => {
    it("1080p has three layers", () => {
      assert.equal(SIMULCAST_LAYERS_1080P.length, 3);
      assert.equal(SIMULCAST_LAYERS_1080P[0].rid, "q");
      assert.equal(SIMULCAST_LAYERS_1080P[1].rid, "h");
      assert.equal(SIMULCAST_LAYERS_1080P[2].rid, "f");
    });

    it("720p has two layers", () => {
      assert.equal(SIMULCAST_LAYERS_720P.length, 2);
      assert.equal(SIMULCAST_LAYERS_720P[0].rid, "q");
      assert.equal(SIMULCAST_LAYERS_720P[1].rid, "f");
    });

    it("layers have correct scale factors", () => {
      assert.equal(SIMULCAST_LAYERS_1080P[0].scaleDownBy, 4); // quarter
      assert.equal(SIMULCAST_LAYERS_1080P[1].scaleDownBy, 2); // half
      assert.equal(SIMULCAST_LAYERS_1080P[2].scaleDownBy, 1); // full
    });
  });

  describe("getVideoCaptureOptions", () => {
    it("returns 1080p for high quality", () => {
      const options = getVideoCaptureOptions("high");
      assert.equal(options.resolution.width, 1920);
      assert.equal(options.resolution.height, 1080);
      assert.equal(options.frameRate, 30);
      assert.equal(options.facingMode, "user");
    });

    it("returns 720p for medium quality", () => {
      const options = getVideoCaptureOptions("medium");
      assert.equal(options.resolution.width, 1280);
      assert.equal(options.resolution.height, 720);
    });

    it("returns 360p for low quality", () => {
      const options = getVideoCaptureOptions("low");
      assert.equal(options.resolution.width, 640);
      assert.equal(options.resolution.height, 360);
    });

    it("defaults to 720p for auto quality", () => {
      const options = getVideoCaptureOptions("auto");
      assert.equal(options.resolution.width, 1280);
      assert.equal(options.resolution.height, 720);
    });

    it("defaults to auto when no quality provided", () => {
      const options = getVideoCaptureOptions();
      assert.equal(options.resolution.width, 1280);
      assert.equal(options.resolution.height, 720);
    });
  });

  describe("getSimulcastLayers", () => {
    it("returns three layers for high quality", () => {
      const layers = getSimulcastLayers("high");
      assert.equal(layers.length, 3);
    });

    it("returns two layers for medium quality", () => {
      const layers = getSimulcastLayers("medium");
      assert.equal(layers.length, 2);
    });

    it("returns empty array for low quality", () => {
      const layers = getSimulcastLayers("low");
      assert.equal(layers.length, 0);
    });

    it("returns two layers for auto quality", () => {
      const layers = getSimulcastLayers("auto");
      assert.equal(layers.length, 2);
    });
  });

  describe("getPreferredCodec", () => {
    it("returns h264 when hardware support is available", () => {
      const codec = getPreferredCodec(true);
      assert.equal(codec, "h264");
    });

    it("returns vp8 when hardware support is not available", () => {
      const codec = getPreferredCodec(false);
      assert.equal(codec, "vp8");
    });
  });

  describe("buildRoomOptions", () => {
    it("includes simulcast layers when enabled", () => {
      const options = buildRoomOptions({
        quality: "medium",
        enableSimulcast: true,
      });
      assert.ok(options.publishDefaults?.videoSimulcastLayers);
      assert.equal(options.publishDefaults?.videoSimulcastLayers?.length, 2);
    });

    it("excludes simulcast when disabled", () => {
      const options = buildRoomOptions({
        quality: "medium",
        enableSimulcast: false,
      });
      assert.equal(options.publishDefaults?.videoSimulcastLayers, undefined);
    });

    it("sets H264 codec when preferred", () => {
      const options = buildRoomOptions({
        preferH264: true,
      });
      assert.equal(options.publishDefaults?.videoCodec, "h264");
    });

    it("sets VP8 codec when H264 not preferred", () => {
      const options = buildRoomOptions({
        preferH264: false,
      });
      assert.equal(options.publishDefaults?.videoCodec, "vp8");
    });

    it("enables adaptive stream by default", () => {
      const options = buildRoomOptions();
      assert.equal(options.adaptiveStream, true);
    });

    it("enables dynacast by default", () => {
      const options = buildRoomOptions();
      assert.equal(options.dynacast, true);
    });

    it("enables DTX and RED for audio", () => {
      const options = buildRoomOptions();
      assert.equal(options.publishDefaults?.dtx, true);
      assert.equal(options.publishDefaults?.red, true);
    });
  });

  describe("getMediaConstraints", () => {
    it("includes resolution constraints for high quality", () => {
      const constraints = getMediaConstraints("high");
      const width = constraints.width as { ideal: number; max: number };
      const height = constraints.height as { ideal: number; max: number };
      assert.equal(width.ideal, 1920);
      assert.equal(height.ideal, 1080);
    });

    it("includes device ID when provided", () => {
      const constraints = getMediaConstraints("medium", "device123");
      assert.deepEqual(constraints.deviceId, { exact: "device123" });
    });

    it("omits device ID when not provided", () => {
      const constraints = getMediaConstraints("medium");
      assert.equal(constraints.deviceId, undefined);
    });

    it("sets max resolution limits", () => {
      const constraints = getMediaConstraints("high");
      const width = constraints.width as { ideal: number; max: number };
      const height = constraints.height as { ideal: number; max: number };
      assert.equal(width.max, 1920);
      assert.equal(height.max, 1080);
    });
  });
});

describe("LiveKit Fallback Handlers", () => {
  describe("determineBandwidthAction", () => {
    it("returns video_disabled below 200kbps", () => {
      const action = determineBandwidthAction(100_000);
      assert.equal(action.action, "video_disabled");
      assert.ok(action.reason?.includes("below minimum threshold"));
    });

    it("returns quality_reduced between 200-500kbps", () => {
      const action = determineBandwidthAction(300_000);
      assert.equal(action.action, "quality_reduced");
      assert.ok(action.reason?.includes("reducing quality"));
    });

    it("returns none above 500kbps", () => {
      const action = determineBandwidthAction(600_000);
      assert.equal(action.action, "none");
      assert.equal(action.reason, undefined);
    });

    it("uses correct threshold values", () => {
      assert.equal(BANDWIDTH_THRESHOLDS.LOW, 200_000);
      assert.equal(BANDWIDTH_THRESHOLDS.MEDIUM, 500_000);
    });

    it("handles exact threshold values", () => {
      // Exactly at low threshold should trigger video disabled
      const atLow = determineBandwidthAction(200_000);
      assert.equal(atLow.action, "quality_reduced");

      // Exactly at medium threshold should trigger none
      const atMedium = determineBandwidthAction(500_000);
      assert.equal(atMedium.action, "none");
    });
  });
});
