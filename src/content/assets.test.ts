import { describe, expect, it } from "vitest";
import { ASSETS } from "./assets";

/**
 * Smoke test: asset map paths are relative and rooted under the public
 * assets directory.
 *
 * Validates: Requirements 14.1, 14.2
 */
describe("ASSETS map", () => {
  const allPaths = [
    ASSETS.logo.light,
    ASSETS.logo.dark,
    ASSETS.logo.footer,
    ASSETS.video.background,
    ASSETS.video.imersao,
    ASSETS.video.evento,
    ASSETS.video.navecon,
    ASSETS.gallery.ambient1,
    ASSETS.gallery.ambient2,
  ];

  it("roots every path under the public assets directory", () => {
    for (const path of allPaths) {
      expect(path.startsWith("/assets/")).toBe(true);
    }
  });

  it("uses no absolute URLs (paths are project-relative to the public root)", () => {
    for (const path of allPaths) {
      expect(/^https?:\/\//.test(path)).toBe(false);
    }
  });

  it("uses lowercase, hyphenated, space-free file names", () => {
    for (const path of allPaths) {
      expect(path).not.toMatch(/\s/);
      expect(path).toBe(path.toLowerCase());
    }
  });

  it("maps each asset to its expected renamed destination", () => {
    expect(ASSETS.logo.light).toBe("/assets/logo/icon-light.png");
    expect(ASSETS.logo.dark).toBe("/assets/logo/icon-dark.png");
    expect(ASSETS.logo.footer).toBe("/assets/logo/logo-footer.png");
    expect(ASSETS.video.background).toBe("/assets/video/background.mp4");
    expect(ASSETS.video.imersao).toBe("/assets/video/imersao.mp4");
    expect(ASSETS.video.evento).toBe("/assets/video/evento.mp4");
    expect(ASSETS.video.navecon).toBe("/assets/video/navecon.mp4");
    expect(ASSETS.gallery.ambient1).toBe("/assets/gallery/ambient-1.jpeg");
    expect(ASSETS.gallery.ambient2).toBe("/assets/gallery/ambient-2.jpeg");
  });
});
