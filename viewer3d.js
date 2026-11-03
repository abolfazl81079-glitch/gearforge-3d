// 3D Scene Manager with Double-Sided Rendering, Outward Normals, Perpendicular Setscrew & Engineering Gizmos

class Gear3DViewer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.gearMeshes = [];
    this.gridHelper = null;
    this.axesHelper = null;
    this.isRunning = false;
    this.simSpeed = 1.0;
    this.materialType = 'metal';
    this.clock = new THREE.Clock();

    this.initScene();
    this.initLights();
    this.initHelpers();
    this.setupResizeListener();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);

    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 3000);
    this.camera.position.set(0, 80, 180);

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
    this.controls.maxDistance = 1500;
    this.controls.minDistance = 5;

    // Mobile / Android Touch configuration
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
  }

  initLights() {
    // 360-degree illumination so all faces are clearly visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const frontDir = new THREE.DirectionalLight(0xffffff, 0.9);
    frontDir.position.set(100, 150, 200);
    this.scene.add(frontDir);

    const backDir = new THREE.DirectionalLight(0xffffff, 0.7);
    backDir.position.set(-100, -100, -200);
    this.scene.add(backDir);

    const blueRim = new THREE.DirectionalLight(0x38bdf8, 0.5);
    blueRim.position.set(-150, 150, 0);
    this.scene.add(blueRim);
  }

  initHelpers() {
    this.gridHelper = new THREE.GridHelper(500, 50, 0x3b82f6, 0x1e293b);
    this.gridHelper.position.y = -30;
    this.scene.add(this.gridHelper);

    this.axesHelper = new THREE.AxesHelper(35);
    this.axesHelper.position.set(-80, -29, 80);
    this.scene.add(this.axesHelper);
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      if (!this.canvas) return;
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  // DoubleSide material ensures no inverted face invisibility
  getMaterial(type, colorOverride = null) {
    const isWireframe = (this.materialType === 'wireframe');
    const color = colorOverride ? new THREE.Color(colorOverride) : new THREE.Color(0x3b82f6);

    switch (type || this.materialType) {
      case 'brass':
        return new THREE.MeshStandardMaterial({
          color: colorOverride ? color : new THREE.Color(0xd4af37),
          metalness: 0.85,
          roughness: 0.25,
          wireframe: isWireframe,
          side: THREE.DoubleSide
        });
      case 'aluminum':
        return new THREE.MeshStandardMaterial({
          color: colorOverride ? color : new THREE.Color(0xd1d5db),
          metalness: 0.7,
          roughness: 0.35,
          wireframe: isWireframe,
          side: THREE.DoubleSide
        });
      case 'plastic':
        return new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.15,
          roughness: 0.45,
          wireframe: isWireframe,
          side: THREE.DoubleSide
        });
      case 'wireframe':
        return new THREE.MeshBasicMaterial({
          color: color,
          wireframe: true,
          side: THREE.DoubleSide
        });
      case 'metal':
      default:
        return new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.85,
          roughness: 0.3,
          wireframe: isWireframe,
          side: THREE.DoubleSide
        });
    }
  }

  // Create solid extruded gear with perpendicular setscrew hole and hub
  createGearMeshGroup(gearData, params) {
    const group = new THREE.Group();
    const points = gearData.points;
    const thickness = parseFloat(params.faceWidth) || 15;
    const boreRadius = gearData.boreRadius || 0;
    const hasHub = params.hasHub && (parseFloat(params.hubDiameter) > boreRadius * 2);
    const hubDiameter = parseFloat(params.hubDiameter) || (boreRadius * 2 + 10);
    const hubRadius = hubDiameter / 2.0;
    const hubLength = parseFloat(params.hubLength) || 12;
    const hasSetscrew = params.hasSetscrew && (parseFloat(params.setscrewSize) > 0);
    const setscrewDiameter = parseFloat(params.setscrewSize) || 4;
    const setscrewRadius = setscrewDiameter / 2.0;
    const setscrewDist = parseFloat(params.setscrewDistance) || (hubLength / 2.0);

    // 1. Build gear 2D face contour
    const gearShape = new THREE.Shape();
    if (points.length > 0) {
      gearShape.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        gearShape.lineTo(points[i].x, points[i].y);
      }
      gearShape.closePath();
    }

    // Cut bore hole if applicable
    if (boreRadius > 0 && params.type !== 'rack') {
      const hole = new THREE.Path();
      hole.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
      gearShape.holes.push(hole);
    }

    const extrudeSettings = {
      steps: 1,
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.35,
      bevelSize: 0.35,
      bevelSegments: 2
    };

    let gearGeometry = new THREE.ExtrudeGeometry(gearShape, extrudeSettings);

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

    // 2. Hub (نافی) Solid Geometry
    let hubMesh = null;
    if (hasHub && params.type !== 'rack') {
      const hubShape = new THREE.Shape();
      hubShape.absarc(0, 0, hubRadius, 0, Math.PI * 2, false);
      if (boreRadius > 0) {
        const hubHole = new THREE.Path();
        hubHole.absarc(0, 0, boreRadius, 0, Math.PI * 2, true);
        hubShape.holes.push(hubHole);
      }

      const hubExtrude = {
        steps: 1,
        depth: hubLength,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.3,
        bevelSegments: 2
      };

      const hubGeom = new THREE.ExtrudeGeometry(hubShape, hubExtrude);
      // Place hub protruding out from front face (+Z)
      hubGeom.translate(0, 0, thickness / 2.0);

      const hubMat = this.getMaterial(this.materialType, params.color);
      hubMesh = new THREE.Mesh(hubGeom, hubMat);
      hubMesh.castShadow = true;
      hubMesh.receiveShadow = true;
      group.add(hubMesh);

      // 3. Perpendicular Setscrew Hole & Screw Cylinder (عمود بر سوراخ شفت)
      // Radius goes from Bore surface out to Hub surface radially along Y axis
      if (hasSetscrew) {
        const screwDepth = hubRadius - boreRadius + 1.0;
        const screwGeom = new THREE.CylinderGeometry(setscrewRadius, setscrewRadius, screwDepth, 16);
        const screwMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.95,
          roughness: 0.15,
          side: THREE.DoubleSide
        });
        const screwMesh = new THREE.Mesh(screwGeom, screwMat);

        // Position: Exactly perpendicular to bore axis (radial along +Y)
        const radialCenterY = boreRadius + (screwDepth / 2.0);
        const axialZ = (thickness / 2.0) + Math.min(hubLength - 1, Math.max(1, setscrewDist));
        
        screwMesh.position.set(0, radialCenterY, axialZ);
        group.add(screwMesh);
      }
    }

    return {
      group: group,
      mainMesh: gearMesh,
      hubMesh: hubMesh
    };
  }

  updateGearTrain(gearList, kinematics) {
    this.gearMeshes.forEach(item => {
      this.scene.remove(item.group);
      if (item.mainMesh && item.mainMesh.geometry) item.mainMesh.geometry.dispose();
      if (item.hubMesh && item.hubMesh.geometry) item.hubMesh.geometry.dispose();
    });
    this.gearMeshes = [];

    for (let i = 0; i < gearList.length; i++) {
      const g = gearList[i];
      const kin = kinematics[i] || {};

      let profileData = (g.type === 'rack') 
        ? GearMath.generateRackProfile(g) 
        : GearMath.generateSpurGearProfile(g);

      const { group, mainMesh, hubMesh } = this.createGearMeshGroup(profileData, g);
      // Position each gear according to its individual X, Y settings
      group.position.set(parseFloat(g.posX) || 0, parseFloat(g.posY) || 0, 0);

      if (i > 0 && g.type !== 'rack') {
        const toothPitchRad = (Math.PI * 2) / g.numTeeth;
        group.rotation.z = toothPitchRad / 2;
      }

      this.scene.add(group);
      this.gearMeshes.push({
        id: g.id,
        group: group,
        mainMesh: mainMesh,
        hubMesh: hubMesh,
        kin: kin,
        gear: g,
        profileData: profileData
      });
    }
  }

  // Engineering View Presets (Front, Top, Right Side, Isometric)
  setPresetView(viewName) {
    const dist = 180;
    switch (viewName) {
      case 'top':
        this.camera.position.set(0, 0, dist * 1.3);
        this.camera.up.set(0, 1, 0);
        this.controls.target.set(0, 0, 0);
        break;
      case 'front':
        this.camera.position.set(0, -dist, 0);
        this.camera.up.set(0, 0, 1);
        this.controls.target.set(0, 0, 0);
        break;
      case 'side':
        this.camera.position.set(dist, 0, 0);
        this.camera.up.set(0, 0, 1);
        this.controls.target.set(0, 0, 0);
        break;
      case 'iso':
      default:
        this.camera.position.set(dist * 0.75, dist * 0.75, dist * 0.9);
        this.camera.up.set(0, 1, 0);
        this.controls.target.set(0, 0, 0);
        break;
    }
    this.controls.update();
  }

  setMaterialType(type) {
    this.materialType = type;
    this.gearMeshes.forEach(item => {
      const m = this.getMaterial(type, item.gear.color);
      if (item.mainMesh) item.mainMesh.material = m;
      if (item.hubMesh) item.hubMesh.material = m;
    });
  }

  toggleGrid(show) {
    if (this.gridHelper) this.gridHelper.visible = show;
  }

  toggleAxes(show) {
    if (this.axesHelper) this.axesHelper.visible = show;
  }

  setTheme(theme) {
    if (this.scene) {
      this.scene.background = new THREE.Color(theme === 'light' ? 0xe2e8f0 : 0x0f172a);
    }
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      const gridColor1 = theme === 'light' ? 0x94a3b8 : 0x3b82f6;
      const gridColor2 = theme === 'light' ? 0xcbd5e1 : 0x1e293b;
      this.gridHelper = new THREE.GridHelper(500, 50, gridColor1, gridColor2);
      this.gridHelper.position.y = -30;
      this.scene.add(this.gridHelper);
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    if (this.isRunning) {
      this.gearMeshes.forEach(item => {
        const kin = item.kin;
        if (kin && kin.rpm) {
          const omega = (kin.rpm * 2 * Math.PI) / 60;
          const rotSpeed = omega * 0.05 * this.simSpeed;

          if (item.gear.type === 'rack') {
            const driverMesh = this.gearMeshes.find(m => m.gear.id !== item.gear.id);
            const r = driverMesh ? (driverMesh.gear.module * driverMesh.gear.numTeeth) / 2 : 25;
            const linSpeed = rotSpeed * r;
            item.group.position.x += linSpeed * kin.direction * delta;
            if (Math.abs(item.group.position.x) > 60) {
              kin.direction *= -1;
            }
          } else {
            item.group.rotation.z += rotSpeed * kin.direction * delta;
          }
        }
      });
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.Gear3DViewer = Gear3DViewer;
