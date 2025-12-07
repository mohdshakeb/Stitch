export type Category = 'social' | 'article' | 'academic' | 'ai' | 'other';

interface CategoryConfig {
    color: string;
    textColor: string;
    borderColor: string;
    label: string;
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
    social: {
        color: '#fef3c7', // Yellow
        textColor: '#451a03',
        borderColor: '#fcd34d',
        label: 'Social Media'
    },
    article: {
        color: '#dcfce7', // Green
        textColor: '#14532d',
        borderColor: '#86efac',
        label: 'Article'
    },
    academic: {
        color: '#f3e8ff', // Purple
        textColor: '#581c87',
        borderColor: '#d8b4fe',
        label: 'Academic/Wiki'
    },
    ai: {
        color: '#dbeafe', // Blue (repurposed from video)
        textColor: '#1e3a8a',
        borderColor: '#93c5fd',
        label: 'AI Tool'
    },
    other: {
        color: '#f3f4f6', // Grey for generic web content
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
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

        // Article/News sites (Specific list or patterns if needed, otherwise fall to other)
        if (['medium.com', 'substack.com', 'nytimes.com', 'bbc.com', 'cnn.com', 'dev.to'].some(d => hostname.includes(d))) {
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
