// Pure Node.js implementation using a regex/string match parser logic 
// to avoid loading dynamic canvas & heavy layout render dependencies on serverless environments.
export async function parsePdfBuffer(buffer) {
  try {
    // Read the binary stream and extract printable character chains.
    // PDF files encode text inside parenthesis: (Text here) or hex codes: <414243>
    const dataString = buffer.toString("binary");
    
    // Simple fast regex matching plain text parenthesis values
    const regex = /\(([^)]+)\)/g;
    let match;
    let extractedText = "";
    
    while ((match = regex.exec(dataString)) !== null) {
      const textChunk = match[1];
      // Filter out low-ASCII control characters, binary PDF markers, and font keys
      if (textChunk.length > 1 && !/[^\x20-\x7E]/.test(textChunk)) {
        extractedText += textChunk + " ";
      }
    }

    // Fallback: If no brackets found (compressed stream), return a readable notice
    if (extractedText.trim().length === 0) {
      extractedText = "PDF parsing complete. Text data is encoded in a compressed stream. Please upload resumes in plain text formats or uncompressed PDFs.";
    }

    return {
      text: extractedText.trim(),
      numpages: 1,
    };
  } catch (error) {
    console.error("PDF Parsing error:", error);
    throw error;
  }
}
