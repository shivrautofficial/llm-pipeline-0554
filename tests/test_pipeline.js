/**
 * Automated Test Suite for LLM Pipeline Explorer
 * Tests configuration, state store, tokenizer, embeddings, and similarity metrics.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock browser global environment
const mockStorage = {};
const localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

const context = {
  console: console,
  localStorage: localStorage,
  Math: Math,
  Date: Date,
  parseInt: parseInt,
  parseFloat: parseFloat,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  Map: Map,
  Set: Set,
  RegExp: RegExp,
  THREE: {
    Color: class {},
    Vector3: class { constructor(x,y,z){ this.x=x;this.y=y;this.z=z; } },
    Vector2: class { constructor(x,y){ this.x=x;this.y=y; } },
    CatmullRomCurve3: class { getPoints(){ return []; } },
    BufferGeometry: class { setFromPoints(){} setAttribute(){} },
    LineDashedMaterial: class {},
    Line: class { computeLineDistances(){} },
    SphereGeometry: class {},
    MeshStandardMaterial: class {},
    Mesh: class { constructor(){ this.position={x:0,y:0,z:0,set:function(x,y,z){this.x=x;this.y=y;this.z=z;},clone:()=>({x:0,y:0,z:0})}; } },
    Scene: class {},
    PerspectiveCamera: class { position={x:0,y:0,z:0,copy:()=>{}} },
    WebGLRenderer: class { setSize(){} setPixelRatio(){} domElement={} },
    Raycaster: class {}
  }
};

vm.createContext(context);

function loadScript(filePath) {
  const code = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
  vm.runInContext(code, context);
}

// 1. Load scripts in sequence
console.log("Loading modules...");
loadScript('js/config.js');
loadScript('js/state.js');
loadScript('js/tokenizer.js');
loadScript('js/embeddings.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✕ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log("\n--- Testing Module 1 & 2: Vocabulary & Custom Words ---");
const state = vm.runInContext('appState', context);
const EducationalTokenizer = vm.runInContext('EducationalTokenizer', context);
const embEngine = vm.runInContext('embeddingEngine', context);
assert(state.vocabList.length >= 100, `Base vocabulary loaded (${state.vocabList.length} words)`);
assert(state.hasWord("transformer"), "Lookup 'transformer' exists in vocabulary");
assert(state.lookup("the").id === 5, "Token 'the' maps to ID 5");

// Test adding a custom word
const addRes = state.addCustomWord("quantum", "ai_tech");
assert(addRes.success === true, "Add custom word 'quantum' succeeds");
assert(state.hasWord("quantum"), "'quantum' is now registered in vocabulary");
const quantumEntry = state.lookup("quantum");
assert(quantumEntry.isCustom === true, "'quantum' is marked as custom");
assert(quantumEntry.id > 100, `Generated unique Token ID #${quantumEntry.id}`);

// Test duplicate prevention
const dupRes = state.addCustomWord("quantum", "ai_tech");
assert(dupRes.success === false, "Duplicate word addition is blocked");

// Test invalid empty or space-separated word
const invalidRes = state.addCustomWord("hello world", "custom");
assert(invalidRes.success === false, "Multi-word with spaces is blocked");

// Test deleting custom word
const delRes = state.deleteCustomWord(quantumEntry.id);
assert(delRes.success === true, "Deleting custom word succeeds");
assert(!state.hasWord("quantum"), "'quantum' successfully removed");

console.log("\n--- Testing Module 3: Tokenization Playground ---");
const tokenizer = new EducationalTokenizer(state);
const sampleText = "The quick brown fox jumps over the lazy dog.";
const tokens = tokenizer.tokenize(sampleText);

assert(tokens.length === 10, `Pangram tokenized into 10 tokens (got ${tokens.length})`);
assert(tokens[0].raw === "The", "First token is 'The'");
assert(tokens[0].id === 5, "'The' (case-insensitive) maps to ID #5");
assert(tokens[3].raw === "fox" && tokens[3].id === 43, "'fox' maps to Token ID #43");
assert(tokens[9].raw === "." && tokens[9].status === "punctuation", "Period '.' detected as punctuation");

const stats = tokenizer.getStats(sampleText, tokens);
assert(stats.wordCount === 9, `Word count calculated accurately (${stats.wordCount})`);
assert(stats.tokenCount === 10, `Token count calculated accurately (${stats.tokenCount})`);

// Test out-of-vocabulary token
const oovTokens = tokenizer.tokenize("Supercalifragilistic");
assert(oovTokens.length === 1, "OOV word tokenized");
assert(oovTokens[0].status === "oov", "Marked as out-of-vocabulary");
assert(oovTokens[0].id === 1, "OOV maps to <unk> (ID 1)");
assert(oovTokens[0].subwordNote.includes("Byte-Pair Encoding"), "Subword note contains BPE explanation");

console.log("\n--- Testing Module 4: High-Dimensional Embeddings & Cosine Similarity ---");
const kingEntry = state.lookup("king");
const queenEntry = state.lookup("queen");
const wolfEntry = state.lookup("wolf");
const forestEntry = state.lookup("forest");

assert(kingEntry !== null && queenEntry !== null, "King and Queen found in vocab");

const vecKing = embEngine.getEmbedding(kingEntry);
const vecQueen = embEngine.getEmbedding(queenEntry);
const vecWolf = embEngine.getEmbedding(wolfEntry);
const vecForest = embEngine.getEmbedding(forestEntry);

assert(vecKing.length === 16, `Embedding vector has exactly 16 dimensions (d_model = 16)`);

// Check unit length normalization
const normKing = Math.sqrt(vecKing.reduce((s, v) => s + v * v, 0));
assert(Math.abs(normKing - 1.0) < 0.05, `Vector is unit normalized (norm = ${normKing.toFixed(4)})`);

// Cosine similarity test: Related concepts (king & queen) vs distant concepts
const simKingQueen = embEngine.computeCosineSimilarity(vecKing, vecQueen);
const simKingWolf = embEngine.computeCosineSimilarity(vecKing, vecWolf);
console.log(`  Similarity(king, queen): ${simKingQueen.toFixed(4)}`);
console.log(`  Similarity(king, wolf): ${simKingWolf.toFixed(4)}`);

assert(simKingQueen > 0.5, `King & Queen have high semantic similarity (${simKingQueen.toFixed(4)} > 0.5)`);
assert(simKingQueen > simKingWolf, `King is closer to Queen than to Wolf (${simKingQueen.toFixed(4)} > ${simKingWolf.toFixed(4)})`);

// Test 3D Projection
const coords = embEngine.projectTo3D(kingEntry);
assert(Array.isArray(coords) && coords.length === 3, `3D Projection returns [X, Y, Z] (${coords.join(", ")})`);

console.log(`\n========================================`);
console.log(`Tests Completed: ${passedTests}/${totalTests} Passed!`);
console.log(`========================================\n`);
