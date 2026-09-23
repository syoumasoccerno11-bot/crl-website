document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const navList = document.querySelector(".nav-list");

  if (toggle && navList) {
    toggle.addEventListener("click", () => {
      const isOpen = navList.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen);
    });

    navList.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navList.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");

  if (form && note) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      note.textContent = "送信フォームはまだ接続されていません。実際の送信には別途フォーム送信サービス(例: Googleフォーム, フォームメーラー等)の設定が必要です。";
    });
  }
});

(function heroWater() {
  const canvas = document.querySelector(".hero-canvas");
  const hero = document.querySelector(".hero-live");
  if (!canvas || !hero) return;

  const bubbleBox = hero.querySelector(".hero-bubbles");
  if (bubbleBox) {
    for (let i = 0; i < 7; i++) {
      const b = document.createElement("span");
      const size = 6 + Math.random() * 16;
      b.style.width = b.style.height = size + "px";
      b.style.left = Math.random() * 100 + "%";
      b.style.animationDuration = 22 + Math.random() * 18 + "s";
      b.style.animationDelay = -Math.random() * 20 + "s";
      b.style.setProperty("--sway", (Math.random() * 60 - 30).toFixed(0) + "px");
      bubbleBox.appendChild(b);
    }
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) return;

  const vert = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const frag = `
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec3 cDeep;
uniform vec3 cMid;
uniform vec3 cShallow;
float caustic(vec2 p, float time) {
  vec2 i = p;
  float c = 1.0;
  for (int n = 0; n < 5; n++) {
    float k = time * (1.0 - 3.2 / float(n + 1));
    i = p + vec2(cos(k - i.x) + sin(k + i.y), sin(k - i.y) + cos(k + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + k) / 0.006), p.y / (cos(i.y + k) / 0.006)));
  }
  c /= 5.0;
  return pow(abs(1.16 - pow(c, 1.4)), 7.0);
}
void main() {
  vec2 uv = gl_FragCoord.xy / r;
  float asp = r.x / r.y;
  vec2 q = vec2(uv.x * asp, uv.y);
  vec2 flow = vec2(
    sin(q.y * 2.4 + t * 0.32) * 0.16 + sin(q.y * 5.1 - t * 0.45) * 0.04,
    cos(q.x * 2.0 + t * 0.25) * 0.12 + cos(q.x * 4.3 + t * 0.4) * 0.035
  );
  vec2 p = (q + flow) * 6.0 - 250.0 + vec2(t * 0.08, 0.0);
  float time = t * 0.2 + 23.0;
  float c = caustic(p, time);
  float c2 = caustic(p * 0.55 - 120.0, time * 0.8 + 3.0);

  float band = sin((q.x * 2.6 + q.y * 1.7) + t * 0.25 + 1.0 * sin(q.y * 3.5 + t * 0.18));
  band = smoothstep(0.55, 1.0, band);
  float band2 = smoothstep(0.6, 1.0, sin((q.x * 1.6 - q.y * 2.2) - t * 0.2 + 0.8 * sin(q.x * 3.0 - t * 0.13)));

  float depth = smoothstep(0.0, 0.9, uv.y + 0.08 * sin(q.x * 2.8 + t * 0.1));
  vec3 col = mix(cDeep, cMid, depth);
  float glow = exp(-length((uv - vec2(0.78, 1.03)) * vec2(asp * 0.7, 1.0)) * 1.5);
  col = mix(col, cShallow, glow * 0.8);
  col += cShallow * band * 0.09 * (0.4 + depth);
  col += cShallow * band2 * 0.05;
  c = min(c, 1.0);
  col += mix(cShallow, vec3(1.0), 0.4) * c * (0.15 + 0.32 * glow + 0.1 * depth);
  col += mix(cShallow, vec3(1.0), 0.3) * c2 * 0.12;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, "r");
  const uT = gl.getUniformLocation(prog, "t");
  const uDeep = gl.getUniformLocation(prog, "cDeep");
  const uMid = gl.getUniformLocation(prog, "cMid");
  const uShallow = gl.getUniformLocation(prog, "cShallow");

  const palettes = [
    { deep: [0.0, 0.24, 0.42], mid: [0.04, 0.6, 0.86], shallow: [0.55, 0.96, 1.0] },
    { deep: [0.01, 0.07, 0.22], mid: [0.03, 0.3, 0.62], shallow: [0.3, 0.65, 0.98] },
    { deep: [0.0, 0.22, 0.3], mid: [0.05, 0.58, 0.6], shallow: [0.62, 1.0, 0.88] },
    { deep: [0.0, 0.3, 0.46], mid: [0.16, 0.74, 0.82], shallow: [0.9, 1.0, 0.96] }
  ];
  const HOLD = 16;
  const FADE = 9;
  const mixArr = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  function setPalette(sec) {
    const cycle = HOLD + FADE;
    const idx = Math.floor(sec / cycle) % palettes.length;
    const local = sec % cycle;
    const k = local < HOLD ? 0 : (local - HOLD) / FADE;
    const e = k * k * (3 - 2 * k);
    const a = palettes[idx];
    const b = palettes[(idx + 1) % palettes.length];
    gl.uniform3fv(uDeep, mixArr(a.deep, b.deep, e));
    gl.uniform3fv(uMid, mixArr(a.mid, b.mid, e));
    gl.uniform3fv(uShallow, mixArr(a.shallow, b.shallow, e));
  }

  const scale = 0.5;
  function resize() {
    const w = Math.max(2, Math.round(hero.clientWidth * scale));
    const h = Math.max(2, Math.round(hero.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  let visible = true;
  const start = performance.now();
  function draw(now) {
    resize();
    gl.uniform2f(uR, canvas.width, canvas.height);
    const sec = reduce ? 4 : Math.max(0, (now - start) / 1000);
    gl.uniform1f(uT, sec);
    setPalette(reduce ? 0 : sec);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function loop(now) {
    if (visible) draw(now);
    requestAnimationFrame(loop);
  }

  canvas.classList.add("is-ready");
  if (reduce) {
    draw(start);
    window.addEventListener("resize", () => draw(start));
  } else {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
      }).observe(hero);
    }
    requestAnimationFrame(loop);
  }
})();

(function heroTransition() {
  const hero = document.querySelector(".hero-live");
  if (!hero) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const inner = hero.querySelector(".hero-inner-live");
  const canvas = hero.querySelector(".hero-canvas");
  const cue = hero.querySelector(".hero-scroll");
  let ticking = false;

  function update() {
    ticking = false;
    const h = hero.offsetHeight || 1;
    const p = Math.min(1, Math.max(0, window.scrollY / (h * 0.85)));
    if (inner) {
      inner.style.transform = "translateY(" + (p * -14).toFixed(1) + "px)";
      inner.style.opacity = Math.max(0, 1 - p * 1.1).toFixed(3);
    }
        if (cue) cue.style.opacity = Math.max(0, 1 - p * 3).toFixed(3);
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();

  if ("IntersectionObserver" in window) {
    const targets = document.querySelectorAll("main section:not(.hero-live) .section-inner > *:not(.btn)");
    document.documentElement.classList.add("reveal-on");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    targets.forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
  }
})();

(function homeHeader() {
  const header = document.querySelector(".home .site-header");
  const hero = document.querySelector(".hero-live");
  if (!header || !hero) return;
  const update = () => {
    header.classList.toggle("is-solid", window.scrollY > hero.offsetHeight - header.offsetHeight - 8);
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
