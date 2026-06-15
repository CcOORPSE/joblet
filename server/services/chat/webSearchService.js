import axios from "axios";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const stripHtml = (value = "") => value.replace(/<[^>]*>/g, "").trim();

const decodeDdgLink = (link) => {
  if (link.includes("//duckduckgo.com/l/?uddg=")) {
    const parts = link.split("uddg=");
    if (parts[1]) return decodeURIComponent(parts[1].split("&")[0]);
  }
  return link;
};

const parseHtmlResults = (html) => {
  const results = [];
  const linkMatches = [
    ...html.matchAll(/<a\s+class="result__a"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi),
  ];
  const snippetMatches = [
    ...html.matchAll(/<a\s+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi),
  ];

  const limit = Math.min(linkMatches.length, 6);
  for (let i = 0; i < limit; i++) {
    const title = stripHtml(linkMatches[i][2]);
    const link = decodeDdgLink(linkMatches[i][1]);
    const snippet = snippetMatches[i] ? stripHtml(snippetMatches[i][1]) : "";
    if (title && link) {
      results.push({ title, link, snippet, source: "DuckDuckGo" });
    }
  }

  return results;
};

const fetchDdgHtmlResults = async (query) => {
  const response = await axios.post(
    "https://html.duckduckgo.com/html/",
    new URLSearchParams({ q: query }).toString(),
    {
      headers: {
        "User-Agent": USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "text/html,application/xhtml+xml",
      },
      timeout: 8000,
      maxRedirects: 5,
    }
  );

  return parseHtmlResults(response.data || "");
};

const flattenDdgTopics = (topics = []) => {
  const flat = [];
  for (const topic of topics) {
    if (topic.Topics) flat.push(...flattenDdgTopics(topic.Topics));
    else if (topic.FirstURL && topic.Text) {
      flat.push({
        title: stripHtml(topic.Text),
        link: topic.FirstURL,
        snippet: stripHtml(topic.Text),
        source: "DuckDuckGo API",
      });
    }
  }
  return flat;
};

const fetchDdgInstantAnswerResults = async (query) => {
  const { data } = await axios.get("https://api.duckduckgo.com/", {
    params: { q: query, format: "json", no_html: 1, skip_disambig: 1 },
    timeout: 8000,
  });

  const results = [];

  if (data.AbstractText && data.AbstractURL) {
    results.push({
      title: data.Heading || query,
      link: data.AbstractURL,
      snippet: data.AbstractText,
      source: "DuckDuckGo API",
    });
  }

  for (const topic of flattenDdgTopics(data.RelatedTopics || []).slice(0, 5)) {
    if (!results.some((entry) => entry.link === topic.link)) {
      results.push(topic);
    }
  }

  if (data.Answer && data.AnswerType) {
    results.unshift({
      title: `${data.AnswerType} result`,
      link: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      snippet: data.Answer,
      source: "DuckDuckGo Instant Answer",
    });
  }

  return results;
};

const fetchGoogleResults = async (query) => {
  if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CSE_ID) return [];

  const apiKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}`;

  const { data } = await axios.get(googleUrl, { timeout: 8000 });
  if (!data?.items) return [];

  return data.items.slice(0, 5).map((item) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    source: "Google API",
  }));
};

const fetchWikipediaResults = async (query) => {
  const { data } = await axios.get("https://en.wikipedia.org/w/api.php", {
    params: {
      action: "query",
      list: "search",
      srsearch: query,
      format: "json",
      origin: "*",
      srlimit: 5,
    },
    headers: { "User-Agent": USER_AGENT },
    timeout: 8000,
  });

  const items = data?.query?.search || [];
  return items.map((item) => ({
    title: item.title,
    link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`,
    snippet: stripHtml(item.snippet),
    source: "Wikipedia",
  }));
};

/**
 * Fetch search results from DuckDuckGo and/or Google Custom Search API.
 * Does not use Gemini.
 * @param {string} query
 * @returns {Promise<Array<{title: string, link: string, snippet?: string, source?: string}>>}
 */
export const fetchWebSearchResults = async (query) => {
  const results = [];

  try {
    const htmlResults = await fetchDdgHtmlResults(query);
    results.push(...htmlResults);
  } catch (error) {
    console.error("DuckDuckGo HTML search error:", error.message);
  }

  if (results.length === 0) {
    const simplified = query.replace(/latest|features|in|the|for|about/gi, " ").trim() || query;
    try {
      const apiResults = await fetchDdgInstantAnswerResults(simplified);
      results.push(...apiResults);
    } catch (error) {
      console.error("DuckDuckGo API search error:", error.message);
    }
  }

  if (results.length === 0) {
    try {
      const wikiResults = await fetchWikipediaResults(query);
      results.push(...wikiResults);
    } catch (error) {
      console.error("Wikipedia search error:", error.message);
    }
  }

  try {
    const googleResults = await fetchGoogleResults(query);
    for (const item of googleResults) {
      if (!results.some((entry) => entry.link === item.link)) {
        results.push(item);
      }
    }
  } catch (error) {
    console.error("Google Custom Search API error:", error.message);
  }

  return results.slice(0, 8);
};
