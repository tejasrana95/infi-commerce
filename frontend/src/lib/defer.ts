// ============================================================
// Deferred third-party loading
// ------------------------------------------------------------
// Third-party tags (chat widgets, analytics, social/WhatsApp widgets,
// injected theme scripts) are pure overhead for Core Web Vitals: they
// parse + execute on the main thread and inflate TBT/LCP.
//
// These helpers keep them OFF the critical path:
//   * `runAfterLoadAndIdle`  — runs once the page has fully loaded AND the
//     browser is idle (or after a timeout as a safety net).
//   * `runOnFirstInteractionOrIdle` — for heavier widgets that should only
//     appear when the user actually engages with the page.
//
// Both return a cancel function so effects can clean up.
// ============================================================

type Task = () => void;

/** Safety net so the task still runs on pages that never go idle. */
const IDLE_TIMEOUT_MS = 4000;

function scheduleOnIdle(task: Task): void {
    const idleWindow = window as Window & {
        requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
    };

    if (typeof idleWindow.requestIdleCallback === 'function') {
        idleWindow.requestIdleCallback(task, { timeout: IDLE_TIMEOUT_MS });
    } else {
        window.setTimeout(task, 200);
    }
}

/**
 * Run `task` after the window `load` event, then on the first idle frame.
 * Safe to call during SSR (no-ops).
 */
export function runAfterLoadAndIdle(task: Task): () => void {
    if (typeof window === 'undefined') return () => {};

    let cancelled = false;

    const run = () => {
        if (cancelled) return;
        scheduleOnIdle(() => {
            if (!cancelled) task();
        });
    };

    if (document.readyState === 'complete') {
        run();
        return () => {
            cancelled = true;
        };
    }

    window.addEventListener('load', run, { once: true });
    return () => {
        cancelled = true;
        window.removeEventListener('load', run);
    };
}

const INTERACTION_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'mousemove'] as const;

/**
 * Run `task` on the first real user interaction, or after load+idle —
 * whichever comes first. Use for widgets nobody needs on first paint.
 */
export function runOnFirstInteractionOrIdle(task: Task): () => void {
    if (typeof window === 'undefined') return () => {};

    let cancelled = false;
    let done = false;

    const run = () => {
        if (cancelled || done) return;
        done = true;
        INTERACTION_EVENTS.forEach((evt) => window.removeEventListener(evt, run));
        task();
    };

    const cancelIdle = runAfterLoadAndIdle(run);

    INTERACTION_EVENTS.forEach((evt) =>
        window.addEventListener(evt, run, { once: true, passive: true })
    );

    return () => {
        cancelled = true;
        cancelIdle();
        INTERACTION_EVENTS.forEach((evt) => window.removeEventListener(evt, run));
    };
}
