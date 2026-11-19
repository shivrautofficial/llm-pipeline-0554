/**
 * LLM Pipeline Explorer - Main Application Controller
 * Handles view switching, dashboard metrics, UI event listeners,
 * vocabulary table rendering, custom word forms, cosine similarity tool,
 * and token inspection modal.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Core Engines
  const tokenizer = new EducationalTokenizer(appState);
  let visualizer3d = null;
  let pipelineVisualizer = null;

  // 2. View Navigation Management
  const navLinks = document.querySelectorAll(".nav-link");
  const views = document.querySelectorAll(".view-section");

  function switchView(viewName) {
    views.forEach(v => {
      v.classList.remove("active");
      if (v.id === `view-${viewName}`) {
        v.classList.add("active");
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle("active", link.getAttribute("data-view") === viewName);
    });

    // Handle 3D visualizer canvas resize if switching to 3D explorer or dashboard
    if (viewName === "3d-explorer" || viewName === "dashboard") {
      setTimeout(() => {
        if (visualizer3d) visualizer3d.handleResize();
      }, 50);
    }

    // Scroll to top of content smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const targetView = link.getAttribute("data-view");
      if (targetView) switchView(targetView);
    });
  });

  // Handle in-page navigation links (e.g., buttons in cards that navigate to other tabs)
  document.addEventListener("click", e => {
    const navBtn = e.target.closest("[data-navigate]");
    if (navBtn) {
      const target = navBtn.getAttribute("data-navigate");
      if (target) switchView(target);
    }
  });

  // 3. Initialize Visualizers
  try {
    visualizer3d = new Visualizer3D("three-canvas-container", appState, embeddingEngine);
  } catch (err) {
    console.error("Failed to initialize 3D visualizer:", err);
  }

  try {
    pipelineVisualizer = new PipelineVisualizer(
      "pipeline-cards-row",
      "pipeline-stage-detail",
      appState,
      tokenizer,
      embeddingEngine
    );
  } catch (err) {
    console.error("Failed to initialize pipeline visualizer:", err);
  }

  // 4. Tokenization Playground Handlers
  const textInput = document.getElementById("playground-input");
  const tokenizeBtn = document.getElementById("btn-tokenize");
  const clearBtn = document.getElementById("btn-clear-input");
  const autoTokenizeToggle = document.getElementById("toggle-auto-tokenize");
  const presetsContainer = document.getElementById("presets-pills");
  const tokenBadgesContainer = document.getElementById("tokenized-badges-container");
  const originalTextDisplay = document.getElementById("original-text-highlighted");
  const tokenStatsRow = document.getElementById("token-stats-row");

  function performTokenization() {
    const rawText = textInput.value;
    if (!rawText.trim()) {
      appState.setTokenizationResult("", []);
      renderTokenizationResults("", []);
      return;
    }

    const tokens = tokenizer.tokenize(rawText);
    appState.setTokenizationResult(rawText, tokens);
    renderTokenizationResults(rawText, tokens);
    updateDashboardMetrics();
  }

  function renderTokenizationResults(rawText, tokens) {
    if (!tokens || tokens.length === 0) {
      tokenBadgesContainer.innerHTML = `<div class="empty-state-notice">Enter text above and click <strong>Tokenize Text</strong> to see the token stream.</div>`;
      originalTextDisplay.innerHTML = `<em>Text preview will appear here with token boundary highlighting.</em>`;
      renderTokenStats(null);
      return;
    }

    // 1. Render Interactive Token Badges
    tokenBadgesContainer.innerHTML = tokens.map((token, idx) => {
      const isCustom = token.status === "custom";
      const isOOV = token.status === "oov";
      const isPunct = token.status === "punctuation";

      let statusIcon = "";
      if (isCustom) statusIcon = `<span class="pill-badge-custom" title="Custom Word">⭐</span>`;
      else if (isOOV) statusIcon = `<span class="pill-badge-oov" title="Out of Vocabulary (<unk>)">⚠️</span>`;

      return `
        <button type="button" class="token-pill-btn" data-token-idx="${idx}"
                style="background:${token.color.bg}; border-color:${token.color.border}; color:${token.color.text};"
                title="Token #${idx + 1}: '${token.raw}' (ID: ${token.id}). Click to inspect.">
          <span class="tp-text">${escapeHTML(token.raw)}</span>
          <span class="tp-id">#${token.id}</span>
          ${statusIcon}
        </button>
      `;
    }).join("");

    // 2. Render Text with Token Boundary Highlighting
    let highlightedHTML = "";
    tokens.forEach((t, i) => {
      highlightedHTML += `<mark class="text-boundary-mark" style="background:${t.color.bg}; border-bottom: 2px solid ${t.color.border}; color:#ffffff;" title="Token #${i + 1}: ${t.raw}">${escapeHTML(t.raw)}</mark> `;
    });
    originalTextDisplay.innerHTML = highlightedHTML;

    // 3. Render Stats Summary
    const stats = tokenizer.getStats(rawText, tokens);
    renderTokenStats(stats);

    // Attach click handlers to token pills for inspection
    tokenBadgesContainer.querySelectorAll(".token-pill-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-token-idx"), 10);
        const token = tokens[idx];
        if (token) {
          appState.selectToken(token);
          openTokenModal(token);
        }
      });
    });
  }

  function renderTokenStats(stats) {
    if (!tokenStatsRow) return;
    if (!stats) {
      tokenStatsRow.innerHTML = "";
      return;
    }

    tokenStatsRow.innerHTML = `
      <div class="stat-pill"><span>Total Tokens:</span> <strong>${stats.tokenCount}</strong></div>
      <div class="stat-pill"><span>Words:</span> <strong>${stats.wordCount}</strong></div>
      <div class="stat-pill"><span>Characters:</span> <strong>${stats.charCount}</strong></div>
      <div class="stat-pill"><span>Tokens / Word:</span> <strong>${stats.ratio}</strong></div>
      <div class="stat-pill"><span>In Vocab:</span> <strong class="text-cyan">${stats.knownCount}</strong></div>
      ${stats.oovCount > 0 ? `<div class="stat-pill text-amber"><span>OOV / Subwords:</span> <strong>${stats.oovCount}</strong></div>` : ''}
    `;
  }

  if (tokenizeBtn) {
    tokenizeBtn.addEventListener("click", performTokenization);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      textInput.value = "";
      performTokenization();
    });
  }

  if (textInput) {
    textInput.addEventListener("input", () => {
      if (autoTokenizeToggle && autoTokenizeToggle.checked) {
        performTokenization();
      }
    });
  }

  // Populate sample presets
  if (presetsContainer) {
    presetsContainer.innerHTML = CONFIG.PRESETS.map((preset, idx) => `
      <button type="button" class="preset-pill-btn" data-preset-idx="${idx}">
        ${preset.title}
      </button>
    `).join("");

    presetsContainer.querySelectorAll(".preset-pill-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-preset-idx"), 10);
        const preset = CONFIG.PRESETS[idx];
        if (preset) {
          textInput.value = preset.text;
          performTokenization();
        }
      });
    });
  }

  // 5. Vocabulary Explorer & Table Rendering
  const vocabSearchInput = document.getElementById("vocab-search");
  const vocabCategoryFilter = document.getElementById("vocab-cat-filter");
  const vocabSortBy = document.getElementById("vocab-sort-by");
  const vocabSortOrderBtn = document.getElementById("vocab-sort-order-btn");
  const vocabTableBody = document.getElementById("vocab-table-body");
  const vocabTotalBadge = document.getElementById("vocab-total-badge");
  const vocabCustomBadge = document.getElementById("vocab-custom-badge");

  function renderVocabularyTable() {
    if (!vocabTableBody) return;

    const filtered = appState.getFilteredVocabulary();

    // Update counts
    if (vocabTotalBadge) vocabTotalBadge.textContent = `${appState.vocabList.length} total words`;
    if (vocabCustomBadge) vocabCustomBadge.textContent = `${appState.customVocab.length} custom`;

    if (filtered.length === 0) {
      vocabTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-muted">
            No vocabulary entries match your current search and filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    vocabTableBody.innerHTML = filtered.map(item => {
      const cat = CONFIG.CATEGORIES[item.category] || CONFIG.CATEGORIES.custom;
      const coords = embeddingEngine.projectTo3D(item);

      return `
        <tr class="${item.isCustom ? 'row-custom-word' : ''}">
          <td class="font-mono font-bold text-cyan">#${item.id}</td>
          <td>
            <div class="vocab-word-cell">
              <span class="vocab-word-text">${escapeHTML(item.word)}</span>
              ${item.isCustom ? '<span class="custom-badge-tag">Custom</span>' : ''}
              ${item.special ? '<span class="special-badge-tag">Control</span>' : ''}
            </div>
          </td>
          <td>
            <span class="category-tag-pill" style="border-color:${cat.color}; color:${cat.color};">
              ● ${cat.name}
            </span>
          </td>
          <td class="font-mono text-muted">~${item.freq.toLocaleString()}</td>
          <td class="font-mono text-xs text-muted">[${coords[0]}, ${coords[1]}, ${coords[2]}]</td>
          <td>
            <div class="row-actions">
              <button type="button" class="action-btn-inspect" data-inspect-id="${item.id}" title="Inspect Embedding & 3D">
                🔍 Inspect
              </button>
              ${item.isCustom ? `
                <button type="button" class="action-btn-delete" data-delete-id="${item.id}" title="Delete Custom Word">
                  🗑️
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Attach row inspection handlers
    vocabTableBody.querySelectorAll(".action-btn-inspect").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-inspect-id"), 10);
        const item = appState.vocabList.find(v => v.id === id);
        if (item) {
          appState.selectToken(item);
          openTokenModal(item);
        }
      });
    });

    // Attach row delete handlers
    vocabTableBody.querySelectorAll(".action-btn-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-delete-id"), 10);
        const res = appState.deleteCustomWord(id);
        showToast(res.message, res.success ? "success" : "error");
        renderVocabularyTable();
        updateDashboardMetrics();
      });
    });
  }

  // Populate category filter options
  if (vocabCategoryFilter) {
    vocabCategoryFilter.innerHTML = `
      <option value="all">All Categories</option>
      ${Object.entries(CONFIG.CATEGORIES).map(([key, cat]) => `
        <option value="${key}">${cat.name}</option>
      `).join("")}
    `;

    vocabCategoryFilter.addEventListener("change", e => {
      appState.vocabFilter.category = e.target.value;
      renderVocabularyTable();
    });
  }

  if (vocabSearchInput) {
    vocabSearchInput.addEventListener("input", e => {
      appState.vocabFilter.searchQuery = e.target.value;
      renderVocabularyTable();
    });
  }

  if (vocabSortBy) {
    vocabSortBy.addEventListener("change", e => {
      appState.vocabFilter.sortBy = e.target.value;
      renderVocabularyTable();
    });
  }

  if (vocabSortOrderBtn) {
    vocabSortOrderBtn.addEventListener("click", () => {
      appState.vocabFilter.sortOrder = appState.vocabFilter.sortOrder === "asc" ? "desc" : "asc";
      vocabSortOrderBtn.innerHTML = appState.vocabFilter.sortOrder === "asc" ? "⬆ Asc" : "⬇ Desc";
      renderVocabularyTable();
    });
  }

  // 6. Add New Words Module Handlers
  const addWordForm = document.getElementById("add-word-form");
  const newWordInput = document.getElementById("new-word-input");
  const newWordCategory = document.getElementById("new-word-category");
  const addWordAlert = document.getElementById("add-word-alert");
  const resetCustomVocabBtn = document.getElementById("btn-reset-custom-vocab");

  if (newWordCategory) {
    newWordCategory.innerHTML = Object.entries(CONFIG.CATEGORIES)
      .filter(([k]) => k !== "special")
      .map(([key, cat]) => `
        <option value="${key}">${cat.name}</option>
      `).join("");
    newWordCategory.value = "custom";
  }

  if (addWordForm) {
    addWordForm.addEventListener("submit", e => {
      e.preventDefault();
      const rawWord = newWordInput.value;
      const category = newWordCategory.value;

      const result = appState.addCustomWord(rawWord, category);

      if (addWordAlert) {
        addWordAlert.className = `alert-box alert-${result.success ? 'success' : 'error'}`;
        addWordAlert.textContent = result.message;
        addWordAlert.style.display = "block";
      }

      showToast(result.message, result.success ? "success" : "error");

      if (result.success) {
        newWordInput.value = "";
        renderVocabularyTable();
        updateDashboardMetrics();
        // If user already has text in playground, re-tokenize to utilize new word
        if (textInput && textInput.value) {
          performTokenization();
        }
      }
    });
  }

  if (resetCustomVocabBtn) {
    resetCustomVocabBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete all custom added words and restore base vocabulary?")) {
        const res = appState.resetCustomWords();
        showToast(res.message, "info");
        renderVocabularyTable();
        updateDashboardMetrics();
        if (textInput && textInput.value) {
          performTokenization();
        }
      }
    });
  }

  // 7. Embedding Explorer & Cosine Similarity Tool
  const embTokenSelect = document.getElementById("emb-token-select");
  const embVectorHeatmap = document.getElementById("emb-vector-heatmap");
  const embRawValues = document.getElementById("emb-raw-values");
  const embTokenDetails = document.getElementById("emb-token-details");

  const simWordASelect = document.getElementById("sim-word-a");
  const simWordBSelect = document.getElementById("sim-word-b");
  const simScoreValue = document.getElementById("sim-score-value");
  const simProgressBar = document.getElementById("sim-progress-bar");
  const simExplanation = document.getElementById("sim-explanation");
  const simEuclideanValue = document.getElementById("sim-euclidean-value");

  function populateEmbeddingSelectors() {
    const sorted = [...appState.vocabList].sort((a, b) => a.word.localeCompare(b.word));

    const optionsHTML = sorted.map(v => `<option value="${v.word}">"${v.word}" (ID: #${v.id})</option>`).join("");

    if (embTokenSelect) {
      embTokenSelect.innerHTML = optionsHTML;
      embTokenSelect.value = "transformer";
      renderSelectedEmbedding("transformer");
    }

    if (simWordASelect && simWordBSelect) {
      simWordASelect.innerHTML = optionsHTML;
      simWordBSelect.innerHTML = optionsHTML;

      simWordASelect.value = "king";
      simWordBSelect.value = "queen";
      computeAndRenderSimilarity();
    }
  }

  function renderSelectedEmbedding(word) {
    if (!word) return;
    const item = appState.lookup(word);
    if (!item) return;

    const vector = embeddingEngine.getEmbedding(item);
    const coords = embeddingEngine.projectTo3D(item);
    const cat = CONFIG.CATEGORIES[item.category] || CONFIG.CATEGORIES.custom;

    if (embTokenDetails) {
      embTokenDetails.innerHTML = `
        <div class="emb-info-card">
          <div class="eic-word">"${item.word}" <span class="eic-id">ID #${item.id}</span></div>
          <div class="eic-cat" style="color: ${cat.color};">● ${cat.name}</div>
          <div class="eic-meta">Estimated Corpus Frequency: <strong>${item.freq.toLocaleString()}</strong></div>
          <div class="eic-meta">3D Projection Coordinates: <code>[${coords[0]}, ${coords[1]}, ${coords[2]}]</code></div>
        </div>
      `;
    }

    if (embVectorHeatmap) {
      embVectorHeatmap.innerHTML = embeddingEngine.formatVectorHTML(vector);
    }

    if (embRawValues) {
      embRawValues.textContent = `[ ${vector.map(v => (v >= 0 ? "+" + v.toFixed(4) : v.toFixed(4))).join(", ")} ]`;
    }
  }

  if (embTokenSelect) {
    embTokenSelect.addEventListener("change", e => {
      renderSelectedEmbedding(e.target.value);
    });
  }

  function computeAndRenderSimilarity() {
    if (!simWordASelect || !simWordBSelect) return;
    const wordA = simWordASelect.value;
    const wordB = simWordBSelect.value;

    const itemA = appState.lookup(wordA);
    const itemB = appState.lookup(wordB);

    if (!itemA || !itemB) return;

    const vecA = embeddingEngine.getEmbedding(itemA);
    const vecB = embeddingEngine.getEmbedding(itemB);

    const cosSim = embeddingEngine.computeCosineSimilarity(vecA, vecB);
    const eucDist = embeddingEngine.computeEuclideanDistance(vecA, vecB);

    // Score display
    if (simScoreValue) {
      simScoreValue.textContent = cosSim.toFixed(4);
      simScoreValue.style.color = cosSim > 0.6 ? "#34d399" : cosSim > 0.2 ? "#38bdf8" : "#fb7185";
    }

    if (simEuclideanValue) {
      simEuclideanValue.textContent = eucDist.toFixed(4);
    }

    // Progress bar (map [-1, 1] to [0%, 100%])
    if (simProgressBar) {
      const percentage = Math.max(0, Math.min(100, ((cosSim + 1) / 2) * 100));
      simProgressBar.style.width = `${percentage}%`;
      simProgressBar.style.backgroundColor = cosSim > 0.6 ? "#10b981" : cosSim > 0.2 ? "#06b6d4" : "#f43f5e";
    }

    // Educational explanation
    if (simExplanation) {
      let analysisText = "";
      if (cosSim > 0.7) {
        analysisText = `<strong>High Semantic Similarity (${(cosSim * 100).toFixed(1)}%):</strong> "${wordA}" and "${wordB}" share strongly aligned directional vectors. In LLM embedding space, these tokens point in nearly the same direction, reflecting close conceptual, syntactic, or contextual affinity.`;
      } else if (cosSim > 0.3) {
        analysisText = `<strong>Moderate Semantic Alignment (${(cosSim * 100).toFixed(1)}%):</strong> "${wordA}" and "${wordB}" share some latent feature activations while maintaining distinct semantic roles.`;
      } else {
        analysisText = `<strong>Low / Orthogonal Similarity (${(cosSim * 100).toFixed(1)}%):</strong> "${wordA}" and "${wordB}" reside in divergent semantic clusters. Their high-dimensional vectors form a wide angle with little directional overlap.`;
      }

      simExplanation.innerHTML = `
        <div class="sim-analysis-box">
          ${analysisText}
          <div class="sim-math-note">
            Formula: $\\cos(\\theta) = \\frac{\\mathbf{A} \\cdot \\mathbf{B}}{\\|\\mathbf{A}\\| \\|\\mathbf{B}\\|} = ${cosSim.toFixed(4)}$
          </div>
        </div>
      `;
    }
  }

  if (simWordASelect) simWordASelect.addEventListener("change", computeAndRenderSimilarity);
  if (simWordBSelect) simWordBSelect.addEventListener("change", computeAndRenderSimilarity);

  // Quick analogy buttons for similarity testing
  document.querySelectorAll(".sim-preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const wA = btn.getAttribute("data-word-a");
      const wB = btn.getAttribute("data-word-b");
      if (simWordASelect && simWordBSelect) {
        simWordASelect.value = wA;
        simWordBSelect.value = wB;
        computeAndRenderSimilarity();
      }
    });
  });

  // 8. 3D Explorer Controls
  const toggleLabelsBtn = document.getElementById("btn-toggle-labels");
  const toggleTrajectoryBtn = document.getElementById("btn-toggle-trajectory");
  const resetCameraBtn = document.getElementById("btn-reset-camera");
  const search3dInput = document.getElementById("search-3d-input");

  if (toggleLabelsBtn) {
    toggleLabelsBtn.addEventListener("click", () => {
      if (!visualizer3d) return;
      const isVisible = !visualizer3d.showLabels;
      visualizer3d.toggleLabels(isVisible);
      toggleLabelsBtn.classList.toggle("active", isVisible);
      toggleLabelsBtn.textContent = isVisible ? "🏷️ Labels: ON" : "🏷️ Labels: OFF";
    });
  }

  if (toggleTrajectoryBtn) {
    toggleTrajectoryBtn.addEventListener("click", () => {
      if (!visualizer3d) return;
      const isVisible = !visualizer3d.showTrajectory;
      visualizer3d.toggleTrajectory(isVisible);
      toggleTrajectoryBtn.classList.toggle("active", isVisible);
      toggleTrajectoryBtn.textContent = isVisible ? "⚡ Trajectory: ON" : "⚡ Trajectory: OFF";
    });
  }

  if (resetCameraBtn) {
    resetCameraBtn.addEventListener("click", () => {
      if (visualizer3d) visualizer3d.resetCamera();
    });
  }

  if (search3dInput) {
    search3dInput.addEventListener("input", e => {
      const query = e.target.value.trim().toLowerCase();
      if (!query || !visualizer3d) return;
      const item = appState.lookup(query);
      if (item) {
        appState.selectToken(item);
      }
    });
  }

  // 9. Pipeline Step Controls
  const pipelineTourBtn = document.getElementById("btn-pipeline-tour");
  const pipelinePrevBtn = document.getElementById("btn-pipeline-prev");
  const pipelineNextBtn = document.getElementById("btn-pipeline-next");

  if (pipelineTourBtn && pipelineVisualizer) {
    pipelineTourBtn.addEventListener("click", () => {
      pipelineVisualizer.togglePlay(pipelineTourBtn);
    });
  }

  if (pipelinePrevBtn && pipelineVisualizer) {
    pipelinePrevBtn.addEventListener("click", () => {
      pipelineVisualizer.prevStage();
    });
  }

  if (pipelineNextBtn && pipelineVisualizer) {
    pipelineNextBtn.addEventListener("click", () => {
      pipelineVisualizer.nextStage();
    });
  }

  // 10. Dashboard Metrics & Activity Log
  function updateDashboardMetrics() {
    const elVocabCount = document.getElementById("dash-vocab-count");
    const elCustomCount = document.getElementById("dash-custom-count");
    const elTokensCount = document.getElementById("dash-tokens-count");
    const elEmbeddingsCount = document.getElementById("dash-embeddings-count");
    const elRecentActivity = document.getElementById("dash-recent-activity");

    if (elVocabCount) elVocabCount.textContent = appState.vocabList.length.toLocaleString();
    if (elCustomCount) elCustomCount.textContent = appState.customVocab.length.toLocaleString();
    if (elTokensCount) elTokensCount.textContent = appState.stats.totalTokensProcessed.toLocaleString();
    if (elEmbeddingsCount) elEmbeddingsCount.textContent = appState.vocabList.length.toLocaleString();

    if (elRecentActivity) {
      if (appState.history.length === 0) {
        elRecentActivity.innerHTML = `<div class="empty-state-notice">No recent tokenization activity yet. Try entering a sentence in the Tokenization tab!</div>`;
      } else {
        elRecentActivity.innerHTML = appState.history.slice(0, 5).map(item => `
          <div class="activity-row" data-activity-text="${escapeHTML(item.fullText)}">
            <div class="act-main">
              <span class="act-text">"${escapeHTML(item.text)}"</span>
              <span class="act-time">${item.timestamp}</span>
            </div>
            <div class="act-badge">${item.tokenCount} tokens</div>
          </div>
        `).join("");

        // Click recent activity item to load it into playground
        elRecentActivity.querySelectorAll(".activity-row").forEach(row => {
          row.addEventListener("click", () => {
            const fullText = row.getAttribute("data-activity-text");
            if (fullText && textInput) {
              textInput.value = fullText;
              switchView("tokenization");
              performTokenization();
            }
          });
        });
      }
    }
  }

  // 11. Modal Inspector for Tokens & Vocabulary Items
  const tokenModal = document.getElementById("token-inspector-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalTokenTitle = document.getElementById("modal-token-title");
  const modalTokenId = document.getElementById("modal-token-id");
  const modalTokenCategory = document.getElementById("modal-token-category");
  const modalTokenFreq = document.getElementById("modal-token-freq");
  const modalTokenVector = document.getElementById("modal-token-vector");
  const modalTokenCoords = document.getElementById("modal-token-coords");
  const modalTokenSubwordNote = document.getElementById("modal-token-subword-note");
  const modalBtnView3d = document.getElementById("modal-btn-view-3d");

  function openTokenModal(tokenOrVocab) {
    if (!tokenModal || !tokenOrVocab) return;

    const word = tokenOrVocab.word || tokenOrVocab.raw || "N/A";
    const id = tokenOrVocab.id !== undefined ? tokenOrVocab.id : 0;
    const cat = CONFIG.CATEGORIES[tokenOrVocab.category] || CONFIG.CATEGORIES.custom;
    const vector = embeddingEngine.getEmbedding(tokenOrVocab);
    const coords = embeddingEngine.projectTo3D(tokenOrVocab);

    if (modalTokenTitle) modalTokenTitle.textContent = `"${word}"`;
    if (modalTokenId) modalTokenId.textContent = `#${id}`;
    if (modalTokenCategory) {
      modalTokenCategory.textContent = cat.name;
      modalTokenCategory.style.color = cat.color;
    }
    if (modalTokenFreq) {
      const freq = tokenOrVocab.freq || (tokenOrVocab.vocabEntry ? tokenOrVocab.vocabEntry.freq : 2400);
      modalTokenFreq.textContent = `~${freq.toLocaleString()} occurrences`;
    }
    if (modalTokenCoords) {
      modalTokenCoords.textContent = `[X: ${coords[0]}, Y: ${coords[1]}, Z: ${coords[2]}]`;
    }

    if (modalTokenVector) {
      modalTokenVector.innerHTML = embeddingEngine.formatVectorHTML(vector);
    }

    if (modalTokenSubwordNote) {
      if (tokenOrVocab.subwordNote) {
        modalTokenSubwordNote.innerHTML = `
          <div class="subword-alert">
            <strong>Subword Tokenizer Note:</strong> ${tokenOrVocab.subwordNote}
          </div>
        `;
        modalTokenSubwordNote.style.display = "block";
      } else {
        modalTokenSubwordNote.style.display = "none";
      }
    }

    if (modalBtnView3d) {
      modalBtnView3d.onclick = () => {
        tokenModal.classList.remove("active");
        switchView("3d-explorer");
        if (visualizer3d) {
          visualizer3d.focusToken(tokenOrVocab);
        }
      };
    }

    tokenModal.classList.add("active");
  }

  function closeTokenModal() {
    if (tokenModal) {
      tokenModal.classList.remove("active");
    }
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeTokenModal);

  window.addEventListener("click", e => {
    if (e.target === tokenModal) {
      closeTokenModal();
    }
  });

  // 12. Global Toast Notification System
  function showToast(message, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
      <span class="toast-msg">${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

  // 13. Initial Boot & Default State Setup
  renderVocabularyTable();
  populateEmbeddingSelectors();
  updateDashboardMetrics();

  // Load first preset into playground by default for an immediate wow-factor
  if (textInput && !textInput.value) {
    textInput.value = CONFIG.PRESETS[0].text;
    performTokenization();
  }

  // Rebuild 3D visualizer whenever vocab changes
  appState.on("vocab:updated", () => {
    renderVocabularyTable();
    populateEmbeddingSelectors();
    updateDashboardMetrics();
  });
});
