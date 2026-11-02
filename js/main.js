(function () {
  const STAGE = { width: 1100, height: 680 };
  // Region of the canvas that holds the tree before it slides right
  const CROP = { x: 240, width: 610 };
  // How far the tree slides right on wide screens
  const SHIFT = 260;
  const TOGETHER_SINCE = new Date("2019-06-06T00:00:00");

  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const canvas = $("canvas");
  const background = $("background");
  const stage = $("stage");
  const stageWrap = $("stage-wrap");
  const story = $("story");
  const music = $("music");
  const sound = $("sound");

  const narrowQuery = window.matchMedia("(max-width: 899px)");
  let narrow = false;
  let started = false;

  // Layout mode can change until the animation starts, then it is locked
  function applyMode() {
    if (started) return;
    narrow = narrowQuery.matches;
    document.body.classList.toggle("is-narrow", narrow);
    if (narrow) stageWrap.after(story);
    else stage.append(story);
    tree.seed.label = narrow ? "toque aqui" : "clique aqui";
  }

  function layout() {
    applyMode();
    const available = document.documentElement.clientWidth - 32;

    if (narrow) {
      const width = Math.min(available, 560);
      const k = width / CROP.width;
      stageWrap.style.width = `${width}px`;
      stageWrap.style.height = "";
      stage.style.transform = "";
      stage.style.width = `${width}px`;
      stage.style.height = `${STAGE.height * k}px`;
      for (const c of [canvas, background]) {
        c.style.width = `${STAGE.width * k}px`;
        c.style.height = `${STAGE.height * k}px`;
        c.style.left = `${-CROP.x * k}px`;
      }
      return;
    }

    const k = Math.min(1, available / STAGE.width);
    stage.style.transform = `scale(${k})`;
    stage.style.width = "";
    stage.style.height = "";
    stageWrap.style.width = `${STAGE.width * k}px`;
    stageWrap.style.height = `${STAGE.height * k}px`;
    for (const c of [canvas, background]) {
      c.style.width = "";
      c.style.height = "";
      c.style.left = "";
    }
  }

  const tree = new LoveTree.Tree(canvas, {
    seed: { x: STAGE.width / 2 - 20, color: "#d23b5b", scale: 2.5, label: "" },
    branch: [
      [535, 680, 570, 250, 500, 200, 30, 100, [
        [540, 500, 455, 417, 340, 400, 13, 100, [[450, 435, 434, 430, 394, 395, 2, 40]]],
        [550, 445, 600, 356, 680, 345, 12, 100, [[578, 400, 648, 409, 661, 426, 3, 80]]],
        [539, 281, 537, 248, 534, 217, 3, 40],
        [546, 397, 413, 247, 328, 244, 9, 80, [
          [427, 286, 383, 253, 371, 205, 2, 40],
          [498, 345, 435, 315, 395, 330, 4, 60],
        ]],
        [546, 357, 608, 252, 678, 221, 6, 100, [[590, 293, 646, 277, 648, 271, 2, 80]]],
      ]],
    ],
    bloom: { num: 700, width: 1080, height: 650 },
    footer: { width: 1200, height: 5, speed: 10 },
  });

  layout();
  window.addEventListener("resize", layout);

  // Maps a pointer event to canvas pixel coordinates
  function toCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  }

  function onMove(e) {
    const { x, y } = toCanvas(e);
    canvas.style.cursor = tree.seed.hit(x, y) ? "pointer" : "default";
  }

  function onClick(e) {
    const { x, y } = toCanvas(e);
    if (tree.seed.hit(x, y)) start();
  }

  function onKey(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    start();
  }

  function start() {
    started = true;
    canvas.style.cursor = "default";
    canvas.removeEventListener("click", onClick);
    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("keydown", onKey);
    canvas.removeAttribute("tabindex");
    music.play().then(() => (sound.hidden = false)).catch(() => {});
  }

  canvas.addEventListener("click", onClick);
  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("keydown", onKey);

  sound.addEventListener("click", () => {
    music.muted = !music.muted;
    sound.classList.toggle("is-muted", music.muted);
    sound.setAttribute("aria-label", music.muted ? "Tocar música" : "Pausar música");
  });

  async function seedAnimate() {
    const { seed, footer } = tree;
    let t = 0;

    // Gentle heartbeat while waiting for the first tap
    while (!started) {
      t += 0.12;
      seed.clear();
      seed.heart.scale = seed.baseScale * (1 + 0.08 * Math.max(0, Math.sin(t)) ** 4);
      seed.draw();
      await sleep(16);
    }
    seed.heart.scale = seed.baseScale;

    while (seed.canScale()) {
      seed.scale(0.95);
      await sleep(10);
    }

    while (seed.canMove()) {
      seed.move(0, 2);
      footer.draw();
      await sleep(10);
    }
  }

  async function growAnimate() {
    do {
      tree.grow();
      await sleep(10);
    } while (tree.canGrow());
  }

  async function flowerAnimate() {
    do {
      tree.flower(2);
      await sleep(10);
    } while (tree.canFlower());
  }

  async function moveAnimate() {
    if (!narrow) {
      tree.snapshot("crown", CROP.x, 0, CROP.width, STAGE.height);
      while (tree.move("crown", CROP.x + SHIFT, 0)) {
        tree.footer.draw();
        await sleep(10);
      }
      tree.footer.draw();
    }

    // Freeze the finished tree on the background layer
    background.getContext("2d").drawImage(canvas, 0, 0);
    tree.ctx.clearRect(0, 0, STAGE.width, STAGE.height);
  }

  async function jumpAnimate() {
    // Falling petals start from wherever the crown ended up
    tree.opt.fall = narrow
      ? { offsetX: -SHIFT, placeX: [150, 700], max: 4 }
      : { offsetX: 0, placeX: [-100, 600], max: 5 };

    for (;;) {
      tree.ctx.clearRect(0, 0, STAGE.width, STAGE.height);
      tree.jump();
      await sleep(26);
    }
  }

  async function storyAnimate() {
    $("names").classList.add("is-visible");
    await sleep(1200);
    $("poem").classList.add("is-visible");
    await typewriter([...story.querySelectorAll(".line")]);

    $("roots").classList.add("is-visible");
    await sleep(600);
    updateClock();
    setInterval(updateClock, 1000);
    $("clock").classList.add("is-visible");
    follow($("clock"));
  }

  // On narrow screens the story sits below the tree, so keep it in view
  function follow(el) {
    if (narrow) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function typewriter(lines) {
    const texts = lines.map((line) => line.textContent);
    lines.forEach((line) => (line.textContent = ""));

    const caret = document.createElement("span");
    caret.className = "caret";

    for (let i = 0; i < lines.length; i++) {
      const text = document.createTextNode("");
      lines[i].append(text, caret);
      follow(lines[i]);
      for (const char of texts[i]) {
        text.data += char;
        await sleep(char === " " ? 25 : 45);
      }
      await sleep(i % 2 ? 450 : 200);
    }
    caret.remove();
  }

  const LABELS = {
    years: ["ano", "anos"],
    days: ["dia", "dias"],
    hours: ["hora", "horas"],
    minutes: ["minuto", "minutos"],
    seconds: ["segundo", "segundos"],
  };

  // Last anniversary of TOGETHER_SINCE that is not in the future
  function lastAnniversary(now) {
    let years = now.getFullYear() - TOGETHER_SINCE.getFullYear();
    const at = (y) => {
      const d = new Date(TOGETHER_SINCE);
      d.setFullYear(TOGETHER_SINCE.getFullYear() + y);
      return d;
    };
    if (at(years) > now) years -= 1;
    return { years: Math.max(0, years), date: at(Math.max(0, years)) };
  }

  function updateClock() {
    const now = new Date();
    const anniversary = lastAnniversary(now);
    let seconds = Math.max(0, Math.floor((now - anniversary.date) / 1000));
    const values = {
      years: anniversary.years,
      days: Math.floor(seconds / 86400),
      hours: Math.floor((seconds %= 86400) / 3600),
      minutes: Math.floor((seconds %= 3600) / 60),
      seconds: seconds % 60,
    };
    for (const [unit, value] of Object.entries(values)) {
      const num = document.querySelector(`[data-unit="${unit}"]`);
      num.textContent = unit === "years" || unit === "days" ? value : String(value).padStart(2, "0");
      num.nextElementSibling.textContent = LABELS[unit][value === 1 ? 0 : 1];
    }
  }

  async function run() {
    // The seed label is drawn on canvas, so wait for the web font first
    await document.fonts.load('italic 600 11px "Cormorant Garamond"').catch(() => {});
    await seedAnimate();
    await growAnimate();
    await flowerAnimate();
    await moveAnimate();
    storyAnimate();
    await jumpAnimate();
  }

  run();
})();
