// Precision 3D CAD Viewer (Swiss3D Standard)
// Watertight Manifold Geometry, Rack & Pinion Meshing, Perpendicular Setscrew Hole & Day/Night CAD Studios

class Gear3DViewer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.gearMeshGroups = new Map();
    this.rackMeshGroup = null;
    this.gridHelper = null;
    this.axesHelper = null;
    this.dimensionsGroup = null;
    this.showDimensions = true;
    this.showEdges = true;
    this.materialType = 'metal';
    this.isRunning = false;
    this.simSpeed = 1.0;
    this.clock = new THREE.Clock();
    this.currentTheme = 'dark';

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
    this.camera.position.set(0, 80, 160);

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

    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    this.dimensionsGroup = new THREE.Group();
    this.scene.add(this.dimensionsGroup);
  }

  initLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    this.keyLight.position.set(100, 150, 180);
    this.keyLight.castShadow = true;
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0x93c5fd, 0.5);
    this.fillLight.position.set(-120, -60, -100);
    this.scene.add(this.fillLight);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
    this.rimLight.position.set(0, 100, -200);
    this.scene.add(this.rimLight);
  }

  initHelpers() {
    this.gridHelper = new THREE.GridHelper(300, 30, 0x3b82f6, 0x1e293b);
    this.gridHelper.position.y = -35;
    this.scene.add(this.gridHelper);

    this.axesHelper = new THREE.AxesHelper(20);
    this.axesHelper.position.set(-65, -34, 65);
    this.scene.add(this.axesHelper);
  }

  setTheme(theme) {
    this.currentTheme = theme;
    if (theme === 'light') {
      // Clean Swiss CAD studio light gray
      this.scene.background.setHex(0xf1f5f9);
      this.ambientLight.intensity = 0.9;
      this.keyLight.intensity = 0.85;
      this.fillLight.color.setHex(0xcfd8dc);

      if (this.gridHelper) {
        this.scene.remove(this.gridHelper);
        this.gridHelper = new THREE.GridHelper(300, 30, 0x94a3b8, 0xcbd5e1);
        this.gridHelper.position.y = -35;
        this.scene.add(this.gridHelper);
      }
    } else {
      // Dark CAD studio
      this.scene.background.setHex(0x0e1424);
      this.ambientLight.intensity = 0.75;
      this.keyLight.intensity = 0.95;
      this.fillLight.color.setHex(0x93c5fd);

      if (this.gridHelper) {
        this.scene.remove(this.gridHelper);
        this.gridHelper = new THREE.GridHelper(300, 30, 0x3b82f6, 0x1e293b);
        this.gridHelper.position.y = -35;
        this.scene.add(this.gridHelper);
      }
    }
    this.updateDimensionsOverlay();
  }

  setupResizeListener() {
    window.addEventListener('resize', () => this.resize());
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
    const isWire = (this.materialType === 'wireframe');
    const color = colorOverride ? new THREE.Color(colorOverride) : new THREE.Color(0x3b82f6);

    switch (type || this.materialType) {
      case 'brass':
        return new THREE.MeshStandardMaterial({
          color: colorOverride ? color : new THREE.Color(0xd4af37),
          metalness: 0.88,
          roughness: 0.25,
          wireframe: isWire,
          side: THREE.FrontSide
        });
      case 'aluminum':
        return new THREE.MeshStandardMaterial({
          color: colorOverride ? color : new THREE.Color(0xe2e8f0),
          metalness: 0.78,
          roughness: 0.3,
          wireframe: isWire,
          side: THREE.FrontSide
        });
      case 'plastic':
        return new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.1,
          roughness: 0.45,
          wireframe: isWire,
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
          metalness: 0.85,
          roughness: 0.25,
          wireframe: isWire,
          side: THREE.FrontSide
        });
    }
  }

  // Builds a 100% Watertight Solid 3D Gear with Hub & Perpendicular Setscrew
  createGearMeshGroup(gearData, params) {
    const group = new THREE.Group();
    group.name = params.id || 'gear';

    const points = gearData.points;
    const thickness = parseFloat(params.faceWidth) || 10;
    const boreRadius = gearData.boreRadius || 4;

    const hasHub = params.hasHub && (parseFloat(params.hubDiameter) > boreRadius * 2);
    const hubDiameter = parseFloat(params.hubDiameter) || (boreRadius * 2 + 10);
    const hubRadius = hubDiameter / 2.0;
    const hubLength = parseFloat(params.hubLength) || 12;

    const hasSetscrew = params.hasSetscrew && (parseFloat(params.setscrewSize) > 0);
    const screwDia = parseFloat(params.setscrewSize) || 4; // M4 default
    const screwRadius = screwDia / 2.0;
    // Distance from the outer edge of the hub:
    const screwDistFromEdge = Math.max(1, parseFloat(params.setscrewDistFromEdge) || 4);

    // 1. Build gear 2D contour shape
    const gearShape = new THREE.Shape();
    if (points && points.length > 0) {
      gearShape.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        gearShape.lineTo(points[i].x, points[i].y);
      }
      gearShape.closePath();
    }

    // Cut round bore hole
    if (boreRadius > 0 && params.type !== 'rack') {
      const holePath = new THREE.Path();
      holePath.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
      gearShape.holes.push(holePath);
    }

    // Watertight extrusion
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
      const bevelAngle = (parseFloat(params.bevelAngle) || 25) * Math.PI / 180;
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

    // Center gear tooth rim along Z
    gearGeometry.center();

    const gearMat = this.getMaterial(this.materialType, params.color);
    const gearMesh = new THREE.Mesh(gearGeometry, gearMat);
    gearMesh.castShadow = true;
    gearMesh.receiveShadow = true;
    group.add(gearMesh);

    // Crisp CAD Edges
    if (this.showEdges) {
      const edgesGeom = new THREE.EdgesGeometry(gearGeometry, 25);
      const edgeColor = (this.currentTheme === 'light') ? 0x334155 : 0x1e293b;
      const edgesMesh = new THREE.LineSegments(edgesGeom, new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: 0.6
      }));
      gearMesh.add(edgesMesh);
    }

    // 2. Hub (نافی) Solid Geometry
    if (hasHub && params.type !== 'rack') {
      const hubShape = new THREE.Shape();
      hubShape.absarc(0, 0, hubRadius, 0, Math.PI * 2, false);
      if (boreRadius > 0) {
        const hubHole = new THREE.Path();
        hubHole.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
        hubShape.holes.push(hubHole);
      }

      const hubGeom = new THREE.ExtrudeGeometry(hubShape, {
        steps: 1,
        depth: hubLength,
        bevelEnabled: false
      });
      hubGeom.translate(0, 0, thickness / 2.0);

      const hubMesh = new THREE.Mesh(hubGeom, gearMat);
      hubMesh.castShadow = true;
      group.add(hubMesh);

      if (this.showEdges) {
        const hubEdges = new THREE.LineSegments(new THREE.EdgesGeometry(hubGeom, 25), new THREE.LineBasicMaterial({
          color: (this.currentTheme === 'light') ? 0x334155 : 0x1e293b,
          transparent: true,
          opacity: 0.6
        }));
        hubMesh.add(hubEdges);
      }

      // 3. Perpendicular Setscrew Hole (جای پیچ عمود به سوراخ وسط)
      if (hasSetscrew) {
        // Setscrew is located at distance 'screwDistFromEdge' from the outer edge (+Z) of hub
        const screwZ = (thickness / 2.0) + hubLength - screwDistFromEdge;
        const wallThickness = hubRadius - boreRadius;
        const screwHoleGeom = new THREE.CylinderGeometry(screwRadius, screwRadius, wallThickness + 0.5, 24);
        
        // Orient cylinder perpendicular to Z axis (pointing radially along Y)
        screwHoleGeom.rotateZ(Math.PI / 2);
        // Position on top wall of hub: from boreRadius to hubRadius
        screwHoleGeom.translate(boreRadius + wallThickness / 2.0, 0, screwZ);

        const screwHoleMat = new THREE.MeshBasicMaterial({ color: 0x050811 });
        const screwHoleMesh = new THREE.Mesh(screwHoleGeom, screwHoleMat);
        group.add(screwHoleMesh);

        // Chamfer ring marker on outer hub surface
        const ringGeom = new THREE.RingGeometry(screwRadius * 0.9, screwRadius * 1.35, 24);
        ringGeom.rotateY(Math.PI / 2);
        ringGeom.translate(hubRadius + 0.05, 0, screwZ);
        const ringMesh = new THREE.Mesh(ringGeom, new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          side: THREE.DoubleSide
        }));
        group.add(ringMesh);
      }
    }

    group.userData = {
      id: params.id,
      gearData: gearData,
      params: params,
      speed: (params.rpm || 0) * (params.initialDirection || 1),
      gearMesh: gearMesh
    };

    return group;
  }

  // Updates or builds the complete assembly (Spur / Helical / Rack & Pinion)
  updateAssembly(params) {
    if (params.type === 'rack_pinion') {
      this.setupRackAndPinionAssembly(params);
      return;
    }

    // Normal rotary gear update
    if (this.rackMeshGroup) {
      this.scene.remove(this.rackMeshGroup);
      this.rackMeshGroup = null;
    }

    const gearData = GearMath.generateSpurGearProfile(params);

    if (this.gearMeshGroups.has(params.id)) {
      const oldGroup = this.gearMeshGroups.get(params.id);
      this.scene.remove(oldGroup);
      oldGroup.traverse(c => { if (c.geometry) c.geometry.dispose(); });
    }

    const group = this.createGearMeshGroup(gearData, params);
    group.position.set(parseFloat(params.posX) || 0, parseFloat(params.posY) || 0, 0);

    this.scene.add(group);
    this.gearMeshGroups.set(params.id, group);

    this.updateDimensionsOverlay();
    return gearData;
  }

  // Dedicated Rack & Pinion Dual Engagement Setup
  setupRackAndPinionAssembly(params) {
    // 1. Build Pinion
    const pinionParams = Object.assign({}, params, { type: 'spur' });
    const pinionData = GearMath.generateSpurGearProfile(pinionParams);

    if (this.gearMeshGroups.has('gear_1')) {
      const old = this.gearMeshGroups.get('gear_1');
      this.scene.remove(old);
    }
    const pinionGroup = this.createGearMeshGroup(pinionData, pinionParams);
    pinionGroup.position.set(0, 0, 0);
    this.scene.add(pinionGroup);
    this.gearMeshGroups.set('gear_1', pinionGroup);

    // 2. Build Linear Rack
    const rackParams = {
      rackTeeth: params.rackTeeth || 24,
      module: params.module || 2.0,
      pressureAngle: params.pressureAngle || 20,
      backlash: params.backlash || 0.15,
      faceWidth: params.faceWidth || 10,
      color: '#10b981'
    };
    const rackData = GearMath.generateRackProfile(rackParams);

    if (this.rackMeshGroup) {
      this.scene.remove(this.rackMeshGroup);
    }

    const rackShape = new THREE.Shape();
    const rPts = rackData.points;
    rackShape.moveTo(rPts[0].x, rPts[0].y);
    for (let i = 1; i < rPts.length; i++) {
      rackShape.lineTo(rPts[i].x, rPts[i].y);
    }
    rackShape.closePath();

    const rackGeom = new THREE.ExtrudeGeometry(rackShape, {
      steps: 1,
      depth: rackParams.faceWidth,
      bevelEnabled: false
    });
    rackGeom.center();

    const rackMat = this.getMaterial(this.materialType, rackParams.color);
    const rackMesh = new THREE.Mesh(rackGeom, rackMat);
    rackMesh.castShadow = true;

    if (this.showEdges) {
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(rackGeom, 25), new THREE.LineBasicMaterial({
        color: (this.currentTheme === 'light') ? 0x334155 : 0x1e293b,
        transparent: true,
        opacity: 0.6
      }));
      rackMesh.add(edges);
    }

    this.rackMeshGroup = new THREE.Group();
    this.rackMeshGroup.name = 'rack';
    this.rackMeshGroup.add(rackMesh);

    // Position rack meshing right under pinion pitch circle
    // Pitch contact point is at Y = -pinionData.pitchRadius
    const yPos = -(pinionData.pitchRadius + (1.0 * rackParams.module) * 0.05);
    this.rackMeshGroup.position.set(0, yPos, 0);

    this.rackMeshGroup.userData = {
      pinionRadius: pinionData.pitchRadius,
      rackData: rackData,
      currentX: 0
    };

    this.scene.add(this.rackMeshGroup);
    this.updateDimensionsOverlay();
  }

  getGearMeshGroup(id) {
    return this.gearMeshGroups.get(id);
  }

  getRackMeshGroup() {
    return this.rackMeshGroup;
  }

  // Standard CAD View Navigation
  setView(viewName) {
    const duration = 500;
    let targetPos = new THREE.Vector3();
    let targetUp = new THREE.Vector3(0, 1, 0);
    const center = new THREE.Vector3(0, 0, 0);

    let dist = 140;
    this.gearMeshGroups.forEach(g => {
      const gd = g.userData.gearData;
      if (gd && gd.tipRadius) dist = Math.max(dist, gd.tipRadius * 3.5);
    });

    switch (viewName) {
      case 'top':
        targetPos.set(0, 0, dist * 1.3);
        targetUp.set(0, 1, 0);
        break;
      case 'front':
        targetPos.set(0, dist * 1.3, 0);
        targetUp.set(0, 0, -1);
        break;
      case 'side':
        targetPos.set(dist * 1.3, 0, 0);
        targetUp.set(0, 1, 0);
        break;
      case 'iso':
      default:
        targetPos.set(dist * 0.7, dist * 0.7, dist * 0.85);
        targetUp.set(0, 1, 0);
        break;
    }

    this.animateCamera(targetPos, center, targetUp, duration);
  }

  animateCamera(toPos, toTarget, toUp, duration = 450) {
    const fromPos = this.camera.position.clone();
    const fromTarget = this.controls.target.clone();
    const startTime = performance.now();

    const step = () => {
      const now = performance.now();
      const progress = Math.min((now - startTime) / duration, 1.0);
      const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);

      this.camera.position.lerpVectors(fromPos, toPos, ease);
      this.controls.target.lerpVectors(fromTarget, toTarget, ease);
      this.camera.up.copy(toUp);
      this.controls.update();

      if (progress < 1.0) requestAnimationFrame(step);
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
      group.traverse(child => {
        if (child.isLineSegments) child.visible = this.showEdges;
      });
    });
    if (this.rackMeshGroup) {
      this.rackMeshGroup.traverse(child => {
        if (child.isLineSegments) child.visible = this.showEdges;
      });
    }
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
      const zOffset = (group.userData.params.faceWidth || 10) / 2.0 + 0.6;

      // Pitch Circle (Orange Dashed)
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
        gapSize: 1.5
      }));
      pitchLine.computeLineDistances();
      pitchLine.position.set(pos.x, pos.y, zOffset);
      this.dimensionsGroup.add(pitchLine);

      // Outer Tip Circle (Subtle Cyan)
      const tipGeom = new THREE.BufferGeometry();
      const tipPts = [];
      for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI * 2;
        tipPts.push(new THREE.Vector3(Math.cos(a) * gd.tipRadius, Math.sin(a) * gd.tipRadius, 0));
      }
      tipGeom.setFromPoints(tipPts);
      const tipLine = new THREE.Line(tipGeom, new THREE.LineBasicMaterial({
        color: (this.currentTheme === 'light') ? 0x0284c7 : 0x38bdf8,
        transparent: true,
        opacity: 0.4
      }));
      tipLine.position.set(pos.x, pos.y, zOffset);
      this.dimensionsGroup.add(tipLine);
    });
  }

  setMaterialType(type) {
    this.materialType = type;
    this.gearMeshGroups.forEach((group, id) => {
      this.updateAssembly(group.userData.params);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    if (this.isRunning) {
      // 1. Rotate Pinion / Gears
      this.gearMeshGroups.forEach(group => {
        const speed = (group.userData.speed || 0) * this.simSpeed;
        const radPerSec = (speed * 2 * Math.PI) / 60;
        const deltaAngle = radPerSec * delta;
        group.rotation.z += deltaAngle;

        // 2. Synchronize Linear Rack Motion (v = omega * r)
        if (this.rackMeshGroup && group.name === 'gear_1') {
          const rPitch = this.rackMeshGroup.userData.pinionRadius || 34;
          const linearDisplacement = deltaAngle * rPitch;
          this.rackMeshGroup.position.x += linearDisplacement;

          // Wrap rack movement smoothly inside bounds
          const rackLength = this.rackMeshGroup.userData.rackData.totalLength || 100;
          if (this.rackMeshGroup.position.x > rackLength / 3.0) {
            this.rackMeshGroup.position.x = -rackLength / 3.0;
          } else if (this.rackMeshGroup.position.x < -rackLength / 3.0) {
            this.rackMeshGroup.position.x = rackLength / 3.0;
          }
        }
      });
    }

    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
