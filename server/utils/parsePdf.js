import { PDFParse } from "pdf-parse";

export async function parsePdfBuffer(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return {
      text: result.text || "",
      numpages: result.total || result.pages?.length || 1,
    };
  } finally {
    await parser.destroy();
  }
}
