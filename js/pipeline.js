/**
 * LLM Pipeline Explorer - Interactive Pipeline Stepper & Inspector
 * Manages the multi-stage visual flow (Input -> Tokenization -> Vocab -> Token IDs -> Embeddings -> 3D Projection -> Attention)
 * Provides interactive stage inspection, automated walkthroughs, and live output display.
 */

class PipelineVisualizer {
  constructor(containerId, detailId, state, tokenizer, embeddingEngine) {
    this.container = document.getElementById(containerId);
    this.detailContainer = document.getElementById(detailId);
    this.state = state;
    this.tokenizer = tokenizer;
    this.embeddingEngine = embeddingEngine;

    this.isPlaying = false;
    this.playTimer = null;

    this.stages = [
      { id: 1, title: "Input Text", subtitle: "Raw Human Language", icon: "💬" },
      { id: 2, title: "Tokenization", subtitle: "Splitting Chunks", icon: "✂️" },
      { id: 3, title: "Vocab Lookup", subtitle: "Dictionary Matching", icon: "📖" },
      { id: 4, title: "Token IDs", subtitle: "Integer Indices", icon: "🔢" },
      { id: 5, title: "Embeddings", subtitle: "High-Dim Vectors", icon: "🧬" },
      { id: 6, title: "3D Projection", subtitle: "Spatial Meaning", icon: "🌐" },
      { id: 7, title: "Self-Attention", subtitle: "Contextual Layer", icon: "⚡" }
    ];

    this.init();
  }

  init() {
    this.renderPipelineCards();
    this.renderStageDetail(this.state.currentStage);

    // Listen to events
    this.state.on("stage:changed", stageId => {
      this.highlightStage(stageId);
      this.renderStageDetail(stageId);
    });

    this.state.on("tokenization:updated", () => {
      this.renderPipelineCards();
      this.renderStageDetail(this.state.currentStage);
    });
  }

  renderPipelineCards() {
    if (!this.container) return;

    const tokens = this.state.currentTokens;
    const rawText = this.state.currentText;

    this.container.innerHTML = this.stages.map((stage, idx) => {
      const isActive = stage.id === this.state.currentStage;
      const previewHTML = this.getStagePreviewHTML(stage.id, rawText, tokens);

      return `
        <div class="pipeline-card ${isActive ? 'active' : ''}" data-stage="${stage.id}">
          <div class="card-step-badge">Step ${stage.id}</div>
          <div class="card-header">
            <span class="card-icon">${stage.icon}</span>
            <div class="card-title-group">
              <h4 class="card-title">${stage.title}</h4>
              <span class="card-sub">${stage.subtitle}</span>
            </div>
          </div>
          <div class="card-live-preview">
            ${previewHTML}
          </div>
          <div class="card-footer">
            <span class="card-inspect-hint">${isActive ? '● Currently Inspecting' : 'Click to inspect'}</span>
          </div>
        </div>
        ${idx < this.stages.length - 1 ? '<div class="pipeline-connector"><div class="connector-arrow"></div></div>' : ''}
      `;
    }).join("");

    // Attach click handlers
    const cards = this.container.querySelectorAll(".pipeline-card");
    cards.forEach(card => {
      card.addEventListener("click", () => {
        const stageId = parseInt(card.getAttribute("data-stage"), 10);
        this.state.setStage(stageId);
      });
    });
  }

  getStagePreviewHTML(stageId, rawText, tokens) {
    if (!tokens || tokens.length === 0) {
      return `<div class="preview-empty">Awaiting text input...</div>`;
    }

    switch (stageId) {
      case 1: // Raw Input
        return `<div class="preview-text">"${rawText.length > 38 ? rawText.slice(0, 35) + '...' : rawText}"</div>`;

      case 2: // Tokenization
        return `
          <div class="preview-tokens">
            ${tokens.slice(0, 4).map(t => `<span class="preview-token-pill" style="border-color:${t.color.border}">${t.raw}</span>`).join("")}
            ${tokens.length > 4 ? `<span class="preview-more">+${tokens.length - 4} more</span>` : ''}
          </div>
        `;

      case 3: // Vocab Lookup
        const knownCount = tokens.filter(t => t.isKnown).length;
        return `
          <div class="preview-stats">
            <span class="badge-known">✓ ${knownCount} found</span>
            ${tokens.length - knownCount > 0 ? `<span class="badge-unk">! ${tokens.length - knownCount} OOV</span>` : ''}
          </div>
        `;

      case 4: // Token IDs
        const ids = tokens.slice(0, 5).map(t => t.id);
        return `<div class="preview-ids">[${ids.join(", ")}${tokens.length > 5 ? ', ...' : ''}]</div>`;

      case 5: // Embeddings
        const firstToken = tokens[0];
        const emb = this.embeddingEngine.getEmbedding(firstToken);
        return `<div class="preview-vector">[${emb.slice(0, 3).map(v => v.toFixed(2)).join(", ")}, ...] <span class="dim-tag">d=16</span></div>`;

      case 6: // 3D Coordinates
        const coords = this.embeddingEngine.projectTo3D(tokens[0]);
        return `<div class="preview-coords">T1: [${coords[0]}, ${coords[1]}, ${coords[2]}]</div>`;

      case 7: // Attention Mechanism
        return `<div class="preview-attention"><span class="pulse-dot"></span> $W_Q, W_K, W_V$ contextual cross-talk</div>`;

      default:
        return "";
    }
  }

  highlightStage(stageId) {
    if (!this.container) return;
    const cards = this.container.querySelectorAll(".pipeline-card");
    cards.forEach(card => {
      const id = parseInt(card.getAttribute("data-stage"), 10);
      card.classList.toggle("active", id === stageId);
    });
  }

  renderStageDetail(stageId) {
    if (!this.detailContainer) return;

    const info = CONFIG.STAGE_EXPLANATIONS[stageId];
    if (!info) return;

    const tokens = this.state.currentTokens;
    const rawText = this.state.currentText;

    // Build specific stage live inspector block
    let inspectorContentHTML = "";

    switch (stageId) {
      case 1:
        inspectorContentHTML = `
          <div class="detail-inspector-box">
            <div class="inspector-label">Current Prompt Stream:</div>
            <div class="code-block">${rawText ? escapeHTML(rawText) : "<em>(No text entered yet. Type in the Tokenization Playground or pick a preset above!)</em>"}</div>
            <div class="inspector-meta">Character length: <strong>${rawText.length}</strong> | Encoding: <strong>UTF-8 (Standard)</strong></div>
          </div>
        `;
        break;

      case 2:
        inspectorContentHTML = `
          <div class="detail-inspector-box">
            <div class="inspector-label">Token Boundaries (${tokens.length} total tokens):</div>
            <div class="tokens-display-wrap">
              ${tokens.map(t => `
                <span class="interactive-token-pill" style="background:${t.color.bg}; border-color:${t.color.border}; color:${t.color.text};" title="Click to inspect token">
                  ${escapeHTML(t.raw)}
                  <span class="pill-id">#${t.id}</span>
                </span>
              `).join("")}
            </div>
          </div>
        `;
        break;

      case 3:
        inspectorContentHTML = `
          <div class="detail-inspector-box">
            <div class="inspector-label">Vocabulary Match Table:</div>
            <div class="table-compact-wrap">
              <table class="compact-table">
                <thead>
                  <tr><th>Token</th><th>Status</th><th>Vocabulary ID</th><th>Semantic Domain</th></tr>
                </thead>
                <tbody>
                  ${tokens.map(t => `
                    <tr>
                      <td><strong>"${escapeHTML(t.raw)}"</strong></td>
                      <td><span class="status-pill status-${t.status}">${t.status.toUpperCase()}</span></td>
                      <td><code>#${t.id}</code></td>
                      <td>${CONFIG.CATEGORIES[t.category] ? CONFIG.CATEGORIES[t.category].name : t.category}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        `;
        break;

      case 4:
        inspectorContentHTML = `
          <div class="detail-inspector-box">
            <div class="inspector-label">Tensor Input Format (1D Integer Array):</div>
            <div class="code-block">[ ${tokens.map(t => `<span class="id-number">${t.id}</span>`).join(", ")} ]</div>
            <div class="inspector-meta">PyTorch shape: <code>torch.tensor([${tokens.map(t => t.id).join(", ")}], dtype=torch.long).unsqueeze(0)</code> -> <code>[1, ${tokens.length}]</code></div>
          </div>
        `;
        break;

      case 5:
        const sampleToken = tokens.length > 0 ? tokens[0] : null;
        const emb = sampleToken ? this.embeddingEngine.getEmbedding(sampleToken) : [];
        inspectorContentHTML = `
          <div class="detail-inspector-box">
            <div class="inspector-label">First Token ("${sampleToken ? sampleToken.raw : 'N/A'}") 16-Dimensional Embedding Vector:</div>
            <div class="vector-heatmap-grid">
              ${sampleToken ? this.embeddingEngine.formatVectorHTML(emb) : '<em>Tokenize text to inspect vectors</em>'}
            </div>
            <div class="inspector-meta">Weight Lookup: Matrix multiplication $\\mathbf{e}_k = \\mathbf{x}_k W_e$, where $W_e \\in \\mathbb{R}^{V \\times 16}$</div>
          </div>
        `;
        break;

      case 6:
        inspectorContentHTML = `
          <div class="detail-inspector-box">
            <div class="inspector-label">3D PCA Coordinates for Current Sequence:</div>
            <div class="coords-list">
              ${tokens.map((t, idx) => {
                const c = this.embeddingEngine.projectTo3D(t);
                return `<div class="coord-item"><span class="ci-num">T${idx + 1} ("${t.raw}"):</span> <code>X: ${c[0]}, Y: ${c[1]}, Z: ${c[2]}</code></div>`;
              }).join("")}
            </div>
            <div class="inspector-meta">💡 Switch to the <strong>3D Explorer</strong> tab to interact with these coordinates in real-time space!</div>
          </div>
        `;
        break;

      case 7:
        inspectorContentHTML = `
          <div class="detail-inspector-box">
            <div class="inspector-label">How Multi-Head Self-Attention Evolves Static Embeddings:</div>
            <div class="attention-diagram-box">
              <div class="attn-col">
                <strong>1. Projection</strong>
                <p>Vector $\\mathbf{x}_i$ is multiplied by 3 learned weight matrices to produce:</p>
                <ul>
                  <li>Query: $Q = \\mathbf{x}_i W_Q$</li>
                  <li>Key: $K = \\mathbf{x}_j W_K$</li>
                  <li>Value: $V = \\mathbf{x}_j W_V$</li>
                </ul>
              </div>
              <div class="attn-col">
                <strong>2. Scaled Dot-Product</strong>
                <p>Computes contextual attention weight between token $i$ and all other tokens $j$:</p>
                <code>\\alpha_{i,j} = \\text{softmax}\\left(\\frac{Q_i K_j^T}{\\sqrt{d_k}}\\right)</code>
              </div>
              <div class="attn-col">
                <strong>3. Contextual Vector</strong>
                <p>New token vector is a weighted sum of all values: $\\mathbf{z}_i = \\sum_j \\alpha_{i,j} V_j$</p>
                <div class="highlight-callout">This allows the word "bank" to know whether it means a river bank or a financial institution!</div>
              </div>
            </div>
          </div>
        `;
        break;
    }

    this.detailContainer.innerHTML = `
      <div class="stage-detail-card">
        <div class="sd-header">
          <div class="sd-step-num">STAGE ${stageId} OF 7</div>
          <h3 class="sd-title">${info.name}: <span class="sd-tagline">${info.tagline}</span></h3>
        </div>
        <p class="sd-desc">${info.description}</p>

        <div class="sd-io-flow">
          <div class="io-box">
            <span class="io-type">STAGE INPUT</span>
            <span class="io-val">${info.inputLabel}</span>
          </div>
          <div class="io-arrow">➔</div>
          <div class="io-box io-output">
            <span class="io-type">STAGE OUTPUT</span>
            <span class="io-val">${info.outputLabel}</span>
          </div>
        </div>

        ${inspectorContentHTML}

        <div class="sd-real-world">
          <div class="rw-title"><span class="rw-badge">Real-World LLM Architecture</span> Behind the scenes:</div>
          <p class="rw-desc">${info.realWorldDetail}</p>
        </div>
      </div>
    `;
  }

  // Next / Prev stage navigation
  nextStage() {
    const next = this.state.currentStage >= 7 ? 1 : this.state.currentStage + 1;
    this.state.setStage(next);
  }

  prevStage() {
    const prev = this.state.currentStage <= 1 ? 7 : this.state.currentStage - 1;
    this.state.setStage(prev);
  }

  // Automated step-through animation
  togglePlay(btnEl) {
    if (this.isPlaying) {
      this.stopPlay(btnEl);
    } else {
      this.startPlay(btnEl);
    }
  }

  startPlay(btnEl) {
    this.isPlaying = true;
    if (btnEl) {
      btnEl.innerHTML = `<span class="icon">⏸</span> Pause Tour`;
      btnEl.classList.add("playing");
    }

    this.playTimer = setInterval(() => {
      this.nextStage();
    }, 2800);
  }

  stopPlay(btnEl) {
    this.isPlaying = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    if (btnEl) {
      btnEl.innerHTML = `<span class="icon">▶</span> Walkthrough Tour`;
      btnEl.classList.remove("playing");
    }
  }
}

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
