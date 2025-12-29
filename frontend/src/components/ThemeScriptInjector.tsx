"use client";
import React, { useEffect, useRef } from 'react';

interface Props {
    header?: string;
    footer?: string;
}

const ThemeScriptInjector: React.FC<Props> = ({ header, footer }) => {
    // Store references to injected nodes for cleanup
    const headerNodesRef = useRef<Node[]>([]);
    const footerNodesRef = useRef<Node[]>([]);

    const injectContent = (content: string, target: HTMLElement, storage: React.MutableRefObject<Node[]>) => {
        if (!content) return;
        const container = document.createElement('div');
        container.innerHTML = content;
        const nodes = Array.from(container.childNodes);
        nodes.forEach((node) => {
            if (node.nodeName === 'SCRIPT') {
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

    // Inject header scripts into <head>
    useEffect(() => {
        // Cleanup previous nodes if any
        headerNodesRef.current.forEach((n) => n.parentNode?.removeChild(n));
        headerNodesRef.current = [];
        if (header) {
            injectContent(header, document.head, headerNodesRef);
        }
        return () => {
            headerNodesRef.current.forEach((n) => n.parentNode?.removeChild(n));
            headerNodesRef.current = [];
        };
    }, [header]);

    // Inject footer scripts before </body>
    useEffect(() => {
        footerNodesRef.current.forEach((n) => n.parentNode?.removeChild(n));
        footerNodesRef.current = [];
        if (footer) {
            injectContent(footer, document.body, footerNodesRef);
        }
        return () => {
            footerNodesRef.current.forEach((n) => n.parentNode?.removeChild(n));
            footerNodesRef.current = [];
        };
    }, [footer]);

    return null;
};

export default ThemeScriptInjector;


