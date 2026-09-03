import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classifyDevice, isDeviceClass } from "./classifyDevice";

const IPADOS_DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

describe("classifyDevice", () => {
  it("detects iPhone from mobile Safari UA", () => {
    assert.equal(
      classifyDevice({
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      }),
      "iphone",
    );
  });

  it("detects classic iPad UA", () => {
    assert.equal(
      classifyDevice({
        userAgent:
          "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      }),
      "ipad",
    );
  });

  it("treats Macintosh + touch as iPad (iPadOS 13+)", () => {
    assert.equal(
      classifyDevice({
        userAgent: IPADOS_DESKTOP_UA,
        platform: "MacIntel",
        maxTouchPoints: 5,
      }),
      "ipad",
    );
  });

  it("treats Macintosh without touch as Mac", () => {
    assert.equal(
      classifyDevice({
        userAgent: IPADOS_DESKTOP_UA,
        platform: "MacIntel",
        maxTouchPoints: 0,
      }),
      "mac",
    );
  });

  it("detects Android phones vs Android tablets vs Windows PCs", () => {
    assert.equal(
      classifyDevice({
        userAgent:
          "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
      }),
      "android",
    );
    assert.equal(
      classifyDevice({
        userAgent:
          "Mozilla/5.0 (Linux; Android 13; SM-X810) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }),
      "android_tablet",
    );
    assert.equal(
      classifyDevice({
        userAgent:
          "Mozilla/5.0 (Linux; Android 12; Lenovo TB-X606F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Tablet",
      }),
      "android_tablet",
    );
    assert.equal(
      classifyDevice({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        platform: "Win32",
      }),
      "windows",
    );
  });

  it("falls back to other for Linux desktops and unknown clients", () => {
    assert.equal(
      classifyDevice({
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        platform: "Linux x86_64",
      }),
      "other",
    );
    assert.equal(
      classifyDevice({ userAgent: "curl/8.0.1", platform: "" }),
      "other",
    );
  });

  it("validates device class tokens", () => {
    assert.equal(isDeviceClass("mac"), true);
    assert.equal(isDeviceClass("ipad"), true);
    assert.equal(isDeviceClass("android_tablet"), true);
    assert.equal(isDeviceClass("tablet"), false);
  });
});
