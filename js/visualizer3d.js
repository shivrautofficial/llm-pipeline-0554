/**
 * LLM Pipeline Explorer - Three.js 3D Embedding Visualizer
 * Renders vocabulary tokens as glowing 3D nodes, handles orbit controls,
 * camera transitions, hover tooltips, click selection, cluster coloring,
 * billboard text sprites, and sentence trajectory paths.
 */

class Visualizer3D {
  constructor(containerId, state, embeddingEngine) {
    this.container = document.getElementById(containerId);
    this.state = state;
    this.embeddingEngine = embeddingEngine;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Node tracking
    this.nodeMeshes = []; // array of sphere meshes
    this.labelSprites = []; // array of billboard sprite labels
    this.meshToItemMap = new Map();
    this.itemToMeshMap = new Map();

    // Interaction & Animation
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.hoveredItem = null;
    this.selectedMesh = null;
    this.highlightRing = null;
    this.trajectoryLine = null;
    this.trajectoryPoints = [];

    // Settings
    this.showLabels = true;
    this.showTrajectory = true;
    this.isOrbiting = false;

    // Tooltip DOM element
    this.tooltipEl = null;

    // Default camera position
    this.defaultCameraPos = new THREE.Vector3(0, 25, 45);
    this.defaultTarget = new THREE.Vector3(0, 0, 0);

    // Camera animation target
    this.targetCameraPos = null;
    this.targetLookAt = null;

    this.init();
  }

  init() {
    if (!this.container) {
      console.error("3D Visualizer container not found!");
      return;
    }

    this.createTooltip();
    this.setupScene();
    this.setupLights();
    this.setupCosmicBackground();
    this.setupSelectionIndicator();
    this.populateNodes();
    this.setupEventListeners();
    this.animate();

    // Listen to state changes
    this.state.on("vocab:updated", () => this.refreshNodes());
    this.state.on("tokenization:updated", data => this.updateSentenceTrajectory(data.tokens));
    this.state.on("token:selected", token => this.focusToken(token));
  }

  createTooltip() {
    let el = document.getElementById("canvas-3d-tooltip");
    if (!el) {
      el = document.createElement("div");
      el.id = "canvas-3d-tooltip";
      el.className = "canvas-tooltip";
      el.style.display = "none";
      this.container.appendChild(el);
    }
    this.tooltipEl = el;
  }

  setupScene() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 550;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0d14, 0.012);

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.copy(this.defaultCameraPos);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = false;
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls
    if (typeof THREE.OrbitControls !== "undefined") {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 140;
      this.controls.minDistance = 5;
      this.controls.target.copy(this.defaultTarget);
    } else {
      console.warn("THREE.OrbitControls not loaded, interactive camera panning disabled.");
    }

    // Grid helper with subtle opacity
    const grid = new THREE.GridHelper(60, 30, 0x3b82f6, 0x1e293b);
    grid.position.y = -18;
    grid.material.opacity = 0.25;
    grid.material.transparent = true;
    this.scene.add(grid);

    // Subtle 3D Axis indicator in center
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.material.opacity = 0.35;
    axesHelper.material.transparent = true;
    this.scene.add(axesHelper);
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const pointLightCyan = new THREE.PointLight(0x06b6d4, 2, 80);
    pointLightCyan.position.set(25, 30, 25);
    this.scene.add(pointLightCyan);

    const pointLightPurple = new THREE.PointLight(0x8b5cf6, 2, 80);
    pointLightPurple.position.set(-25, -20, -25);
    this.scene.add(pointLightPurple);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 40, 20);
    this.scene.add(dirLight);
  }

  setupCosmicBackground() {
    // Starfield particle cloud
    const starCount = 600;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 160;

      // Color variation (cyan to purple to white)
      const r = Math.random() > 0.5 ? 0.38 : 0.85;
      const g = Math.random() > 0.5 ? 0.72 : 0.85;
      const b = 1.0;
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.55
    });

    const starField = new THREE.Points(geometry, material);
    this.scene.add(starField);
  }

  setupSelectionIndicator() {
    // Glowing ring around selected node
    const ringGeo = new THREE.RingGeometry(1.6, 2.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.highlightRing = new THREE.Mesh(ringGeo, ringMat);
    this.highlightRing.visible = false;
    this.scene.add(this.highlightRing);
  }

  // Create crisp billboard text sprite for token label
  createTextSprite(text, colorHex) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    // Clean background pill with safe roundRect fallback
    const drawPill = () => {
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(10, 8, 236, 48, 10);
      } else {
        ctx.rect(10, 8, 236, 48);
      }
    };

    ctx.fillStyle = "rgba(10, 15, 29, 0.75)";
    ctx.beginPath();
    drawPill();
    ctx.fill();

    // Border
    ctx.strokeStyle = colorHex || "#38bdf8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    drawPill();
    ctx.stroke();

    // Text
    ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.8, 0.95, 1);
    return sprite;
  }

  populateNodes() {
    this.clearNodes();

    const items = this.state.vocabList;
    const sphereGeometry = new THREE.SphereGeometry(0.9, 24, 24);

    items.forEach(item => {
      const coords = this.embeddingEngine.projectTo3D(item);
      const catInfo = CONFIG.CATEGORIES[item.category] || CONFIG.CATEGORIES.custom;
      const colorHex = catInfo.color || "#38bdf8";
      const threeColor = new THREE.Color(colorHex);

      // Node mesh
      const material = new THREE.MeshStandardMaterial({
        color: threeColor,
        roughness: 0.25,
        metalness: 0.4,
        emissive: threeColor,
        emissiveIntensity: item.isCustom ? 0.45 : 0.2
      });

      const mesh = new THREE.Mesh(sphereGeometry, material);
      mesh.position.set(coords[0], coords[1], coords[2]);

      // Attach metadata for raycasting & inspector
      mesh.userData = {
        vocabItem: item,
        baseColor: threeColor,
        originalScale: 1.0
      };

      this.scene.add(mesh);
      this.nodeMeshes.push(mesh);
      this.meshToItemMap.set(mesh, item);
      this.itemToMeshMap.set(item.id, mesh);

      // Create text label sprite floating right above node
      const sprite = this.createTextSprite(item.word, colorHex);
      sprite.position.set(coords[0], coords[1] + 1.6, coords[2]);
      sprite.visible = this.showLabels;
      this.scene.add(sprite);
      this.labelSprites.push(sprite);
      mesh.userData.sprite = sprite;
    });
  }

  clearNodes() {
    this.nodeMeshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
      this.scene.remove(mesh);
    });
    this.labelSprites.forEach(sprite => {
      if (sprite.material.map) sprite.material.map.dispose();
      if (sprite.material) sprite.material.dispose();
      this.scene.remove(sprite);
    });

    this.nodeMeshes = [];
    this.labelSprites = [];
    this.meshToItemMap.clear();
    this.itemToMeshMap.clear();

    if (this.highlightRing) {
      this.highlightRing.visible = false;
    }
  }

  refreshNodes() {
    this.populateNodes();
    // Re-apply sentence trajectory if current text exists
    if (this.state.currentTokens.length > 0) {
      this.updateSentenceTrajectory(this.state.currentTokens);
    }
  }

  // Draw animated spline trajectory connecting tokens in sentence
  updateSentenceTrajectory(tokens) {
    if (this.trajectoryLine) {
      this.scene.remove(this.trajectoryLine);
      if (this.trajectoryLine.geometry) this.trajectoryLine.geometry.dispose();
      if (this.trajectoryLine.material) this.trajectoryLine.material.dispose();
      this.trajectoryLine = null;
    }

    if (!tokens || tokens.length < 2 || !this.showTrajectory) {
      return;
    }

    const points = [];
    tokens.forEach(t => {
      const mesh = this.itemToMeshMap.get(t.id);
      if (mesh) {
        points.push(mesh.position.clone());
      }
    });

    if (points.length < 2) return;

    // Build smooth 3D Catmull-Rom spline curve
    const curve = new THREE.CatmullRomCurve3(points);
    const splinePoints = curve.getPoints(points.length * 12);
    const geometry = new THREE.BufferGeometry().setFromPoints(splinePoints);

    const material = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      linewidth: 2,
      scale: 1,
      dashSize: 1.2,
      gapSize: 0.6,
      transparent: true,
      opacity: 0.85
    });

    this.trajectoryLine = new THREE.Line(geometry, material);
    this.trajectoryLine.computeLineDistances();
    this.scene.add(this.trajectoryLine);
  }

  // Focus and fly camera to selected token
  focusToken(token) {
    if (!token) return;

    const mesh = this.itemToMeshMap.get(token.id);
    if (!mesh) return;

    this.selectMesh(mesh);

    // Smoothly animate camera toward node
    const targetPos = mesh.position.clone();
    this.targetLookAt = targetPos.clone();
    this.targetCameraPos = targetPos.clone().add(new THREE.Vector3(0, 4, 12));
  }

  selectMesh(mesh) {
    if (this.selectedMesh) {
      // Restore previous mesh
      this.selectedMesh.material.emissiveIntensity = this.selectedMesh.userData.vocabItem.isCustom ? 0.45 : 0.2;
      this.selectedMesh.scale.set(1, 1, 1);
    }

    this.selectedMesh = mesh;

    if (mesh) {
      // Highlight selected mesh
      mesh.material.emissiveIntensity = 0.9;
      mesh.scale.set(1.4, 1.4, 1.4);

      // Attach glowing ring
      this.highlightRing.position.copy(mesh.position);
      this.highlightRing.visible = true;
    } else {
      this.highlightRing.visible = false;
    }
  }

  setupEventListeners() {
    const dom = this.renderer.domElement;

    // Mouse move for raycasting hover tooltip
    dom.addEventListener("mousemove", e => {
      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.updateTooltipPosition(e.clientX, e.clientY);
    });

    dom.addEventListener("mouseleave", () => {
      this.mouse.x = -999;
      this.mouse.y = -999;
      this.hideTooltip();
    });

    // Click on node to inspect & select
    dom.addEventListener("click", e => {
      if (this.hoveredItem) {
        this.state.selectToken(this.hoveredItem);
      }
    });

    // Window resize
    window.addEventListener("resize", () => this.handleResize());
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  updateTooltipPosition(clientX, clientY) {
    if (!this.tooltipEl) return;
    const rect = this.container.getBoundingClientRect();
    const x = clientX - rect.left + 16;
    const y = clientY - rect.top + 16;
    this.tooltipEl.style.left = `${x}px`;
    this.tooltipEl.style.top = `${y}px`;
  }

  showTooltip(item) {
    if (!this.tooltipEl || !item) return;
    const cat = CONFIG.CATEGORIES[item.category] || CONFIG.CATEGORIES.custom;
    const coords = this.embeddingEngine.projectTo3D(item);

    this.tooltipEl.innerHTML = `
      <div class="tt-header">
        <span class="tt-word">"${item.word}"</span>
        <span class="tt-id">ID: #${item.id}</span>
      </div>
      <div class="tt-category" style="color: ${cat.color};">● ${cat.name}</div>
      <div class="tt-coords">3D Projection: [${coords[0]}, ${coords[1]}, ${coords[2]}]</div>
      <div class="tt-hint">Click node to inspect 16-D embedding</div>
    `;
    this.tooltipEl.style.display = "block";
  }

  hideTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.style.display = "none";
    }
  }

  toggleLabels(visible) {
    this.showLabels = visible;
    this.labelSprites.forEach(sprite => {
      sprite.visible = visible;
    });
  }

  toggleTrajectory(visible) {
    this.showTrajectory = visible;
    if (this.trajectoryLine) {
      this.trajectoryLine.visible = visible;
    }
    if (visible && !this.trajectoryLine && this.state.currentTokens.length > 1) {
      this.updateSentenceTrajectory(this.state.currentTokens);
    }
  }

  resetCamera() {
    this.targetCameraPos = this.defaultCameraPos.clone();
    this.targetLookAt = this.defaultTarget.clone();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update orbit controls
    if (this.controls) {
      this.controls.update();
    }

    // Smooth camera transition if target is set
    if (this.targetCameraPos) {
      this.camera.position.lerp(this.targetCameraPos, 0.08);
      if (this.controls && this.targetLookAt) {
        this.controls.target.lerp(this.targetLookAt, 0.08);
      }
      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.2) {
        this.targetCameraPos = null;
        this.targetLookAt = null;
      }
    }

    // Animate selection highlight ring (slow spin & pulse)
    if (this.highlightRing && this.highlightRing.visible) {
      this.highlightRing.rotation.z += 0.02;
      this.highlightRing.lookAt(this.camera.position);
    }

    // Raycast hover detection
    this.checkHover();

    this.renderer.render(this.scene, this.camera);
  }

  checkHover() {
    if (this.mouse.x === -999) {
      if (this.hoveredItem) {
        this.hoveredItem = null;
        this.hideTooltip();
        this.container.style.cursor = "default";
      }
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodeMeshes);

    if (intersects.length > 0) {
      const topMesh = intersects[0].object;
      const item = this.meshToItemMap.get(topMesh);

      if (item && item !== this.hoveredItem) {
        this.hoveredItem = item;
        this.showTooltip(item);
        this.container.style.cursor = "pointer";
      }
    } else {
      if (this.hoveredItem) {
        this.hoveredItem = null;
        this.hideTooltip();
        this.container.style.cursor = "default";
      }
    }
  }
}
