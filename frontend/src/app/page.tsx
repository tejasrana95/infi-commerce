import { getComponent } from "../components/templates/registry";
import { fetchStoreByDomain, fetchStoreConfig } from "../lib/api";
import { headers } from "next/headers";

export default async function Home() {
  // Fetch data on the server
  const headersList = await headers();
  const domain = headersList.get('host') || 'localhost:3000';


  let store = await fetchStoreByDomain(domain);

  if (!store && domain.includes('localhost')) {
    const fallbackId = '675bd1d5334c9f136d8849b2';
    store = await fetchStoreConfig(fallbackId);
  }

  const templateId = store?.theme?.templateId || 'modern-clean';

  const Header = getComponent('Header', templateId);

  return (
    <div className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Infi-Commerce</h1>
        <p className="mb-4">
          This page is <strong>Server-Side Rendered (SSR)</strong>.
          The template <strong>{templateId}</strong> was resolved on the server.
        </p>
        <div className="p-4 bg-gray-50 rounded border">
          <h2 className="font-bold mb-2">SEO Check:</h2>
          <ul className="list-disc pl-5 text-sm">
            <li>View Page Source to verify the Header implementation is in the initial HTML.</li>
            <li>No "use client" directive is used on this page.</li>
          </ul>
        </div>
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}