/**
 * LLM Pipeline Explorer - Configuration & Baseline Data
 * Defines categories, initial baseline vocabulary with semantic clusters,
 * special tokens, presets, and educational content.
 */

const CONFIG = {
  APP_NAME: "LLM Pipeline Explorer",
  VERSION: "1.0.0",
  STORAGE_KEYS: {
    CUSTOM_VOCAB: "llm_pipeline_custom_vocab_v1",
    HISTORY: "llm_pipeline_history_v1",
    SETTINGS: "llm_pipeline_settings_v1",
    STATS: "llm_pipeline_stats_v1"
  },
  DEFAULT_EMBEDDING_DIM: 16, // Educational d_model (Production LLMs use 768 to 12288)
  CATEGORIES: {
    special: { name: "Special Tokens", color: "#ec4899", desc: "Control tokens (<pad>, <unk>, <bos>, <eos>, <mask>) used by LLM architectures." },
    grammar: { name: "Grammar & Stopwords", color: "#94a3b8", desc: "High-frequency function words that structure language syntax." },
    ai_tech: { name: "AI & Technology", color: "#38bdf8", desc: "Concepts related to computation, machine learning, and data science." },
    animals: { name: "Animals & Biology", color: "#34d399", desc: "Biological organisms and creatures exhibiting shared semantic traits." },
    royalty_human: { name: "Human & Royalty", color: "#f59e0b", desc: "Classic word analogy set (e.g. King - Man + Woman = Queen)." },
    verbs: { name: "Actions & Verbs", color: "#a855f7", desc: "Words describing physical and mental actions or processes." },
    adjectives: { name: "Qualities & Adjectives", color: "#fb7185", desc: "Descriptive modifiers of state, speed, scale, or appearance." },
    nature: { name: "Nature & Cosmos", color: "#10b981", desc: "Elements of the physical world, terrain, and celestial phenomena." },
    custom: { name: "Custom Added Words", color: "#eab308", desc: "Words dynamically inserted by the user into the local vocabulary dictionary." }
  },
  PRESETS: [
    {
      title: "The Classic Pangram",
      text: "The quick brown fox jumps over the lazy dog."
    },
    {
      title: "Seminal AI Paper",
      text: "Attention is all you need for deep neural networks."
    },
    {
      title: "Vector Analogies",
      text: "King and queen rule the royal kingdom with power."
    },
    {
      title: "Language Models",
      text: "Large language models transform text into vector embeddings."
    },
    {
      title: "Nature & Animals",
      text: "A smart wolf and wild fox run through the dark forest."
    }
  ],
  // Baseline initial vocabulary (approx. 110 words across diverse semantic domains)
  BASE_VOCABULARY: [
    // Special tokens (IDs 0 - 4)
    { id: 0, word: "<pad>", category: "special", freq: 12000, baseCoords: [0, 0, 0], special: true },
    { id: 1, word: "<unk>", category: "special", freq: 8500, baseCoords: [0, 2, 0], special: true },
    { id: 2, word: "<bos>", category: "special", freq: 15400, baseCoords: [0, 4, 0], special: true },
    { id: 3, word: "<eos>", category: "special", freq: 15400, baseCoords: [0, -4, 0], special: true },
    { id: 4, word: "<mask>", category: "special", freq: 4200, baseCoords: [0, -2, 0], special: true },

    // Grammar & Stopwords (IDs 5 - 24)
    { id: 5, word: "the", category: "grammar", freq: 89000, baseCoords: [-15, -2, 2] },
    { id: 6, word: "a", category: "grammar", freq: 72000, baseCoords: [-14, -1, 3] },
    { id: 7, word: "an", category: "grammar", freq: 28000, baseCoords: [-14, -3, 2] },
    { id: 8, word: "and", category: "grammar", freq: 65000, baseCoords: [-16, 0, -2] },
    { id: 9, word: "or", category: "grammar", freq: 31000, baseCoords: [-15, 1, -3] },
    { id: 10, word: "is", category: "grammar", freq: 58000, baseCoords: [-12, -4, 0] },
    { id: 11, word: "are", category: "grammar", freq: 41000, baseCoords: [-12, -5, 1] },
    { id: 12, word: "was", category: "grammar", freq: 39000, baseCoords: [-13, -4, -1] },
    { id: 13, word: "in", category: "grammar", freq: 55000, baseCoords: [-16, 3, 2] },
    { id: 14, word: "on", category: "grammar", freq: 42000, baseCoords: [-15, 4, 1] },
    { id: 15, word: "at", category: "grammar", freq: 36000, baseCoords: [-15, 2, 3] },
    { id: 16, word: "to", category: "grammar", freq: 61000, baseCoords: [-17, -1, 0] },
    { id: 17, word: "for", category: "grammar", freq: 48000, baseCoords: [-16, -2, -1] },
    { id: 18, word: "with", category: "grammar", freq: 43000, baseCoords: [-14, 2, -2] },
    { id: 19, word: "by", category: "grammar", freq: 32000, baseCoords: [-13, 3, -1] },
    { id: 20, word: "of", category: "grammar", freq: 67000, baseCoords: [-17, 1, 1] },
    { id: 21, word: "over", category: "grammar", freq: 22000, baseCoords: [-14, 5, 0] },
    { id: 22, word: "under", category: "grammar", freq: 19000, baseCoords: [-14, -5, 0] },
    { id: 23, word: "all", category: "grammar", freq: 29000, baseCoords: [-11, 0, 3] },
    { id: 24, word: "this", category: "grammar", freq: 38000, baseCoords: [-13, 0, 2] },

    // AI & Technology (IDs 25 - 42)
    { id: 25, word: "ai", category: "ai_tech", freq: 24500, baseCoords: [18, 12, 10] },
    { id: 26, word: "artificial", category: "ai_tech", freq: 19200, baseCoords: [17, 14, 8] },
    { id: 27, word: "intelligence", category: "ai_tech", freq: 21800, baseCoords: [19, 13, 9] },
    { id: 28, word: "neural", category: "ai_tech", freq: 23100, baseCoords: [16, 11, 14] },
    { id: 29, word: "network", category: "ai_tech", freq: 27400, baseCoords: [15, 10, 13] },
    { id: 30, word: "networks", category: "ai_tech", freq: 24300, baseCoords: [15.5, 10.2, 13.5] },
    { id: 31, word: "transformer", category: "ai_tech", freq: 18700, baseCoords: [20, 15, 12] },
    { id: 32, word: "attention", category: "ai_tech", freq: 22000, baseCoords: [18, 16, 14] },
    { id: 33, word: "token", category: "ai_tech", freq: 16500, baseCoords: [14, 13, 7] },
    { id: 34, word: "tokens", category: "ai_tech", freq: 15900, baseCoords: [14.5, 13.2, 7.3] },
    { id: 35, word: "vector", category: "ai_tech", freq: 17200, baseCoords: [16, 8, 9] },
    { id: 36, word: "embedding", category: "ai_tech", freq: 19800, baseCoords: [17, 9, 11] },
    { id: 37, word: "embeddings", category: "ai_tech", freq: 18500, baseCoords: [17.5, 9.2, 11.4] },
    { id: 38, word: "model", category: "ai_tech", freq: 31000, baseCoords: [19, 9, 7] },
    { id: 39, word: "models", category: "ai_tech", freq: 28900, baseCoords: [19.4, 9.3, 7.4] },
    { id: 40, word: "data", category: "ai_tech", freq: 36000, baseCoords: [13, 7, 8] },
    { id: 41, word: "algorithm", category: "ai_tech", freq: 20100, baseCoords: [16, 15, 6] },
    { id: 42, word: "compute", category: "ai_tech", freq: 18200, baseCoords: [12, 12, 12] },

    // Animals & Creatures (IDs 43 - 56)
    { id: 43, word: "fox", category: "animals", freq: 9400, baseCoords: [-10, 14, -12] },
    { id: 44, word: "dog", category: "animals", freq: 34000, baseCoords: [-8, 12, -14] },
    { id: 45, word: "cat", category: "animals", freq: 29000, baseCoords: [-9, 11, -15] },
    { id: 46, word: "wolf", category: "animals", freq: 11200, baseCoords: [-11, 15, -11] },
    { id: 47, word: "lion", category: "animals", freq: 14500, baseCoords: [-12, 16, -14] },
    { id: 48, word: "tiger", category: "animals", freq: 13200, baseCoords: [-13, 15, -13] },
    { id: 49, word: "bear", category: "animals", freq: 16800, baseCoords: [-10, 17, -10] },
    { id: 50, word: "rabbit", category: "animals", freq: 10400, baseCoords: [-7, 10, -13] },
    { id: 51, word: "bird", category: "animals", freq: 22000, baseCoords: [-6, 18, -16] },
    { id: 52, word: "eagle", category: "animals", freq: 8700, baseCoords: [-7, 19, -15] },
    { id: 53, word: "fish", category: "animals", freq: 24000, baseCoords: [-5, 8, -17] },
    { id: 54, word: "horse", category: "animals", freq: 19500, baseCoords: [-9, 13, -11] },
    { id: 55, word: "wild", category: "animals", freq: 15600, baseCoords: [-12, 13, -10] },
    { id: 56, word: "creature", category: "animals", freq: 9800, baseCoords: [-8, 14, -10] },

    // Human & Royalty (IDs 57 - 69)
    { id: 57, word: "king", category: "royalty_human", freq: 21500, baseCoords: [14, -14, -8] },
    { id: 58, word: "queen", category: "royalty_human", freq: 19800, baseCoords: [14, -14, -2] },
    { id: 59, word: "man", category: "royalty_human", freq: 44000, baseCoords: [10, -16, -8] },
    { id: 60, word: "woman", category: "royalty_human", freq: 42000, baseCoords: [10, -16, -2] },
    { id: 61, word: "prince", category: "royalty_human", freq: 12400, baseCoords: [12, -13, -7] },
    { id: 62, word: "princess", category: "royalty_human", freq: 11900, baseCoords: [12, -13, -3] },
    { id: 63, word: "royal", category: "royalty_human", freq: 15300, baseCoords: [15, -12, -5] },
    { id: 64, word: "kingdom", category: "royalty_human", freq: 13700, baseCoords: [16, -11, -6] },
    { id: 65, word: "crown", category: "royalty_human", freq: 10800, baseCoords: [15, -13, -4] },
    { id: 66, word: "leader", category: "royalty_human", freq: 23000, baseCoords: [8, -12, -6] },
    { id: 67, word: "people", category: "royalty_human", freq: 48000, baseCoords: [7, -15, -5] },
    { id: 68, word: "human", category: "royalty_human", freq: 35000, baseCoords: [9, -14, -4] },
    { id: 69, word: "power", category: "royalty_human", freq: 31000, baseCoords: [13, -10, -7] },

    // Verbs & Actions (IDs 70 - 86)
    { id: 70, word: "jumps", category: "verbs", freq: 8600, baseCoords: [2, 15, -4] },
    { id: 71, word: "jump", category: "verbs", freq: 11200, baseCoords: [2, 14, -4] },
    { id: 72, word: "run", category: "verbs", freq: 26000, baseCoords: [4, 16, -6] },
    { id: 73, word: "learn", category: "verbs", freq: 27500, baseCoords: [6, 8, 4] },
    { id: 74, word: "think", category: "verbs", freq: 33000, baseCoords: [5, 9, 6] },
    { id: 75, word: "create", category: "verbs", freq: 24800, baseCoords: [7, 7, 7] },
    { id: 76, word: "generates", category: "verbs", freq: 14200, baseCoords: [9, 8, 8] },
    { id: 77, word: "generate", category: "verbs", freq: 19100, baseCoords: [8.5, 7.8, 8] },
    { id: 78, word: "predict", category: "verbs", freq: 16400, baseCoords: [8, 10, 5] },
    { id: 79, word: "transform", category: "verbs", freq: 15300, baseCoords: [10, 9, 6] },
    { id: 80, word: "transforms", category: "verbs", freq: 13900, baseCoords: [10.3, 9.2, 6.2] },
    { id: 81, word: "process", category: "verbs", freq: 22400, baseCoords: [7, 11, 3] },
    { id: 82, word: "understand", category: "verbs", freq: 21600, baseCoords: [4, 11, 7] },
    { id: 83, word: "rule", category: "verbs", freq: 14000, baseCoords: [11, -8, -5] },
    { id: 84, word: "need", category: "verbs", freq: 37000, baseCoords: [1, 5, 2] },
    { id: 85, word: "see", category: "verbs", freq: 32000, baseCoords: [3, 12, 1] },
    { id: 86, word: "speak", category: "verbs", freq: 20500, baseCoords: [5, 10, 2] },

    // Adjectives & Qualities (IDs 87 - 99)
    { id: 87, word: "quick", category: "adjectives", freq: 14500, baseCoords: [-2, 13, 8] },
    { id: 88, word: "brown", category: "adjectives", freq: 12200, baseCoords: [-4, 6, -8] },
    { id: 89, word: "lazy", category: "adjectives", freq: 8300, baseCoords: [-3, -6, 9] },
    { id: 90, word: "deep", category: "adjectives", freq: 21000, baseCoords: [8, -4, 14] },
    { id: 91, word: "smart", category: "adjectives", freq: 19400, baseCoords: [6, 4, 12] },
    { id: 92, word: "dark", category: "adjectives", freq: 17200, baseCoords: [-6, -10, 5] },
    { id: 93, word: "bright", category: "adjectives", freq: 16100, baseCoords: [-4, -8, 12] },
    { id: 94, word: "large", category: "adjectives", freq: 25000, baseCoords: [3, -5, 10] },
    { id: 95, word: "complex", category: "adjectives", freq: 20300, baseCoords: [7, 2, 15] },
    { id: 96, word: "simple", category: "adjectives", freq: 27800, baseCoords: [1, -2, 11] },
    { id: 97, word: "powerful", category: "adjectives", freq: 18900, baseCoords: [8, -6, 8] },
    { id: 98, word: "fast", category: "adjectives", freq: 23500, baseCoords: [-1, 12, 9] },
    { id: 99, word: "creative", category: "adjectives", freq: 17400, baseCoords: [5, 6, 11] },

    // Nature & Cosmos (IDs 100 - 110)
    { id: 100, word: "forest", category: "nature", freq: 18400, baseCoords: [-8, -12, 14] },
    { id: 101, word: "river", category: "nature", freq: 16700, baseCoords: [-10, -14, 13] },
    { id: 102, word: "mountain", category: "nature", freq: 15300, baseCoords: [-9, -11, 16] },
    { id: 103, word: "ocean", category: "nature", freq: 19100, baseCoords: [-11, -15, 11] },
    { id: 104, word: "sun", category: "nature", freq: 28200, baseCoords: [-6, -16, 15] },
    { id: 105, word: "moon", category: "nature", freq: 20800, baseCoords: [-7, -17, 13] },
    { id: 106, word: "star", category: "nature", freq: 22500, baseCoords: [-5, -18, 16] },
    { id: 107, word: "sky", category: "nature", freq: 24100, baseCoords: [-7, -15, 17] },
    { id: 108, word: "earth", category: "nature", freq: 30400, baseCoords: [-9, -13, 12] },
    { id: 109, word: "tree", category: "nature", freq: 23700, baseCoords: [-8, -10, 13] },
    { id: 110, word: "language", category: "nature", freq: 33400, baseCoords: [11, 4, 3] },
    { id: 111, word: "through", category: "grammar", freq: 26000, baseCoords: [-13, 1, -2] },
    { id: 112, word: "text", category: "ai_tech", freq: 29500, baseCoords: [13, 5, 5] },
    { id: 113, word: "into", category: "grammar", freq: 34000, baseCoords: [-15, 0, 1] }
  ],

  // Explanations for the pipeline stages
  STAGE_EXPLANATIONS: {
    1: {
      name: "Input Text",
      tagline: "Raw Human Language",
      description: "Human language begins as an arbitrary stream of Unicode characters (letters, spaces, punctuation, emojis). A neural network cannot natively process raw character strings because machine learning models only do mathematical matrix multiplications on numbers.",
      realWorldDetail: "In production LLMs (like GPT-4, Llama 3, Gemini), the raw prompt is accepted via API and UTF-8 encoded into bytes before tokenization starts.",
      inputLabel: "User prompt string",
      outputLabel: "Normalized string stream"
    },
    2: {
      name: "Tokenization",
      tagline: "Splitting into Chunks",
      description: "The tokenizer converts the raw text into a sequence of discrete units called 'tokens'. Tokens can be whole words, subwords, syllables, or single characters. Tokenization strikes a balance between vocabulary size and sequence length.",
      realWorldDetail: "Production LLMs use subword algorithms like Byte-Pair Encoding (BPE), WordPiece, or Unigram. Common words become single tokens (e.g. 'the'), while rare or compound words are broken into subwords (e.g. 'un' + 'break' + 'able').",
      inputLabel: "Normalized text string",
      outputLabel: "Ordered list of token strings"
    },
    3: {
      name: "Vocabulary Lookup",
      tagline: "Dictionary Indexing",
      description: "The model compares each token against a fixed dictionary called the 'Vocabulary' (often containing 32,000 to 256,000 unique entries). If a token exists, its dictionary index is retrieved. If unknown, it falls back to subwords, byte tokens, or an `<unk>` token.",
      realWorldDetail: "The vocabulary is static after pre-training! Adding new words to a trained model's vocabulary without re-training requires extending the embedding matrix $W_e$ with new randomly initialized weights.",
      inputLabel: "Token string",
      outputLabel: "Vocabulary entry match"
    },
    4: {
      name: "Token IDs",
      tagline: "Integer Representation",
      description: "Each token is converted into its unique integer Token ID. The text is now an ordered 1D array of integers: [T_1, T_2, ..., T_n]. This is the exact format fed into the neural network's input tensor layer.",
      realWorldDetail: "In PyTorch/JAX, input IDs are packed into a tensor with shape [batch_size, sequence_length], padded with `<pad>` (ID 0) tokens if sequences have variable lengths.",
      inputLabel: "Token matches",
      outputLabel: "1D Integer array (Tensor)"
    },
    5: {
      name: "Embedding Matrix",
      tagline: "High-Dimensional Vectors",
      description: "Each integer Token ID indexes into a giant learned table: the Embedding Matrix $W_e \\in \\mathbb{R}^{V \\times d}$. Token ID $k$ extracts row $k$, turning an abstract integer into a dense, continuous numerical vector.",
      realWorldDetail: "In this educational app, vectors have 16 dimensions for simplicity. In GPT-3/4 and Llama, vectors have 4,096 to 12,288 dimensions! In these high-dimensional spaces, geometrical angles (cosine distance) capture semantic meanings, synonyms, and grammatic relations.",
      inputLabel: "Token ID (e.g., 25)",
      outputLabel: "Dense numerical vector $\\mathbb{R}^{d}$"
    },
    6: {
      name: "3D Spatial Projection",
      tagline: "Visualizing the Geometry of Meaning",
      description: "Because human eyes cannot perceive 16 or 4,096 dimensions, mathematical dimensionality reduction algorithms (like PCA or t-SNE) project the high-dimensional vectors down to 3 coordinates: [x, y, z]. Semantically similar words appear clustered close together.",
      realWorldDetail: "Principal Component Analysis (PCA) finds the orthogonal axes with the highest variance. Words like 'king' and 'queen' or 'neural' and 'transformer' cluster tightly because their learned high-dimensional features share similar coordinates.",
      inputLabel: "16-D embedding vector",
      outputLabel: "3D coordinates [X, Y, Z]"
    },
    7: {
      name: "Contextual Processing",
      tagline: "Self-Attention Mechanism",
      description: "Static embeddings alone cannot distinguish 'apple' the fruit from 'Apple' the tech company. In the Transformer's self-attention layers, each token dynamically attends to other tokens in the prompt, updating its vector to reflect contextual meaning.",
      realWorldDetail: "Each token generates Query (Q), Key (K), and Value (V) projections: $\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$. This contextualizes the token before passing through Feed-Forward layers to predict the next token.",
      inputLabel: "Static embeddings + Positional encodings",
      outputLabel: "Contextualized representations"
    }
  }
};

// Freeze config so it cannot be mutated accidentally
Object.freeze(CONFIG.CATEGORIES);
Object.freeze(CONFIG.STAGE_EXPLANATIONS);
