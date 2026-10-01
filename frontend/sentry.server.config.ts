import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Adjust this value in production, or use imports for finer control
    // 1.0 traced every request server-side — 10% is plenty for signal.
    tracesSampleRate: 0.1,

    // Setting this option to true will print useful information to the console during SDK initialization.
    debug: false,
  });
}
