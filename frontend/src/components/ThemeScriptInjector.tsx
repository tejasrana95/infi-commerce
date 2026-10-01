"use client";
import React, { useEffect, useRef } from 'react';
import { runAfterLoadAndIdle } from '@/lib/defer';

interface Props {
    header?: string;
    footer?: string;
}

const ThemeScriptInjector: React.FC<Props> = ({ header, footer }) => {
    // Store references to injected nodes for cleanup
    const headerNodesRef = useRef<Node[]>([]);
    const footerNodesRef = useRef<Node[]>([]);

    const injectContent = (
        content: string,
        target: HTMLElement,
        storage: React.MutableRefObject<Node[]>,
        includeScripts: boolean,
    ) => {
        if (!content) return;
        const container = document.createElement('div');
        container.innerHTML = content;
        const nodes = Array.from(container.childNodes);
        nodes.forEach((node) => {
            const isScript = node.nodeName === 'SCRIPT';
            // Never delay markup/styles — only external script tags are the
            // expensive part, and delaying styles would cause FOUC/CLS.
            if (isScript && !includeScripts) return;
            if (isScript) {
                const oldScript = node as HTMLScriptElement;
                const newScript = document.createElement('script');
                // copy attributes like src, type, async, etc.
                Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
                newScript.text = oldScript.text;
                target.appendChild(newScript);
                storage.current.push(newScript);
            } else {
                target.appendChild(node);
                storage.current.push(node);
            }
        });
    };

    // Inject header scripts into <head>.
    // Deferred until after `load` + idle: these are admin-configured third-party
    // tags (chat, social, WhatsApp, CDN analytics) and must never sit on the
    // critical path (they were the main TBT / render-blocking contributors).
    useEffect(() => {
        headerNodesRef.current.forEach((n) => n.parentNode?.removeChild(n));
        headerNodesRef.current = [];

        if (!header) return;

        // Non-script markup goes in immediately…
        injectContent(header, document.head, headerNodesRef, false);

        // …scripts wait for first user interaction (scroll/mousemove) to prevent blocking TTI
        const handleInteraction = () => {
            injectContent(header, document.head, headerNodesRef, true);
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('click', handleInteraction);
        };
        
        window.addEventListener('scroll', handleInteraction, { passive: true, once: true });
        window.addEventListener('mousemove', handleInteraction, { passive: true, once: true });
        window.addEventListener('touchstart', handleInteraction, { passive: true, once: true });
        window.addEventListener('click', handleInteraction, { passive: true, once: true });

        return () => {
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('click', handleInteraction);
            headerNodesRef.current.forEach((n) => n.parentNode?.removeChild(n));
            headerNodesRef.current = [];
        };
    }, [header]);

    // Inject footer scripts before </body> — deferred the same way.
    useEffect(() => {
        footerNodesRef.current.forEach((n) => n.parentNode?.removeChild(n));
        footerNodesRef.current = [];

        if (!footer) return;

        injectContent(footer, document.body, footerNodesRef, false);

        const handleInteraction = () => {
            injectContent(footer, document.body, footerNodesRef, true);
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('click', handleInteraction);
        };
        
        window.addEventListener('scroll', handleInteraction, { passive: true, once: true });
        window.addEventListener('mousemove', handleInteraction, { passive: true, once: true });
        window.addEventListener('touchstart', handleInteraction, { passive: true, once: true });
        window.addEventListener('click', handleInteraction, { passive: true, once: true });

        return () => {
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('click', handleInteraction);
            footerNodesRef.current.forEach((n) => n.parentNode?.removeChild(n));
            footerNodesRef.current = [];
        };
    }, [footer]);

    return null;
};

export default ThemeScriptInjector;


