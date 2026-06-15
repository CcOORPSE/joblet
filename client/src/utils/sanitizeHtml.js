import DOMPurify from "dompurify";

/** Sanitize HTML before rendering with dangerouslySetInnerHTML. */
export const sanitizeHtml = (dirty) => {
  if (!dirty) return "";
  
  // If it doesn't look like HTML but contains markdown markers, format it first
  let html = dirty;
  if (!/<[a-z][\s\S]*>/i.test(dirty)) {
    // Escape simple entities
    const escaped = dirty
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
      
    // Apply basic markdown conversions
    html = escaped
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/^### (.+)$/gm, '<h4 class="font-bold text-lg mt-4 mb-2 text-slate-800">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="font-bold text-xl mt-5 mb-3 text-slate-800">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 class="font-bold text-2xl mt-6 mb-3 text-slate-800">$1</h2>')
      .replace(/^[-*] (.+)$/gm, '<li class="ml-5 list-disc my-1.5 text-slate-700">$1</li>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-blue-600 hover:text-blue-500">$1</a>')
      .replace(/\n/g, "<br/>");
  }

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });
};

/** Escape plain text then apply simple markdown formatting for chat messages. */
export const formatMarkdownSafe = (text) => {
  if (!text) return "";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.+)$/gm, '<h4 class="font-bold mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold mt-3 mb-1">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="font-bold mt-3 mb-1">$1</h2>')
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline text-blue-500 hover:text-blue-600">$1</a>')
    .replace(/\n/g, "<br/>");
};
