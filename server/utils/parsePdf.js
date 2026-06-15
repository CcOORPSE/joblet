import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

// Set up PDF.js worker for Node.js environment
const pdfjs = pdfjsLib.getDocument;

export async function parsePdfBuffer(buffer) {
  try {
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let text = "";
    let numpages = pdf.numPages;

    // Extract text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      text += pageText + "\n";
    }

    return {
      text: text.trim() || "",
      numpages: numpages || 1,
    };
  } catch (error) {
    console.error("PDF Parsing error:", error);
    throw error;
  }
}
