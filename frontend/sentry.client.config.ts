import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Adjust this value in production, or use imports for finer control
    // 1.0 traces every navigation/request — far too expensive on the client.
    tracesSampleRate: 0.1,

    // Setting this option to true will print useful information to the console during SDK initialization.
    debug: false,

    // Session Replay disabled. These MUST stay the literal 0: Sentry's build
    // plugin only tree-shakes the Replay SDK (~1MB+ of client JS) when it can
    // statically read both as 0. Enabling it trades a lot of LCP/TBT for video.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // Ignore known third-party widget errors and scripts to reduce Sentry noise
    ignoreErrors: [
      'Unable to store cookie',
      // Hydration errors (Next.js / React)
      /hydration/i,
      /initial UI does not match/i,
      /text content does not match/i,
      /did not match/i,
      /reactjs\.org\/docs\/error-decoder\.html\?invariant=(418|423|425)/i,
    ],
    denyUrls: [
      /tawk\.to/i,
    ],
  });
}
