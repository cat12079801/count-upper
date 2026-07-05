// iOS(Safari) の standalone 起動時のスプラッシュ画面。iOS は manifest を使わず
// apple-touch-startup-image をデバイス解像度ごとに指定する必要がある。
// React 19 が <link> を <head> へ自動ホイストする。

type Spec = { w: number; h: number; dpr: number };

// portrait のみ（主要 iPhone + iPad）。w/h は CSS px、画像は w*dpr × h*dpr。
const SPECS: Spec[] = [
  { w: 320, h: 568, dpr: 2 },
  { w: 375, h: 667, dpr: 2 },
  { w: 414, h: 736, dpr: 3 },
  { w: 375, h: 812, dpr: 3 },
  { w: 414, h: 896, dpr: 2 },
  { w: 414, h: 896, dpr: 3 },
  { w: 390, h: 844, dpr: 3 },
  { w: 428, h: 926, dpr: 3 },
  { w: 393, h: 852, dpr: 3 },
  { w: 430, h: 932, dpr: 3 },
  { w: 402, h: 874, dpr: 3 },
  { w: 440, h: 956, dpr: 3 },
  { w: 768, h: 1024, dpr: 2 },
  { w: 820, h: 1180, dpr: 2 },
  { w: 834, h: 1194, dpr: 2 },
  { w: 1024, h: 1366, dpr: 2 },
];

export function AppleSplashLinks() {
  return (
    <>
      {SPECS.map(({ w, h, dpr }) => {
        const px = `${w * dpr}x${h * dpr}`;
        const media =
          `(device-width: ${w}px) and (device-height: ${h}px) and ` +
          `(-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`;
        return (
          <link
            key={px}
            rel="apple-touch-startup-image"
            media={media}
            href={`/splash/splash-${px}.png`}
          />
        );
      })}
    </>
  );
}
