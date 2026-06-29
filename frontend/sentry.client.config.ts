import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Adjust this value in production, or use imports for finer control
    tracesSampleRate: 1.0,

    // Setting this option to true will print useful information to the console during SDK initialization.
    debug: false,

    replaysOnErrorSampleRate: 1.0,
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample less in production
    replaysSessionSampleRate: 0.1,

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
