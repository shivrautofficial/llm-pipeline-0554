/**
 * LLM Pipeline Explorer - Educational Tokenizer
 * Splits text into tokens, maps to vocabulary IDs, assigns visual colors,
 * calculates character boundaries, and identifies subwords / OOV tokens.
 */

class EducationalTokenizer {
  constructor(state) {
    this.state = state;
    // Distinct visual palette for token badges in sequence
    this.tokenColors = [
      { bg: "rgba(139, 92, 246, 0.2)", border: "#8b5cf6", text: "#c4b5fd" }, // Purple
      { bg: "rgba(6, 182, 212, 0.2)", border: "#06b6d4", text: "#67e8f9" },  // Cyan
      { bg: "rgba(59, 130, 246, 0.2)", border: "#3b82f6", text: "#93c5fd" },  // Blue
      { bg: "rgba(16, 185, 129, 0.2)", border: "#10b981", text: "#6ee7b7" }, // Emerald
      { bg: "rgba(245, 158, 11, 0.2)", border: "#f59e0b", text: "#fcd34d" }, // Amber
      { bg: "rgba(236, 72, 153, 0.2)", border: "#ec4899", text: "#f472b6" }, // Pink
      { bg: "rgba(168, 85, 247, 0.2)", border: "#a855f7", text: "#d8b4fe" }, // Violet
      { bg: "rgba(244, 63, 94, 0.2)", border: "#f43f5e", text: "#fda4af" }   // Rose
    ];
  }

  /**
   * Tokenize input string into an array of token objects.
   * @param {string} text - Raw input text
   * @returns {Array} Array of token objects
   */
  tokenize(text) {
    if (!text || typeof text !== "string") {
      return [];
    }

    const tokens = [];
    // Tokenization regex matching:
    // 1. Words with optional apostrophe contractions (e.g., "don't", "we've")
    // 2. Special tags like <pad>, <unk>, <bos>, <eos>, <mask\>
    // 3. Numbers / digits
    // 4. Individual punctuation symbols
    // 5. Significant whitespace
    const tokenRegex = /<[a-z0-9_-]+>|[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?|[.,!?;:()\[\]{}"'\-—\/\\@#$%^&*+=<>~`]/g;

    let match;
    let index = 0;

    while ((match = tokenRegex.exec(text)) !== null) {
      const rawPiece = match[0];
      const start = match.index;
      const end = start + rawPiece.length;
      const lowerPiece = rawPiece.toLowerCase();

      // Check if word exists in vocabulary
      const vocabEntry = this.state.lookup(lowerPiece) || this.state.lookup(rawPiece);

      let tokenId = 1; // Default <unk>
      let isKnown = false;
      let category = "unknown";
      let status = "unknown";
      let subwordNote = null;

      if (vocabEntry) {
        tokenId = vocabEntry.id;
        isKnown = true;
        category = vocabEntry.category;
        status = vocabEntry.isCustom ? "custom" : "known";
      } else {
        // Check if punctuation
        if (/^[.,!?;:()\[\]{}"'\-—\/\\@#$%^&*+=<>~`]$/.test(rawPiece)) {
          // Punctuation token
          tokenId = 1; // Or represented as special punctuation
          status = "punctuation";
          category = "grammar";
          subwordNote = "Punctuation mark. In real LLMs like GPT-4, punctuation marks often form their own unique token IDs.";
        } else {
          // Word not found in base/custom vocabulary
          // Simulate subword fallback educational explanation
          status = "oov";
          category = "special";
          tokenId = 1; // <unk>
          subwordNote = `Out-of-vocabulary in this educational demo. In modern LLMs (e.g. Byte-Pair Encoding / BPE), "${rawPiece}" would be subdivided into smaller subword chunks or character bytes so it can still be processed without losing information.`;
        }
      }

      // Distinct visual color cycling
      const colorStyle = this.tokenColors[index % this.tokenColors.length];

      tokens.push({
        index: index,
        raw: rawPiece,
        normalized: lowerPiece,
        id: tokenId,
        isKnown: isKnown,
        status: status,
        category: category,
        start: start,
        end: end,
        color: colorStyle,
        vocabEntry: vocabEntry || null,
        subwordNote: subwordNote
      });

      index++;
    }

    return tokens;
  }

  /**
   * Calculate text statistics
   */
  getStats(text, tokens) {
    const charCount = text ? text.length : 0;
    const wordCount = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const tokenCount = tokens ? tokens.length : 0;
    const ratio = wordCount > 0 ? (tokenCount / wordCount).toFixed(2) : "1.00";

    const knownCount = tokens ? tokens.filter(t => t.isKnown).length : 0;
    const oovCount = tokens ? tokens.filter(t => t.status === "oov").length : 0;
    const punctCount = tokens ? tokens.filter(t => t.status === "punctuation").length : 0;

    return {
      charCount,
      wordCount,
      tokenCount,
      ratio,
      knownCount,
      oovCount,
      punctCount
    };
  }
}
