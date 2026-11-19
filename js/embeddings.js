/**
 * LLM Pipeline Explorer - Embedding Matrix & Vector Mathematics
 * Generates deterministic 16-D embeddings, computes cosine similarity,
 * vector norms, dot products, and provides 3D spatial projections.
 */

class EmbeddingEngine {
  constructor(dimension = CONFIG.DEFAULT_EMBEDDING_DIM) {
    this.dimension = dimension;
    this.cache = new Map();
  }

  /**
   * Deterministic pseudo-random number generator from string seed
   */
  _pseudoRandom(seedStr, offset = 0) {
    let h = 0x811c9dc5 + offset;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    // Return float between -1.0 and 1.0
    const x = Math.sin(h) * 10000;
    const frac = x - Math.floor(x);
    return parseFloat((frac * 2 - 1).toFixed(4));
  }

  /**
   * Generate or retrieve reproducible 16-dimensional embedding vector for a token
   * @param {Object} tokenOrVocab - Token or Vocabulary entry
   * @returns {Array<number>} 16-dimensional float vector
   */
  getEmbedding(tokenOrVocab) {
    if (!tokenOrVocab) return new Array(this.dimension).fill(0);

    const key = (tokenOrVocab.word || tokenOrVocab.raw || "").toLowerCase();
    const id = tokenOrVocab.id !== undefined ? tokenOrVocab.id : 0;
    const cacheKey = `${key}_${id}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const vector = [];
    const category = tokenOrVocab.category || "special";

    // Semantic category bias vector to make semantically related words
    // cluster realistically in vector space and have high cosine similarity!
    const categoryBiases = {
      ai_tech: [0.8, 0.7, 0.9, -0.4, 0.6, 0.2, -0.3, 0.8, -0.1, 0.5, 0.7, -0.6, 0.4, 0.3, -0.2, 0.8],
      animals: [-0.6, 0.8, -0.5, 0.9, -0.3, 0.7, 0.8, -0.4, 0.5, -0.7, 0.2, 0.8, -0.5, -0.6, 0.9, -0.3],
      royalty_human: [0.3, -0.7, 0.6, -0.5, 0.9, 0.8, -0.4, 0.2, 0.8, 0.6, -0.5, -0.2, 0.7, 0.9, -0.3, 0.4],
      grammar: [-0.8, -0.7, -0.6, -0.5, -0.8, -0.6, -0.7, -0.5, -0.6, -0.8, -0.7, -0.6, -0.5, -0.7, -0.6, -0.8],
      verbs: [0.4, 0.3, -0.2, 0.5, -0.4, 0.6, 0.3, -0.6, 0.4, 0.2, -0.3, 0.5, 0.2, -0.4, 0.6, 0.1],
      adjectives: [0.1, 0.5, 0.3, -0.2, 0.4, -0.3, 0.6, 0.1, -0.4, 0.5, 0.3, -0.2, 0.4, 0.1, -0.3, 0.5],
      nature: [-0.5, -0.4, 0.8, 0.7, -0.6, 0.4, 0.5, -0.7, 0.6, -0.3, 0.8, 0.5, -0.4, -0.5, 0.7, -0.2],
      special: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
      custom: [0.2, 0.4, -0.3, 0.1, 0.5, -0.2, 0.3, 0.6, -0.1, 0.4, 0.2, -0.5, 0.3, 0.1, -0.2, 0.4]
    };

    const bias = categoryBiases[category] || categoryBiases.custom;

    for (let d = 0; d < this.dimension; d++) {
      // Blend deterministic word hash noise with category bias
      const noise = this._pseudoRandom(`${key}_dim_${d}`, id * 17);
      const rawVal = 0.65 * bias[d] + 0.35 * noise;
      // Clamp between -1.0 and 1.0
      const clamped = Math.max(-1.0, Math.min(1.0, rawVal));
      vector.push(parseFloat(clamped.toFixed(4)));
    }

    // Normalize vector to unit length (common practice in embedding layers)
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    const normalizedVector = vector.map(val => parseFloat((val / (norm || 1)).toFixed(4)));

    this.cache.set(cacheKey, normalizedVector);
    return normalizedVector;
  }

  /**
   * Compute Cosine Similarity between two embedding vectors
   * Cosine Similarity = (A . B) / (||A|| * ||B||)
   * Ranges from -1 (opposite) to +1 (identical)
   */
  computeCosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    const similarity = dotProduct / (normA * normB);
    return parseFloat(similarity.toFixed(4));
  }

  /**
   * Compute Euclidean Distance between two vectors
   */
  computeEuclideanDistance(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
      const diff = vecA[i] - vecB[i];
      sum += diff * diff;
    }
    return parseFloat(Math.sqrt(sum).toFixed(4));
  }

  /**
   * Project high-dimensional vector to 3D space [x, y, z]
   * Simulates Principal Component Analysis (PCA) projection
   */
  projectTo3D(tokenOrVocab) {
    // If base coordinates exist in vocabulary config, use them as anchor with slight variation
    if (tokenOrVocab.baseCoords && Array.isArray(tokenOrVocab.baseCoords)) {
      return tokenOrVocab.baseCoords;
    }

    const vector = this.getEmbedding(tokenOrVocab);

    // PCA projection simulation using 3 primary orthogonal projection basis vectors
    // Component 1 (X axis: semantic polarity & technology vs nature)
    let x = 0;
    // Component 2 (Y axis: abstraction & syntactic function)
    let y = 0;
    // Component 3 (Z axis: biological / physical scale)
    let z = 0;

    for (let i = 0; i < vector.length; i++) {
      x += vector[i] * Math.cos((i * Math.PI) / 4);
      y += vector[i] * Math.sin((i * Math.PI) / 4);
      z += vector[i] * Math.cos((i * Math.PI) / 2);
    }

    const scale = 14;
    return [
      parseFloat((x * scale).toFixed(2)),
      parseFloat((y * scale).toFixed(2)),
      parseFloat((z * scale).toFixed(2))
    ];
  }

  /**
   * Render vector as formatted HTML color heatmap / bars
   */
  formatVectorHTML(vector) {
    if (!vector || !vector.length) return "";

    return vector.map((val, idx) => {
      // Color from deep blue (negative) to vibrant cyan/purple (positive)
      const isPositive = val >= 0;
      const intensity = Math.min(Math.abs(val), 1);
      const bg = isPositive
        ? `rgba(6, 182, 212, ${0.15 + intensity * 0.7})`
        : `rgba(244, 63, 94, ${0.15 + intensity * 0.7})`;
      const border = isPositive ? "rgba(6, 182, 212, 0.4)" : "rgba(244, 63, 94, 0.4)";
      const textColor = isPositive ? "#a5f3fc" : "#fecdd3";

      return `
        <div class="vec-cell" style="background:${bg}; border-color:${border}; color:${textColor};" title="Dimension ${idx + 1}: ${val}">
          <span class="vec-dim">d${idx + 1}</span>
          <span class="vec-val">${val >= 0 ? "+" + val.toFixed(2) : val.toFixed(2)}</span>
        </div>
      `;
    }).join("");
  }
}

const embeddingEngine = new EmbeddingEngine();
