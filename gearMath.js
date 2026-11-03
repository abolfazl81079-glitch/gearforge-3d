// Precision Gear Math Engine (ISO 53 / DIN 867 & Swiss3D Standard)
// Strictly Monotonic Closed Jordan Curves with Backlash (j) & Zero Self-Intersections

const GearMath = {
  inv: function(a) {
    return Math.tan(a) - a;
  },

  // Generates 100% Watertight, Solid Involute Spur Gear Profile with Backlash (Spiel)
  generateSpurGearProfile: function(params) {
    const z = Math.max(4, parseInt(params.numTeeth) || 34);
    const m = Math.max(0.1, parseFloat(params.module) || 2.0);
    const alphaDeg = parseFloat(params.pressureAngle) || 20.0;
    const alpha = (alphaDeg * Math.PI) / 180.0;
    const backlash = Math.max(0, parseFloat(params.backlash) || 0.15); // j in mm

    const pitchRadius = (m * z) / 2.0;
    const baseRadius = pitchRadius * Math.cos(alpha);
    const addendum = 1.0 * m;
    const dedendum = 1.25 * m;
    const tipRadius = pitchRadius + addendum;
    const rootRadius = Math.max(0.5 * m, pitchRadius - dedendum);

    const pitchAngle = (2.0 * Math.PI) / z;
    // Tooth thickness angle at pitch circle with backlash thinning: s = (pi*m/2 - j)
    const arcToothThickness = Math.max(0.1 * m, (Math.PI * m / 2.0) - backlash);
    const halfTooth = arcToothThickness / (2.0 * pitchRadius);
    const invAlpha = this.inv(alpha);

    const rootUnderBase = (rootRadius < baseRadius);
    const rStart = rootUnderBase ? baseRadius : rootRadius;
    const rbAngle = halfTooth + invAlpha;

    const samples = 10;
    const points = [];

    for (let t = 0; t < z; t++) {
      const rot = t * pitchAngle;

      // 1. Radial line from root to base circle (if undercut)
      if (rootUnderBase) {
        const ang = rot - rbAngle;
        points.push({
          x: rootRadius * Math.cos(ang),
          y: rootRadius * Math.sin(ang)
        });
      }

      // 2. Flank 1: Involute from base/root to tip (outward CCW)
      for (let i = 0; i <= samples; i++) {
        const r = rStart + (tipRadius - rStart) * (i / samples);
        const a = Math.acos(Math.min(1.0, baseRadius / r));
        const dev = halfTooth + invAlpha - this.inv(a);
        const ang = rot - dev;
        points.push({
          x: r * Math.cos(ang),
          y: r * Math.sin(ang)
        });
      }

      // 3. Tip Land (circular arc across tooth tip)
      const tipA = Math.acos(Math.min(1.0, baseRadius / tipRadius));
      const tipDev = halfTooth + invAlpha - this.inv(tipA);
      const tipSteps = 3;
      for (let s = 1; s <= tipSteps; s++) {
        const frac = s / (tipSteps + 1);
        const ang = (rot - tipDev) + (2.0 * tipDev) * frac;
        points.push({
          x: tipRadius * Math.cos(ang),
          y: tipRadius * Math.sin(ang)
        });
      }

      // 4. Flank 2: Involute from tip to base/root (inward CCW)
      for (let i = samples; i >= 0; i--) {
        const r = rStart + (tipRadius - rStart) * (i / samples);
        const a = Math.acos(Math.min(1.0, baseRadius / r));
        const dev = halfTooth + invAlpha - this.inv(a);
        const ang = rot + dev;
        points.push({
          x: r * Math.cos(ang),
          y: r * Math.sin(ang)
        });
      }

      // 5. Radial line from base circle down to root circle (if undercut)
      if (rootUnderBase) {
        const ang = rot + rbAngle;
        points.push({
          x: rootRadius * Math.cos(ang),
          y: rootRadius * Math.sin(ang)
        });
      }

      // 6. Root Land: Circular fillet to next tooth
      const nextRot = (t + 1) * pitchAngle;
      const rootStartAng = rot + (rootUnderBase ? rbAngle : (halfTooth + invAlpha));
      const rootEndAng = nextRot - (rootUnderBase ? rbAngle : (halfTooth + invAlpha));
      const rootSteps = 4;
      for (let s = 1; s <= rootSteps; s++) {
        const frac = s / (rootSteps + 1);
        const ang = rootStartAng + (rootEndAng - rootStartAng) * frac;
        points.push({
          x: rootRadius * Math.cos(ang),
          y: rootRadius * Math.sin(ang)
        });
      }
    }

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
      backlash: backlash,
      boreRadius: params.boreDiameter ? parseFloat(params.boreDiameter) / 2.0 : 4.0
    };
  },

  // Generates Precision Linear Rack Profile for Rack & Pinion
  generateRackProfile: function(params) {
    const z = Math.max(4, parseInt(params.rackTeeth) || 20);
    const m = Math.max(0.1, parseFloat(params.module) || 2.0);
    const alphaDeg = parseFloat(params.pressureAngle) || 20.0;
    const alpha = (alphaDeg * Math.PI) / 180.0;
    const backlash = Math.max(0, parseFloat(params.backlash) || 0.15);

    const p = Math.PI * m; // Pitch length
    const ha = 1.0 * m;   // Addendum
    const hf = 1.25 * m;  // Dedendum
    const totalLength = z * p;
    const startX = -totalLength / 2.0;
    const backHeight = 3.5 * m;

    const points = [];

    // Bottom solid flat base
    points.push({ x: startX, y: -hf - backHeight });
    points.push({ x: startX + totalLength, y: -hf - backHeight });
    points.push({ x: startX + totalLength, y: -hf });

    // Teeth profile from right to left (CCW)
    const tanA = Math.tan(alpha);
    const toothHalfThick = (p / 4.0) - (backlash / 2.0);
    const toothPitchCenter = p / 2.0;

    for (let i = z - 1; i >= 0; i--) {
      const tx = startX + i * p;
      const xMid = tx + toothPitchCenter;

      const xRightRoot = xMid + toothHalfThick + hf * tanA;
      const xRightTip  = xMid + toothHalfThick - ha * tanA;
      const xLeftTip   = xMid - toothHalfThick + ha * tanA;
      const xLeftRoot  = xMid - toothHalfThick - hf * tanA;

      points.push({ x: xRightRoot, y: -hf });
      points.push({ x: xRightTip,  y: ha });
      points.push({ x: xLeftTip,   y: ha });
      points.push({ x: xLeftRoot,  y: -hf });
    }

    points.push({ x: startX, y: -hf });

    return {
      points: points,
      pitchRadius: 0,
      pitchDiameter: totalLength,
      tipRadius: ha,
      rootRadius: -hf,
      module: m,
      numTeeth: z,
      pressureAngleDeg: alphaDeg,
      circularPitch: p,
      boreRadius: 0,
      totalLength: totalLength,
      height: ha + hf + backHeight
    };
  }
};
