/**
 * LLM Pipeline Explorer - Reactive Application State
 * Manages vocabulary, custom words, local storage persistence,
 * current tokenization state, history, and pub-sub events.
 */

class AppState {
  constructor() {
    this.listeners = {};
    this.vocabMap = new Map(); // word (lowercase) -> vocab item
    this.vocabList = [];      // array of all items sorted by ID
    this.customVocab = [];    // array of custom added items
    this.history = [];        // recent tokenization activity
    this.stats = {
      totalTokensProcessed: 0,
      totalSentencesProcessed: 0
    };

    // Current interaction state
    this.currentText = "";
    this.currentTokens = [];
    this.selectedToken = null; // currently focused token object
    this.currentStage = 1;     // active pipeline stage (1 to 7)

    // Filters for vocabulary table
    this.vocabFilter = {
      searchQuery: "",
      category: "all",
      sortBy: "id", // "id", "word", "freq"
      sortOrder: "asc" // "asc", "desc"
    };

    this.init();
  }

  init() {
    this.loadFromStorage();
    this.rebuildVocabulary();
  }

  // Simple Pub-Sub Event Bus
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error(`Error in event listener for "${event}":`, err);
      }
    });
  }

  // Load persisted custom vocabulary & statistics from localStorage
  loadFromStorage() {
    try {
      const storedCustom = localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOM_VOCAB);
      if (storedCustom) {
        this.customVocab = JSON.parse(storedCustom);
      }

      const storedHistory = localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY);
      if (storedHistory) {
        this.history = JSON.parse(storedHistory);
      }

      const storedStats = localStorage.getItem(CONFIG.STORAGE_KEYS.STATS);
      if (storedStats) {
        this.stats = { ...this.stats, ...JSON.parse(storedStats) };
      }
    } catch (e) {
      console.warn("Could not read from localStorage, using in-memory state:", e);
      this.customVocab = [];
      this.history = [];
    }
  }

  saveCustomVocab() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.CUSTOM_VOCAB, JSON.stringify(this.customVocab));
    } catch (e) {
      console.warn("Could not save custom vocabulary to localStorage:", e);
    }
  }

  saveHistory() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(this.history.slice(0, 20)));
    } catch (e) {
      console.warn("Could not save history to localStorage:", e);
    }
  }

  saveStats() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.STATS, JSON.stringify(this.stats));
    } catch (e) {
      console.warn("Could not save stats to localStorage:", e);
    }
  }

  // Combine baseline vocabulary with custom user additions
  rebuildVocabulary() {
    this.vocabMap.clear();
    this.vocabList = [];

    // Add base vocabulary
    CONFIG.BASE_VOCABULARY.forEach(item => {
      const entry = { ...item, isCustom: false };
      this.vocabMap.set(item.word.toLowerCase(), entry);
      this.vocabList.push(entry);
    });

    // Add custom vocabulary
    this.customVocab.forEach(item => {
      const entry = { ...item, isCustom: true };
      this.vocabMap.set(item.word.toLowerCase(), entry);
      this.vocabList.push(entry);
    });

    // Ensure list is ordered by ID
    this.vocabList.sort((a, b) => a.id - b.id);

    this.emit("vocab:updated", {
      total: this.vocabList.length,
      customCount: this.customVocab.length
    });
  }

  // Get next available unique Token ID
  getNextTokenId() {
    let maxId = -1;
    this.vocabList.forEach(item => {
      if (item.id > maxId) maxId = item.id;
    });
    return maxId + 1;
  }

  // Add custom word with validation
  addCustomWord(rawWord, category = "custom") {
    if (!rawWord || typeof rawWord !== "string") {
      return { success: false, message: "Please provide a valid word." };
    }

    const word = rawWord.trim().toLowerCase();
    if (!word) {
      return { success: false, message: "Word cannot be empty or just whitespace." };
    }

    // Check if contains disallowed spaces for a single token word
    if (/\s/.test(word)) {
      return { success: false, message: "Vocabulary entries must be single words without spaces." };
    }

    // Check if word already exists
    if (this.vocabMap.has(word)) {
      const existing = this.vocabMap.get(word);
      return {
        success: false,
        message: `"${word}" already exists in the vocabulary with Token ID ${existing.id}.`
      };
    }

    // Generate unique ID
    const newId = this.getNextTokenId();

    // Generate deterministic pseudo-random 3D coords for this word
    const seed = word.split("").reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1) * 31, 0);
    const radius = 10 + (Math.abs(seed) % 12);
    const theta = ((seed * 17) % 360) * (Math.PI / 180);
    const phi = (((seed * 37) % 180) - 90) * (Math.PI / 180);

    const x = parseFloat((radius * Math.cos(phi) * Math.sin(theta)).toFixed(2));
    const y = parseFloat((radius * Math.sin(phi)).toFixed(2));
    const z = parseFloat((radius * Math.cos(phi) * Math.cos(theta)).toFixed(2));

    const newEntry = {
      id: newId,
      word: word,
      category: category || "custom",
      freq: Math.floor(1000 + (Math.abs(seed) % 5000)),
      baseCoords: [x, y, z],
      isCustom: true,
      addedAt: new Date().toISOString()
    };

    this.customVocab.push(newEntry);
    this.saveCustomVocab();
    this.rebuildVocabulary();

    this.emit("customWord:added", newEntry);

    return {
      success: true,
      message: `Successfully added "${word}" with unique Token ID #${newId}!`,
      entry: newEntry
    };
  }

  // Delete custom word by ID
  deleteCustomWord(id) {
    const numId = Number(id);
    const index = this.customVocab.findIndex(item => item.id === numId);
    if (index === -1) {
      return { success: false, message: "Custom word not found." };
    }

    const removed = this.customVocab.splice(index, 1)[0];
    this.saveCustomVocab();
    this.rebuildVocabulary();

    this.emit("customWord:deleted", removed);

    return {
      success: true,
      message: `Deleted custom word "${removed.word}".`,
      entry: removed
    };
  }

  // Reset custom words to baseline
  resetCustomWords() {
    const count = this.customVocab.length;
    this.customVocab = [];
    this.saveCustomVocab();
    this.rebuildVocabulary();
    this.emit("customWord:reset", { count });
    return { success: true, message: `Reset vocabulary. Removed ${count} custom words.` };
  }

  // Lookup word in vocabulary
  lookup(word) {
    if (!word) return null;
    return this.vocabMap.get(word.toLowerCase()) || null;
  }

  // Check if word exists
  hasWord(word) {
    if (!word) return false;
    return this.vocabMap.has(word.toLowerCase());
  }

  // Set current tokenization results
  setTokenizationResult(rawText, tokens) {
    this.currentText = rawText;
    this.currentTokens = tokens;
    this.stats.totalTokensProcessed += tokens.length;
    this.stats.totalSentencesProcessed += 1;
    this.saveStats();

    // Push to history
    this.history.unshift({
      id: Date.now(),
      text: rawText.length > 60 ? rawText.slice(0, 57) + "..." : rawText,
      fullText: rawText,
      tokenCount: tokens.length,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    if (this.history.length > 20) this.history.pop();
    this.saveHistory();

    this.emit("tokenization:updated", {
      text: rawText,
      tokens: tokens,
      stats: this.stats
    });
  }

  // Select a token for inspection
  selectToken(token) {
    this.selectedToken = token;
    this.emit("token:selected", token);
  }

  // Set active pipeline stage
  setStage(stageNum) {
    if (stageNum >= 1 && stageNum <= 7) {
      this.currentStage = stageNum;
      this.emit("stage:changed", stageNum);
    }
  }

  // Filtered and sorted vocabulary list for the table
  getFilteredVocabulary() {
    let result = [...this.vocabList];

    // Search query filter
    const query = this.vocabFilter.searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(item => {
        return (
          item.word.toLowerCase().includes(query) ||
          item.id.toString() === query ||
          item.category.toLowerCase().includes(query)
        );
      });
    }

    // Category filter
    if (this.vocabFilter.category !== "all") {
      result = result.filter(item => item.category === this.vocabFilter.category);
    }

    // Sorting
    const { sortBy, sortOrder } = this.vocabFilter;
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }
}

// Global state singleton
const appState = new AppState();
