// Precision 3D CAD Viewer (Evolvent Design Style)
// Solid Watertight Manifold Meshes, CAD Edge Outlines, Studio Lighting & View Navigation

class Gear3DViewer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.gearMeshGroups = new Map();
    this.gridHelper = null;
    this.axesHelper = null;
    this.dimensionsGroup = null;
    this.showDimensions = true;
    this.showEdges = true;
    this.materialType = 'metal';
    this.isRunning = false;
    this.simSpeed = 1.0;
    this.clock = new THREE.Clock();

    this.initScene();
    this.initLights();
    this.initHelpers();
    this.setupResizeListener();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1424);

    const aspect = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight);
    this.camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 4000);
    this.camera.position.set(0, 75, 160);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxDistance = 2000;
    this.controls.minDistance = 5;

    // Mobile / Android Touch configuration
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    this.dimensionsGroup = new THREE.Group();
    this.scene.add(this.dimensionsGroup);
  }

  initLights() {
    // Evolvent Design Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    // Key Light (Main soft light from top-front-right)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(90, 140, 160);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    this.scene.add(keyLight);

    // Fill Light (Soft cool light from bottom-left)
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.5);
    fillLight.position.set(-100, -60, -120);
    this.scene.add(fillLight);

    // Rim / Back Light (Creates crisp outline highlighting teeth)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(0, 100, -180);
    this.scene.add(rimLight);
  }

  initHelpers() {
    // Subtle CAD Floor Grid
    this.gridHelper = new THREE.GridHelper(300, 30, 0x3b82f6, 0x1e293b);
    this.gridHelper.position.y = -25;
    this.scene.add(this.gridHelper);

    // Small axes gizmo in corner
    this.axesHelper = new THREE.AxesHelper(20);
    this.axesHelper.position.set(-65, -24, 65);
    this.scene.add(this.axesHelper);
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  resize() {
    if (!this.canvas) return;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  getMaterial(type, colorOverride = null) {
    const isWireframe = (this.materialType === 'wireframe');
    const color = colorOverride ? new THREE.Color(colorOverride) : new THREE.Color(0x3b82f6);

    switch (type || this.materialType) {
      case 'brass':
        return new THREE.MeshStandardMaterial({
          color: colorOverride ? color : new THREE.Color(0xd4af37),
          metalness: 0.85,
          roughness: 0.28,
          wireframe: isWireframe,
          side: THREE.FrontSide
        });
      case 'aluminum':
        return new THREE.MeshStandardMaterial({
          color: colorOverride ? color : new THREE.Color(0xe2e8f0),
          metalness: 0.75,
          roughness: 0.32,
          wireframe: isWireframe,
          side: THREE.FrontSide
        });
      case 'plastic':
        return new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.1,
          roughness: 0.45,
          wireframe: isWireframe,
          side: THREE.FrontSide
        });
      case 'wireframe':
        return new THREE.MeshBasicMaterial({
          color: color,
          wireframe: true
        });
      case 'metal':
      default:
        return new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.82,
          roughness: 0.28,
          wireframe: isWireframe,
          side: THREE.FrontSide
        });
    }
  }

  // Builds a 100% Watertight, Solid 3D Gear with Crisp CAD Edges
  createGearMeshGroup(gearData, params) {
    const group = new THREE.Group();
    group.name = params.id || 'gear';

    const points = gearData.points;
    const thickness = parseFloat(params.faceWidth) || 15;
    const boreRadius = gearData.boreRadius || 0;
    const hasHub = params.hasHub && (parseFloat(params.hubDiameter) > boreRadius * 2);
    const hubDiameter = parseFloat(params.hubDiameter) || (boreRadius * 2 + 10);
    const hubRadius = hubDiameter / 2.0;
    const hubLength = parseFloat(params.hubLength) || 12;

    // 1. Build gear 2D contour shape
    const gearShape = new THREE.Shape();
    if (points && points.length > 0) {
      gearShape.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        gearShape.lineTo(points[i].x, points[i].y);
      }
      gearShape.closePath();
    }

    // Cut bore hole + keyway if applicable
    if (boreRadius > 0 && params.type !== 'rack') {
      const holePath = GearMath.createBoreShapePath(
        boreRadius,
        params.hasKeyway,
        params.keywayWidth,
        params.keywayDepth
      );
      gearShape.holes.push(holePath);
    }

    // Crucial: bevelEnabled: false ensures 100% solid, non-self-intersecting, manifold caps!
    const extrudeSettings = {
      steps: 1,
      depth: thickness,
      bevelEnabled: false
    };

    let gearGeometry = new THREE.ExtrudeGeometry(gearShape, extrudeSettings);

    // Helical Twist or Bevel Taper
    if (params.type === 'helical') {
      const helixAngleDeg = parseFloat(params.helixAngle) || 15;
      const pitchRadius = gearData.pitchRadius || 20;
      const twistTotal = (thickness * Math.tan((helixAngleDeg * Math.PI) / 180)) / pitchRadius;
      
      const pos = gearGeometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const z = pos.getZ(i);
        const rotAngle = (z / thickness) * twistTotal;
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setX(i, x * Math.cos(rotAngle) - y * Math.sin(rotAngle));
        pos.setY(i, x * Math.sin(rotAngle) + y * Math.cos(rotAngle));
      }
      gearGeometry.computeVertexNormals();
    } else if (params.type === 'bevel') {
      const bevelAngle = (parseFloat(params.bevelAngle) || 20) * Math.PI / 180;
      const taperFactor = Math.tan(bevelAngle);
      const pos = gearGeometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const z = pos.getZ(i);
        const scale = 1.0 - (z / thickness) * taperFactor * 0.45;
        pos.setX(i, pos.getX(i) * scale);
        pos.setY(i, pos.getY(i) * scale);
      }
      gearGeometry.computeVertexNormals();
    }

    // Center tooth rim along Z
    gearGeometry.center();

    const gearMat = this.getMaterial(this.materialType, params.color);
    const gearMesh = new THREE.Mesh(gearGeometry, gearMat);
    gearMesh.castShadow = true;
    gearMesh.receiveShadow = true;
    group.add(gearMesh);

    // Crisp CAD Edges (Evolvent Design Aesthetic)
    if (this.showEdges) {
      const edgesGeom = new THREE.EdgesGeometry(gearGeometry, 25);
      const edgeColor = (this.materialType === 'metal' || this.materialType === 'brass') ? 0x1e293b : 0xffffff;
      const edgesMat = new THREE.LineBasicMaterial({
        color: edgeColor,
        linewidth: 1.2,
        transparent: true,
        opacity: 0.55
      });
      const edgesMesh = new THREE.LineSegments(edgesGeom, edgesMat);
      gearMesh.add(edgesMesh);
    }

    // 2. Hub (نافی) Solid Geometry
    if (hasHub && params.type !== 'rack') {
      const hubShape = new THREE.Shape();
      hubShape.absarc(0, 0, hubRadius, 0, Math.PI * 2, false);
      if (boreRadius > 0) {
        const hubHole = GearMath.createBoreShapePath(
          boreRadius,
          params.hasKeyway,
          params.keywayWidth,
          params.keywayDepth
        );
        hubShape.holes.push(hubHole);
      }

      const hubGeom = new THREE.ExtrudeGeometry(hubShape, {
        steps: 1,
        depth: hubLength,
        bevelEnabled: false
      });
      // Center along XY and position protruding forward
      hubGeom.translate(0, 0, thickness / 2.0);

      const hubMat = this.getMaterial(this.materialType, params.color);
      const hubMesh = new THREE.Mesh(hubGeom, hubMat);
      hubMesh.castShadow = true;
      group.add(hubMesh);

      if (this.showEdges) {
        const hubEdgesGeom = new THREE.EdgesGeometry(hubGeom, 25);
        const hubEdges = new THREE.LineSegments(hubEdgesGeom, new THREE.LineBasicMaterial({
          color: 0x1e293b,
          transparent: true,
          opacity: 0.55
        }));
        hubMesh.add(hubEdges);
      }
    }

    // Store custom attributes on group
    group.userData = {
      id: params.id,
      gearData: gearData,
      params: params,
      speed: (params.rpm || 0) * (params.initialDirection || 1),
      currentAngle: 0,
      gearMesh: gearMesh
    };

    return group;
  }

  // Updates or replaces a gear mesh in the scene
  updateGearMesh(params) {
    const gearData = (params.type === 'rack')
      ? GearMath.generateRackProfile(params)
      : GearMath.generateSpurGearProfile(params);

    if (this.gearMeshGroups.has(params.id)) {
      const oldGroup = this.gearMeshGroups.get(params.id);
      this.scene.remove(oldGroup);
      oldGroup.traverse(child => {
        if (child.geometry) child.geometry.dispose();
      });
    }

    const group = this.createGearMeshGroup(gearData, params);

    // Apply 2D Translation in assembly
    group.position.set(parseFloat(params.posX) || 0, parseFloat(params.posY) || 0, 0);

    this.scene.add(group);
    this.gearMeshGroups.set(params.id, group);

    this.updateDimensionsOverlay();
    return gearData;
  }

  removeGear(id) {
    if (this.gearMeshGroups.has(id)) {
      const group = this.gearMeshGroups.get(id);
      this.scene.remove(group);
      group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
      });
      this.gearMeshGroups.delete(id);
      this.updateDimensionsOverlay();
    }
  }

  getGearMeshGroup(id) {
    return this.gearMeshGroups.get(id);
  }

  // Evolvent Design CAD Views
  setView(viewName) {
    const duration = 600;
    let targetPos = new THREE.Vector3();
    let targetUp = new THREE.Vector3(0, 1, 0);

    // Find center and size of all gears
    const center = new THREE.Vector3();
    let count = 0;
    this.gearMeshGroups.forEach(g => {
      center.add(g.position);
      count++;
    });
    if (count > 0) center.divideScalar(count);

    let dist = 140;
    this.gearMeshGroups.forEach(g => {
      const gd = g.userData.gearData;
      if (gd && gd.tipRadius) dist = Math.max(dist, gd.tipRadius * 3.6);
    });

    switch (viewName) {
      case 'top': // 2D Flat View
        targetPos.set(center.x, center.y, dist * 1.3);
        targetUp.set(0, 1, 0);
        break;
      case 'front': // Front Elevation
        targetPos.set(center.x, dist * 1.3, center.z);
        targetUp.set(0, 0, -1);
        break;
      case 'side': // Right Profile
        targetPos.set(center.x + dist * 1.3, center.y, center.z);
        targetUp.set(0, 1, 0);
        break;
      case 'iso': // 3D Isometric View
      default:
        targetPos.set(center.x + dist * 0.7, center.y + dist * 0.7, center.z + dist * 0.85);
        targetUp.set(0, 1, 0);
        break;
    }

    this.animateCamera(targetPos, center, targetUp, duration);
  }

  animateCamera(toPos, toTarget, toUp, duration = 500) {
    const fromPos = this.camera.position.clone();
    const fromTarget = this.controls.target.clone();
    const startTime = performance.now();

    const step = () => {
      const now = performance.now();
      const progress = Math.min((now - startTime) / duration, 1.0);
      const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI); // easeInOutSine

      this.camera.position.lerpVectors(fromPos, toPos, ease);
      this.controls.target.lerpVectors(fromTarget, toTarget, ease);
      this.camera.up.copy(toUp);
      this.controls.update();

      if (progress < 1.0) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  resetView() {
    this.setView('iso');
  }

  toggleDimensions(show) {
    this.showDimensions = (show !== undefined) ? show : !this.showDimensions;
    this.dimensionsGroup.visible = this.showDimensions;
  }

  toggleEdges(show) {
    this.showEdges = (show !== undefined) ? show : !this.showEdges;
    this.gearMeshGroups.forEach(group => {
      const gearMesh = group.userData.gearMesh;
      if (gearMesh) {
        gearMesh.children.forEach(child => {
          if (child.isLineSegments) child.visible = this.showEdges;
        });
      }
    });
  }

  updateDimensionsOverlay() {
    while (this.dimensionsGroup.children.length > 0) {
      const c = this.dimensionsGroup.children[0];
      this.dimensionsGroup.remove(c);
      if (c.geometry) c.geometry.dispose();
    }

    if (!this.showDimensions) return;

    this.gearMeshGroups.forEach(group => {
      const gd = group.userData.gearData;
      if (!gd || !gd.pitchRadius) return;

      const pos = group.position;
      const zOffset = (group.userData.params.faceWidth || 15) / 2.0 + 0.5;

      // 1. Pitch Circle (Dashed Orange)
      const pitchGeom = new THREE.BufferGeometry();
      const pts = [];
      const segs = 64;
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * gd.pitchRadius, Math.sin(a) * gd.pitchRadius, 0));
      }
      pitchGeom.setFromPoints(pts);
      const pitchLine = new THREE.Line(pitchGeom, new THREE.LineDashedMaterial({
        color: 0xf59e0b,
        dashSize: 2,
        gapSize: 1.5,
        linewidth: 1
      }));
      pitchLine.computeLineDistances();
      pitchLine.position.set(pos.x, pos.y, zOffset);
      this.dimensionsGroup.add(pitchLine);

      // 2. Tip Circle (Subtle Blue)
      const tipGeom = new THREE.BufferGeometry();
      const tipPts = [];
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        tipPts.push(new THREE.Vector3(Math.cos(a) * gd.tipRadius, Math.sin(a) * gd.tipRadius, 0));
      }
      tipGeom.setFromPoints(tipPts);
      const tipLine = new THREE.Line(tipGeom, new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35
      }));
      tipLine.position.set(pos.x, pos.y, zOffset);
      this.dimensionsGroup.add(tipLine);
    });
  }

  setMaterialType(type) {
    this.materialType = type;
    this.gearMeshGroups.forEach((group, id) => {
      const params = group.userData.params;
      this.updateGearMesh(params);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    if (this.isRunning) {
      this.gearMeshGroups.forEach(group => {
        const speed = (group.userData.speed || 0) * this.simSpeed;
        const radPerSec = (speed * 2 * Math.PI) / 60;
        group.rotation.z += radPerSec * delta;
      });
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
