// Standard Mechanical Involute Gear Generation (ISO 53 / DIN 867)
// Correct orientation (Counter-Clockwise winding order) so 3D face normals always point OUTWARD

const GearMath = {
  inv: function(a) {
    return Math.tan(a) - a;
  },

  // Generates 2D profile with strict Counter-Clockwise (CCW) winding order
  generateSpurGearProfile: function(params) {
    const z = Math.max(4, parseInt(params.numTeeth) || 20);
    const m = Math.max(0.1, parseFloat(params.module) || 2.5);
    const alphaDeg = parseFloat(params.pressureAngle) || 20.0;
    const alpha = (alphaDeg * Math.PI) / 180.0;

    const pitchRadius = (m * z) / 2.0;
    const baseRadius = pitchRadius * Math.cos(alpha);
    const addendum = 1.0 * m;
    const dedendum = 1.25 * m;
    const tipRadius = pitchRadius + addendum;
    const rootRadius = Math.max(1.0, pitchRadius - dedendum);

    const pitchAngle = (2.0 * Math.PI) / z;
    const toothThicknessAngle = Math.PI / z; // Half-tooth thickness angle
    const invAlpha = this.inv(alpha);

    // Compute Involute Curve from Base to Tip
    const samples = 12;
    const rStart = Math.max(rootRadius, baseRadius);
    const rightFlank = [];

    for (let i = 0; i <= samples; i++) {
      const r = rStart + (tipRadius - rStart) * (i / samples);
      const a = Math.acos(Math.min(1.0, baseRadius / r));
      const theta = (toothThicknessAngle / 2.0) + invAlpha - this.inv(a);
      rightFlank.push({
        r: r,
        theta: theta,
        x: r * Math.cos(theta),
        y: r * Math.sin(theta)
      });
    }

    // Mirror for left flank
    const leftFlank = [];
    for (let i = samples; i >= 0; i--) {
      const p = rightFlank[i];
      leftFlank.push({
        r: p.r,
        theta: -p.theta,
        x: p.r * Math.cos(-p.theta),
        y: p.r * Math.sin(-p.theta)
      });
    }

    const rootBelowBase = (rootRadius < baseRadius);
    const rootAngle = (toothThicknessAngle / 2.0) + invAlpha;

    const rawPoints = [];

    for (let t = 0; t < z; t++) {
      const rot = t * pitchAngle;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      function applyRot(p) {
        return {
          x: p.x * cosR - p.y * sinR,
          y: p.x * sinR + p.y * cosR
        };
      }

      // 1. Right root transition
      if (rootBelowBase) {
        rawPoints.push(applyRot({
          x: rootRadius * Math.cos(rootAngle),
          y: rootRadius * Math.sin(rootAngle)
        }));
      }

      // 2. Right involute flank
      for (let i = 0; i < rightFlank.length; i++) {
        rawPoints.push(applyRot(rightFlank[i]));
      }

      // 3. Tip land
      const rTipAng = rot + rightFlank[samples].theta;
      const lTipAng = rot + leftFlank[0].theta;
      const tipSteps = 3;
      for (let s = 1; s < tipSteps; s++) {
        const a = rTipAng + (lTipAng - rTipAng) * (s / tipSteps);
        rawPoints.push({
          x: tipRadius * Math.cos(a),
          y: tipRadius * Math.sin(a)
        });
      }

      // 4. Left involute flank
      for (let i = 0; i < leftFlank.length; i++) {
        rawPoints.push(applyRot(leftFlank[i]));
      }

      // 5. Left root transition
      if (rootBelowBase) {
        rawPoints.push(applyRot({
          x: rootRadius * Math.cos(-rootAngle),
          y: rootRadius * Math.sin(-rootAngle)
        }));
      }

      // 6. Root fillet arc to next tooth
      const nextRot = (t + 1) * pitchAngle;
      const curLeftTheta = rootBelowBase ? -rootAngle : -rightFlank[0].theta;
      const nextRightTheta = rootBelowBase ? rootAngle : rightFlank[0].theta;

      const rStartAng = rot + curLeftTheta;
      const rEndAng = nextRot + nextRightTheta;
      const rootSteps = 3;
      for (let s = 1; s <= rootSteps; s++) {
        const a = rStartAng + (rEndAng - rStartAng) * (s / (rootSteps + 1));
        rawPoints.push({
          x: rootRadius * Math.cos(a),
          y: rootRadius * Math.sin(a)
        });
      }
    }

    // Ensure Counter-Clockwise (CCW) winding order for positive area (Three.js outward normals)
    let area = 0;
    for (let i = 0; i < rawPoints.length; i++) {
      const j = (i + 1) % rawPoints.length;
      area += (rawPoints[i].x * rawPoints[j].y - rawPoints[j].x * rawPoints[i].y);
    }
    const points = (area < 0) ? rawPoints.reverse() : rawPoints;

    return {
      points: points,
      pitchRadius,
      pitchDiameter: 2 * pitchRadius,
      tipRadius,
      tipDiameter: 2 * tipRadius,
      rootRadius,
      rootDiameter: 2 * rootRadius,
      baseRadius,
      baseDiameter: 2 * baseRadius,
      module: m,
      numTeeth: z,
      pressureAngleDeg: alphaDeg,
      circularPitch: Math.PI * m,
      boreRadius: params.boreDiameter ? parseFloat(params.boreDiameter) / 2.0 : 0
    };
  },

  // Generates Standard Industrial Rack Profile
  generateRackProfile: function(params) {
    const z = Math.max(4, parseInt(params.numTeeth) || 16);
    const m = Math.max(0.1, parseFloat(params.module) || 2.5);
    const alphaDeg = parseFloat(params.pressureAngle) || 20.0;
    const alpha = (alphaDeg * Math.PI) / 180.0;

    const p = Math.PI * m; // Pitch
    const ha = 1.0 * m; // Addendum
    const hf = 1.25 * m; // Dedendum
    const backingHeight = parseFloat(params.backingHeight) || (m * 4);
    const totalLength = z * p;
    const startX = -totalLength / 2.0;

    const tipY = ha;
    const rootY = -hf;
    const bottomY = rootY - backingHeight;
    const dx = ha * Math.tan(alpha);
    const quarterPitch = p / 4.0;

    const points = [];
    // CCW order for outer polygon
    points.push({ x: startX, y: bottomY });

    for (let i = 0; i < z; i++) {
      const tc = startX + i * p + p / 2.0;
      points.push({ x: tc - quarterPitch - dx, y: rootY });
      points.push({ x: tc - quarterPitch + dx, y: tipY });
      points.push({ x: tc + quarterPitch - dx, y: tipY });
      points.push({ x: tc + quarterPitch + dx, y: rootY });
    }

    points.push({ x: startX + totalLength, y: bottomY });
    points.push({ x: startX, y: bottomY });

    return {
      points,
      pitch: p,
      module: m,
      numTeeth: z,
      totalLength,
      pitchRadius: 0,
      boreRadius: 0
    };
  },

  // Kinematics Calculation based on user-placed gear positions and Driver selection
  calculateKinematics: function(gears) {
    if (!gears || gears.length === 0) return [];

    const driverIndex = Math.max(0, gears.findIndex(g => g.isDriver));
    const driver = gears[driverIndex];
    const driverRPM = driver.rpm || 1000;
    const results = [];

    for (let i = 0; i < gears.length; i++) {
      const g = gears[i];
      const r = (g.module * g.numTeeth) / 2.0;

      let rpm = 0;
      let dir = 1;

      if (i === driverIndex) {
        rpm = driverRPM;
        dir = g.initialDirection || 1;
      } else {
        // Compute speed ratio relative to driver
        rpm = (driverRPM * driver.numTeeth) / g.numTeeth;
        const distSteps = Math.abs(i - driverIndex);
        dir = (distSteps % 2 === 0) ? (driver.initialDirection || 1) : -(driver.initialDirection || 1);
      }

      results.push({
        id: g.id,
        name: g.name,
        type: g.type,
        numTeeth: g.numTeeth,
        module: g.module,
        pitchRadius: r,
        rpm: Math.round(rpm * 100) / 100,
        direction: dir,
        ratio: Math.round((rpm / driverRPM) * 1000) / 1000,
        posX: g.posX !== undefined ? parseFloat(g.posX) : 0,
        posY: g.posY !== undefined ? parseFloat(g.posY) : 0,
        isDriver: (i === driverIndex)
      });
    }

    return results;
  }
};

window.GearMath = GearMath;
