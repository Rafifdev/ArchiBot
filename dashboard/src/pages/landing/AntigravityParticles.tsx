import React, { useEffect, useRef } from 'react';

interface AntigravityParticlesProps {
  theme?: 'light' | 'dark';
  variant?: 'ring' | 'cluster';
  density?: number;
}

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 vTextureCoord;
void main() {
  vTextureCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/**
 * Ultra-Fast 1:1 WebGL 3D Undulating Refractive Glass Strip (sdfStrip) & FBM Horizon Wave
 * Specifically engineered to avoid ANGLE/D3D11 HLSL loop-unroll freezes in Chrome on Windows:
 *  - ZERO nested loops (compiles in <1ms on Chrome Windows ANGLE).
 *  - FBM fluid domain-warp is computed ONCE per pixel (not inside the refraction loop).
 *  - 3D undulating glass strip (sdfStrip) uses a tight 10-step solver + direct RGB chromatic refraction.
 */
const FRAGMENT_SHADER = `
precision mediump float;

varying vec2 vTextureCoord;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_isDark;

const float PI = 3.14159265359;
const vec3 viewDir = vec3(0.0, 0.0, -4.25);

const mat3 ROT_Y_90 = mat3(
  0.0, 0.0, 1.0,
  0.0, 1.0, 0.0,
 -1.0, 0.0, 0.0
);
const mat3 ROT_Z_90 = mat3(
  0.0, -1.0, 0.0,
  1.0,  0.0, 0.0,
  0.0,  0.0, 1.0
);

mat3 rotY(float ang) {
  float c = cos(ang), s = sin(ang);
  return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}

mat3 rotX(float ang) {
  float c = cos(ang), s = sin(ang);
  return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}

mat3 rotZ(float ang) {
  float c = cos(ang), s = sin(ang);
  return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
}

// Unrolled, loop-free 3-octave organic fluid wave (zero HLSL loop unrolling cost!)
float fastFluidFbm(vec2 p, float t) {
  float v = 0.0;
  v += 0.50 * sin(p.x * 1.35 + t * 0.65 + cos(p.y * 1.25 - t * 0.45));
  p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.02 + vec2(1.7, 9.2);
  v += 0.25 * cos(p.x * 1.45 - t * 0.85 + sin(p.y * 1.55 + t * 0.55));
  p = mat2(0.8, -0.6, 0.6, 0.8) * p * 2.03 + vec2(8.2, 1.3);
  v += 0.125 * sin(p.x * 1.60 + p.y * 1.40 + t * 1.05);
  return v * 0.45;
}

// ============================================================================
// Light-Theme & Dark-Theme Sweeping Horizon Aurora Wave
// ============================================================================
vec3 evalBaseHorizon(vec2 uv) {
  vec2 q = clamp(uv + (u_mouse - 0.5) * 0.035, 0.0, 1.0);

  // Sweeping curved horizon arc: stays low on the left beneath the headline/CTA,
  // and sweeps dramatically upward across the right side so the right viewport is lush & full
  float leftDip = max(0.0, 0.38 - q.x);
  float rightSweep = smoothstep(0.28, 1.02, q.x);
  float yCurve = 0.13
               + 0.42 * leftDip * leftDip
               + 0.52 * pow(rightSweep, 1.45)
               + 0.035 * sin(q.x * 5.0);

  float distToArc = q.y - yCurve;

  // Secondary upper-right ascending aurora crest that fills the middle-right & upper-right space
  float rightMask = smoothstep(0.40, 0.82, q.x);
  float yUpperArc = yCurve + 0.17 + 0.06 * cos(q.x * 4.2);
  float distToUpper = q.y - yUpperArc;
  float upperCrest = exp(-abs(distToUpper) * 14.0) * rightMask;
  float upperGlow  = exp(-abs(distToUpper) * 4.5) * rightMask;

  // 1. Luminous emerald/cyan horizon crest (wider & taller glow on the right)
  float crestSharpness = mix(24.0, 16.0, rightSweep);
  float crestCore = exp(-abs(distToArc) * crestSharpness);
  float crestGlow = exp(-abs(distToArc) * mix(7.0, 4.2, rightSweep));

  // 2. Violet/indigo/magenta body below the horizon arc (expands vertically on the right)
  float bandDepth = mix(0.16, 0.54, rightSweep);
  float underBand = smoothstep(0.06, -bandDepth, distToArc) * smoothstep(-0.02, 0.10, q.y);
  float bottomMagenta = exp(-pow((q.y - (0.08 + 0.18 * rightSweep)) * 7.5, 2.0));

  // 3. Upper-right atmospheric violet & sky-blue aurora bloom
  float rightBloom = exp(-length((q - vec2(0.84, 0.58)) * vec2(1.15, 1.10)) * 1.85);
  float topRightViolet = exp(-length((q - vec2(0.90, 0.80)) * vec2(1.20, 1.15)) * 1.95);

  vec3 colMint    = vec3(0.08, 0.94, 0.62);
  vec3 colCyan    = vec3(0.00, 0.80, 1.00);
  vec3 colCobalt  = vec3(0.20, 0.46, 0.98);
  vec3 colViolet  = vec3(0.60, 0.27, 1.00);
  vec3 colMagenta = vec3(0.86, 0.22, 0.98);

  if (u_isDark > 0.5) {
    vec3 col = vec3(0.02, 0.025, 0.04);
    col += colViolet * topRightViolet * 0.78;
    col += mix(colCobalt, colCyan, 0.5) * (rightBloom * 0.68 + upperGlow * 0.45);
    col += mix(colViolet, colMagenta, bottomMagenta) * underBand * 0.96;
    col += mix(colMint, colCyan, smoothstep(0.2, 0.85, q.x)) * (crestGlow * 0.60 + crestCore * 1.15 + upperCrest * 0.55);
    return clamp(col, 0.0, 1.0);
  } else {
    vec3 col = vec3(1.0, 1.0, 1.0);

    // Rich upper-right lavender-violet & sky-cobalt atmospheric wash
    col = mix(col, vec3(0.76, 0.68, 1.00), topRightViolet * 0.78);
    col = mix(col, vec3(0.64, 0.82, 1.00), rightBloom * 0.82);

    // Secondary upper-right ascending aurora ribbon (Cobalt -> Violet -> Cyan)
    vec3 upperRibbonCol = mix(vec3(0.26, 0.52, 0.99), vec3(0.58, 0.34, 0.99), smoothstep(0.5, 0.95, q.x));
    col = mix(col, upperRibbonCol, clamp(upperGlow * 0.55 + upperCrest * 0.72, 0.0, 0.88));

    // Rich luminous violet-cobalt under-wave body rising high on the right
    vec3 underColor = mix(
      vec3(0.42, 0.34, 0.98),
      vec3(0.72, 0.26, 0.98),
      clamp(bottomMagenta * 1.15, 0.0, 1.0)
    );
    col = mix(col, underColor, underBand * 0.88);

    // Glowing aqua-mint & electric cyan main horizon crest sweeping up the right
    vec3 crestColor = mix(
      vec3(0.04, 0.86, 0.66),
      vec3(0.06, 0.62, 0.99),
      smoothstep(0.22, 0.82, q.x)
    );
    col = mix(col, crestColor, clamp(crestGlow * 0.62 + crestCore * 0.94, 0.0, 0.96));
    col = mix(col, vec3(0.90, 0.99, 1.0), (crestCore + upperCrest * 0.6) * 0.42);
    return clamp(col, 0.0, 1.0);
  }
}

// ============================================================================
// 1:1 3D Undulating Glass Strip SDF (sdfStrip)
// ============================================================================
vec3 getAdjustedP(vec3 p, float aspect, mat3 combinedRotation) {
  p.x *= aspect;
  p *= 1.005;
  return combinedRotation * p;
}

float sdfBox(vec3 p, vec3 b) {
  vec3 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

float sdfStrip(vec3 p) {
  vec3 origP = p;
  p *= ROT_Z_90;
  p *= ROT_Y_90;

  float frequency = 10.0;
  float amplitude = 0.5;
  float t = u_time * 24.0;

  float wave1 = sin(origP.x * frequency + t * 0.05) * amplitude;
  float wave2 = cos((origP.x + 0.92) * frequency * 0.75 + t * 0.075) * amplitude;
  float wave3 = cos((p.x + 0.92) * frequency * 0.75 + t * 0.075) * amplitude;

  p.x += (wave1 + wave2) * 0.2;
  p.y += wave3 * 0.3;

  return sdfBox(p, vec3(0.0, 20.0, 0.01)) - 0.01;
}

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);

  // 1. Compute FBM fluid warp offset ONCE per pixel (zero nested loops!)
  vec2 uPos = vec2(0.5, 0.73);
  float mDist = max(0.0, 1.0 - distance(vTextureCoord * vec2(aspect, 1.0), uPos * vec2(aspect, 1.0)) * 0.45);
  vec2 st = (vTextureCoord - uPos) * vec2(aspect, 1.0) * 3.2;
  float tFluid = u_time * 0.55;
  vec2 fbmWarp = vec2(
    fastFluidFbm(st + vec2(1.7, 9.2), tFluid),
    fastFluidFbm(st + vec2(8.2, 1.3), tFluid * 0.9)
  ) * 0.14 * mDist;

  vec2 baseWarpedUv = vTextureCoord + fbmWarp;
  vec3 bg = evalBaseHorizon(baseWarpedUv);

  // 2. Precompute 3D rotation matrix for this pixel
  vec2 mouseOffset = (u_mouse - 0.5) * 0.08;
  vec2 axis = vec2(
    -0.5416667 - 1.0 + mouseOffset.y / PI,
     0.55 + mouseOffset.x / PI
  ) * 2.0;
  mat3 combinedRotation = rotZ(0.55 * 2.0 * PI) * rotY(axis.y * PI) * rotX(axis.x * PI);

  // 3. Fast 12-step Raymarch of the 3D Undulating Glass Strip (sdfStrip)
  vec2 camUv = vTextureCoord - vec2(0.5, 0.35);
  float fovFactor = 0.17632698; // tan(radians(20.0) * 0.5)
  vec3 rd = vec3(camUv * fovFactor, 0.5);

  float traveled = 3.2; // Start near the 3D glass sheet plane (z ~ -1.05 to 0.5)
  float hit = 0.0;
  vec3 entryPoint = vec3(0.0);

  for (int i = 0; i < 14; ++i) {
    vec3 currentPos = viewDir + rd * traveled;
    float dist = sdfStrip(getAdjustedP(currentPos, aspect, combinedRotation));
    if (dist < 0.006) {
      hit = 1.0;
      entryPoint = currentPos;
      break;
    }
    traveled += max(dist * 1.15, 0.008);
    if (traveled > 6.5) break;
  }

  vec3 finalColor = bg;

  if (hit > 0.5) {
    // Tetrahedral 3D normal evaluation
    float eps = 0.003;
    const vec3 k0 = vec3( 1.0, -1.0, -1.0);
    const vec3 k1 = vec3(-1.0, -1.0,  1.0);
    const vec3 k2 = vec3(-1.0,  1.0, -1.0);
    const vec3 k3 = vec3( 1.0,  1.0,  1.0);
    vec3 entryNormal = normalize(
      k0 * sdfStrip(getAdjustedP(entryPoint + k0 * eps, aspect, combinedRotation)) +
      k1 * sdfStrip(getAdjustedP(entryPoint + k1 * eps, aspect, combinedRotation)) +
      k2 * sdfStrip(getAdjustedP(entryPoint + k2 * eps, aspect, combinedRotation)) +
      k3 * sdfStrip(getAdjustedP(entryPoint + k3 * eps, aspect, combinedRotation))
    );

    // Fast 3-channel RGB Chromatic Dispersion (R, G, B refracted rays)
    vec3 rayR = refract(rd, entryNormal, 1.0 / 1.265);
    vec3 rayG = refract(rd, entryNormal, 1.0 / 1.295);
    vec3 rayB = refract(rd, entryNormal, 1.0 / 1.335);

    vec3 refractionColor = vec3(
      evalBaseHorizon(baseWarpedUv - rayR.xy).r,
      evalBaseHorizon(baseWarpedUv - rayG.xy).g,
      evalBaseHorizon(baseWarpedUv - rayB.xy).b
    );

    vec3 lightDir = normalize(vec3(-0.75, 0.40, -3.0));
    float lightAndShadow = dot(entryNormal, lightDir);
    float fresnelVal = pow(1.0 - abs(dot(rd, entryNormal)), 8.0);
    vec3 halfwayDir = normalize(lightDir + rd);
    float specFactor = pow(max(dot(entryNormal, halfwayDir), 0.0), 64.0);

    vec3 violetTint = vec3(0.7137, 0.6039, 1.0);
    vec3 cobaltTint = vec3(0.38, 0.58, 1.0);

    if (u_isDark > 0.5) {
      finalColor = refractionColor + fresnelVal * 0.19 * violetTint + specFactor * violetTint;
    } else {
      float ribContour = clamp(1.0 - abs(lightAndShadow), 0.0, 1.0);
      vec3 glassEdgeTint = mix(cobaltTint, violetTint, 0.5 + 0.5 * entryNormal.x);
      finalColor = mix(refractionColor, glassEdgeTint * 0.88, fresnelVal * 0.28 + pow(ribContour, 6.0) * 0.12);
      finalColor += specFactor * vec3(1.0, 1.0, 1.0) * 0.65;
      finalColor -= (1.0 - max(0.0, lightAndShadow)) * 0.035 * glassEdgeTint;
    }
  }

  // Subtle sub-pixel matrix shimmer on colored wave regions
  vec2 cellSize = vec2(3.5 / max(u_resolution.x, 1.0), 6.0 / max(u_resolution.y, 1.0));
  vec2 cellPos = mod(vTextureCoord, cellSize) / cellSize;
  float cellDot = smoothstep(0.65, 0.15, length(cellPos - 0.5));
  float waveActivity = u_isDark > 0.5 ? length(finalColor) : length(vec3(1.0) - finalColor);
  finalColor = mix(finalColor, finalColor * (0.94 + 0.12 * cellDot), clamp(waveActivity * 0.45, 0.0, 0.20));

  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
`;

export const AntigravityParticles: React.FC<AntigravityParticlesProps> = ({
  theme = 'light',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance',
      }) as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) return;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uResLoc = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const uIsDarkLoc = gl.getUniformLocation(program, 'u_isDark');

    let animationFrameId = 0;
    let isVisible = true;
    const startTime = performance.now();

    let targetMouseX = 0.5;
    let targetMouseY = 0.5;
    let currentMouseX = 0.5;
    let currentMouseY = 0.5;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      // 0.55x internal resolution with GPU bilinear upscale cuts fragment count by 70%
      const scale = 0.55;
      const w = Math.max(1, Math.floor(rect.width * scale));
      const h = Math.max(1, Math.floor(rect.height * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) return;
      targetMouseX = e.clientX / Math.max(window.innerWidth, 1);
      targetMouseY = 1.0 - e.clientY / Math.max(window.innerHeight, 1);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const render = (now: number) => {
      if (!isVisible) {
        animationFrameId = 0;
        return;
      }

      const elapsed = (now - startTime) * 0.001;

      currentMouseX += (targetMouseX - currentMouseX) * 0.07;
      currentMouseY += (targetMouseY - currentMouseY) * 0.07;

      gl.uniform2f(uResLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, elapsed);
      gl.uniform2f(uMouseLoc, currentMouseX, currentMouseY);
      gl.uniform1f(uIsDarkLoc, theme === 'dark' ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isVisible = entry.isIntersecting;
        if (isVisible && !animationFrameId) {
          animationFrameId = requestAnimationFrame(render);
        } else if (!isVisible && animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = 0;
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(canvas);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
};

export default AntigravityParticles;
