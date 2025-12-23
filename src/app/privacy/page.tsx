import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="container mx-auto max-w-2xl px-4 py-12 font-sans">
            <header className="mb-12">
                <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">Privacy Policy</h1>
                <p className="text-[hsl(var(--muted))]">Last updated: December 23, 2024</p>
            </header>

            <div className="prose prose-stone dark:prose-invert">
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Introduction</h2>
                    <p className="text-[hsl(var(--foreground))] leading-relaxed mb-4">
                        Stitch ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we handle your data when you use the Stitch browser extension and web application.
                    </p>
                    <p className="text-[hsl(var(--foreground))] leading-relaxed">
                        **In short: We do not sell your data, we do not track your browsing history, and your highlights are yours.**
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Data We Collect</h2>
                    <ul className="list-disc pl-5 space-y-2 text-[hsl(var(--foreground))]">
                        <li>
                            <strong>Snippets:</strong> When you actively choose to save a snippet, we store the selected text, the page title, and the page URL.
                        </li>
                        <li>
                            <strong>Local Storage:</strong> Your data is primarily stored locally on your device using browser storage technologies (Chrome Storage API, LocalStorage).
                        </li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">How We Use Your Data</h2>
                    <p className="text-[hsl(var(--foreground))] leading-relaxed">
                        We use the data solely to provide the core functionality of the application: allowing you to save, view, and organize your text highlights. We do not use your data for advertising or marketing purposes.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Third-Party Services</h2>
                    <p className="text-[hsl(var(--foreground))] leading-relaxed">
                        We host our web application on Vercel. Please refer to Vercel's privacy policy for details on their data handling practices regarding server logs and hosting metrics.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Contact</h2>
                    <p className="text-[hsl(var(--foreground))] leading-relaxed">
                        If you have any questions about this Privacy Policy, please contact us.
                    </p>
                </section>
            </div>
        </div>
    );
}
