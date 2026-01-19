export interface NewsItem {
    title: string;
    url: string;
    content: string;
}

/**
 * Searches for news relevant to the user's industry/topics.
 */
export async function fetchRelevantNews(query: string): Promise<NewsItem[]> {
    if (!process.env.TAVILY_API_KEY) {
        console.warn("TAVILY_API_KEY missing, skipping news fetch");
        return [];
    }

    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: process.env.TAVILY_API_KEY,
                query: `noticias recientes e interesantes sobre: ${query}`,
                search_depth: "basic",
                include_images: false,
                include_answer: false,
                max_results: 3,
            }),
        });

        if (!response.ok) {
            console.error("Tavily API error", await response.text());
            return [];
        }

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("Failed to fetch news:", error);
        return [];
    }
}
