export type Category = 'social' | 'article' | 'academic' | 'ai' | 'other';

interface CategoryConfig {
    color: string;
    textColor: string;
    borderColor: string;
    label: string;
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
    social: {
        color: 'var(--cat-social-bg)',
        textColor: 'var(--cat-social-text)',
        borderColor: 'var(--cat-social-border)',
        label: 'Social Media'
    },
    article: {
        color: 'var(--cat-article-bg)',
        textColor: 'var(--cat-article-text)',
        borderColor: 'var(--cat-article-border)',
        label: 'Article'
    },
    academic: {
        color: 'var(--cat-academic-bg)',
        textColor: 'var(--cat-academic-text)',
        borderColor: 'var(--cat-academic-border)',
        label: 'Academic/Wiki'
    },
    ai: {
        color: 'var(--cat-ai-bg)',
        textColor: 'var(--cat-ai-text)',
        borderColor: 'var(--cat-ai-border)',
        label: 'AI Tool'
    },
    other: {
        color: 'var(--cat-other-bg)',
        textColor: 'var(--cat-other-text)',
        borderColor: 'var(--cat-other-border)',
        label: 'Web'
    }
};

export function getCategoryFromUrl(urlStr: string): Category {
    try {
        const hostname = new URL(urlStr).hostname.toLowerCase();

        // Social Media
        if (['twitter.com', 'x.com', 'linkedin.com', 'reddit.com', 'instagram.com', 'facebook.com', 'threads.net', 'tiktok.com', 'youtube.com', 'youtu.be'].some(d => hostname.includes(d))) {
            return 'social';
        }

        // AI Tools
        if (['chatgpt.com', 'openai.com', 'claude.ai', 'gemini.google.com', 'bard.google.com', 'perplexity.ai'].some(d => hostname.includes(d))) {
            return 'ai';
        }

        // Academic & Wiki
        if (['wikipedia.org', 'arxiv.org', 'scholar.google.com', 'notion.so'].some(d => hostname.includes(d))) {
            return 'academic';
        }

        // Article/News sites (Expanded list for common case studies/blogs)
        if (['medium.com', 'substack.com', 'nytimes.com', 'bbc.com', 'cnn.com', 'dev.to', 'towardsdatascience.com', 'uxdesign.cc', 'uxplanet.org', 'hackernoon.com', 'hashnode.com', 'freecodecamp.org', 'smashingmagazine.com'].some(d => hostname.includes(d))) {
            return 'article';
        }

        // Everything else falls to 'other'
        return 'other';
    } catch (e) {
        return 'other';
    }
}

export function getCategoryStyles(url: string) {
    const category = getCategoryFromUrl(url);
    return CATEGORY_CONFIG[category];
}
