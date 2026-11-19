# LLM Pipeline Explorer ⚡

An interactive, modern, and educational web application that visually demonstrates how Large Language Models (LLMs) process human language internally.

Designed for beginners, students, AI practitioners, and engineers to demystify the transformation of text into tokens, integer tensors, high-dimensional numerical vectors, and 3D geometric embedding spaces.

---

## 🌟 Core Journey & Architecture

```
[Raw Human Text]
       │
       ▼
[Stage 1: Input Text]          ➔ Unicode string normalization & UTF-8 bytes
       │
       ▼
[Stage 2: Tokenization]        ➔ Splitting text into discrete chunks (words, subwords, punctuation)
       │
       ▼
[Stage 3: Vocabulary Lookup]   ➔ Matching tokens against master dictionary (ID mapping & OOV handling)
       │
       ▼
[Stage 4: Token IDs]           ➔ Converting tokens into 1D integer arrays (PyTorch / JAX tensors)
       │
       ▼
[Stage 5: Embedding Matrix]    ➔ Extracting dense numerical vectors W_e[id] (d_model dimensions)
       │
       ▼
[Stage 6: 3D Spatial Galaxy]   ➔ PCA dimensionality reduction to [X, Y, Z] spatial coordinates
       │
       ▼
[Stage 7: Contextual Layer]    ➔ Multi-Head Self-Attention (Query, Key, Value) contextualization
```

---

## ✨ Features & Modules

### 1. 📊 Interactive Dashboard
- Real-time statistics: Total vocabulary words, custom user words, tokens processed, and visualized embeddings.
- High-level pipeline flow roadmap.
- Recent tokenization activity log with one-click reloading of previous prompts.

### 2. ✂️ Tokenization Playground
- Large text input supporting sentences and paragraphs.
- One-click sample presets (e.g. Pangram, "Attention is all you need", Vector Analogies, Nature & Animals).
- Real-time dynamic token slicing with unique color hues for adjacent tokens.
- Visual token boundary indicators and whitespace tracking.
- Sequence metrics: Total tokens, word count, character count, and tokens-per-word ratio.
- Click any token to inspect its Token ID, vocabulary status, subword notes, and 16-D embedding.

### 3. 📖 Vocabulary Explorer
- Complete searchable master dictionary with Token IDs, words, semantic categories, and estimated corpus frequencies.
- Real-time instant search by word, Token ID (`#25`), or category.
- Categorical domain filtering (AI & Tech, Royalty/Human, Animals, Verbs, Adjectives, Nature, Grammar, Custom).
- Ascending and descending sorting by Token ID, Alphabetical order, or Frequency.
- Direct row inspection and custom word deletion.

### 4. ➕ Add Custom Words (Dynamic Vocabulary Expansion)
- Add new words with automated unique Token ID generation.
- Duplicate prevention and whitespace validation.
- Immediate integration into the tokenizer and 3D embedding space.
- Local persistence using `localStorage` (survives page refreshes).
- **Essential AI Disclaimer**: Transparently explains that adding words expands this educational demo's vocabulary without modifying the pre-trained weights of a real neural network.

### 5. 🧬 High-Dimensional Embedding Explorer
- Realistic deterministic 16-dimensional embedding vectors ($d_{model} = 16$).
- Interactive 16-D color heatmap showing positive vs negative dimensional activations ($[-1.0, +1.0]$).
- Complete raw numerical array export (`[+0.25, -0.42, +0.81, ...]`).
- **Semantic Cosine Similarity Calculator**:
  $$\cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}$$
  - Compare any two tokens (e.g. `king` vs `queen`, `cat` vs `dog`, `neural` vs `transformer`).
  - Visual score meter (-1.0 to +1.0) and Euclidean distance readout.
  - Deep educational explanations of directional vector alignment in neural spaces.

### 6. 🌐 3D Embedding Galaxy (Three.js)
- Fully interactive WebGL 3D embedding space powered by Three.js.
- Words rendered as glowing spheres colored by semantic cluster.
- Billboard text sprites for clear token labels.
- Mouse orbit controls: Rotate (left click + drag), Zoom (scroll wheel), Pan (right click + drag).
- Raycasted hover tooltips with coordinates and Token IDs.
- Click selection with animated pulsing ring and camera fly-to animation.
- **Sentence Trajectory Path**: Draws an animated glowing 3D spline connecting words in the input prompt in sequence!
- Controls: Toggle labels ON/OFF, Toggle trajectory ON/OFF, Reset camera, and 3D word search.
- Clear educational notice explaining PCA dimensionality reduction.

### 7. 🔄 Pipeline Stepper & Walkthrough Tour
- Step-by-step visual cards for all 7 stages.
- Automated walkthrough tour mode with play/pause timer.
- Detailed stage breakdown showing Stage Input, Stage Output, live data preview, and "Behind the Scenes in Real LLMs" notes.

### 8. 💡 About LLM Pipeline (Educational Q&A)
- In-depth beginner-friendly answers to the 8 core concepts:
  1. What is a token?
  2. Why do LLMs tokenize text?
  3. What is a vocabulary?
  4. What is a Token ID?
  5. What are embeddings?
  6. Why are embeddings represented as vectors?
  7. What does 3D projection mean?
  8. Why do semantically related words have similar representations?

---

## 🛠️ Technology Stack

- **HTML5 & CSS3**: Pure modern CSS with CSS variables, Glassmorphism, and responsive Grid/Flexbox layouts.
- **JavaScript (ES6+)**: Modular, clean architecture (Config, State, Tokenizer, Embeddings, 3D Visualizer, Pipeline, App).
- **Three.js (r128)** & **OrbitControls**: 3D scene rendering, lighting, raycasting, and camera animation.
- **Persistence**: Browser `localStorage` for custom vocabulary, query history, and application statistics.
- **Dependencies**: Zero backend, zero database, zero external API keys required. Runs 100% locally in any modern web browser.

---

## 🚀 Getting Started

Simply open `index.html` in any modern web browser, or serve it using Python:

```bash
# Start local static server
python3 -m http.server 3000
```

Then visit:
[http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
LLM-PipeLine/
├── index.html               # Main single-page application markup
├── css/
│   ├── main.css             # Theme variables, typography, navigation, layout
│   ├── components.css       # Cards, tables, forms, badges, modals, tooltips
│   └── pipeline.css         # Pipeline stepper, 3D viewport, similarity tool
├── js/
│   ├── config.js            # Initial base vocabulary, categories, presets, constants
│   ├── state.js             # Reactive state management, localStorage, pub-sub
│   ├── tokenizer.js         # Educational tokenizer, token IDs, boundary detection
│   ├── embeddings.js        # Deterministic 16-D vectors, cosine similarity, PCA
│   ├── visualizer3d.js      # Three.js 3D visualizer, orbit controls, trajectory
│   ├── pipeline.js          # Interactive pipeline stepper & stage inspector
│   └── app.js               # Main orchestrator, view routing, UI event listeners
└── README.md                # Documentation and architectural guide
```
