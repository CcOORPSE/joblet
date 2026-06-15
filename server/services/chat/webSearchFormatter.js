/**
 * Format web search results without requiring Gemini.
 * @param {string} query
 * @param {Array<{title: string, link: string, snippet?: string, source?: string}>} results
 */
export const formatWebSearchResponse = (query, results) => {
  if (!results || results.length === 0) {
    return "Sorry, I couldn't fetch any web search results for your query at this time. Please try a different query.";
  }

  let response = `**Web Search Results for:** "${query}"\n\n`;

  results.forEach((result, index) => {
    response += `**[${index + 1}] ${result.title}**\n`;
    if (result.snippet) response += `${result.snippet}\n`;
    response += `[Read more](${result.link})`;
    if (result.source) response += ` · _${result.source}_`;
    response += "\n\n";
  });

  response += "---\n**Sources:**\n";
  results.forEach((result, index) => {
    response += `- [${index + 1}] [${result.title}](${result.link})\n`;
  });

  return response.trim();
};
