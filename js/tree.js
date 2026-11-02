// Canvas engine for the love tree animation.
(function () {
  const BARK = "#4a332c";

  const random = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const randomFloat = (min, max) => min + Math.random() * (max - min);

  class Point {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }

    add(o) {
      return new Point(this.x + o.x, this.y + o.y);
    }

    sub(o) {
      return new Point(this.x - o.x, this.y - o.y);
    }

    mul(n) {
      return new Point(this.x * n, this.y * n);
    }

    div(n) {
      return new Point(this.x / n, this.y / n);
    }
  }

  // Quadratic bezier
  function bezier([p1, p2, p3], t) {
    return p1
      .mul((1 - t) * (1 - t))
      .add(p2.mul(2 * t * (1 - t)))
      .add(p3.mul(t * t));
  }

  // Implicit heart: (x² + y² - 1)³ - x²y³ < 0
  function inHeart(x, y, r) {
    const a = x / r;
    const b = y / r;
    const c = a * a + b * b - 1;
    return c * c * c - a * a * b * b * b < 0;
  }

  // Parametric heart: x = 16 sin³t, y = 13 cos t - 5 cos 2t - 2 cos 3t - cos 4t
  class Heart {
    constructor() {
      this.points = [];
      for (let i = 10; i < 30; i += 0.2) {
        const t = i / Math.PI;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y =
          13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        this.points.push(new Point(x, y));
      }
    }

    get length() {
      return this.points.length;
    }

    get(i, scale = 1) {
      return this.points[i].mul(scale);
    }
  }

  function tracePath(ctx, figure, scale = 1) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < figure.length; i++) {
      const p = figure.get(i, scale);
      ctx.lineTo(p.x, -p.y);
    }
    ctx.closePath();
  }

  // Warm palette of pinks, roses and corals
  function bloomColor() {
    const hue = random(335, 375) % 360;
    return `hsl(${hue}, ${random(65, 92)}%, ${random(55, 80)}%)`;
  }

  class Seed {
    constructor(tree, point, scale, color, label) {
      this.tree = tree;
      this.baseScale = scale;
      this.label = label;
      this.heart = { point, color, scale, figure: new Heart() };
      this.circle = { point, color, scale, radius: 5 };
    }

    draw() {
      this.drawHeart();
      this.drawLabel();
    }

    // Generous hit box around the heart and its label
    hit(x, y) {
      const { point } = this.heart;
      const s = this.baseScale;
      return x > point.x - 20 * s && x < point.x + 70 * s && y > point.y - 18 * s && y < point.y + 22 * s;
    }

    canMove() {
      return this.circle.point.y < this.tree.height + 20;
    }

    move(x, y) {
      this.clear();
      this.drawCircle();
      this.circle.point = this.circle.point.add(new Point(x, y));
    }

    canScale() {
      return this.heart.scale > 0.2;
    }

    scale(factor) {
      this.clear();
      this.drawCircle();
      this.drawHeart();
      this.heart.scale *= factor;
    }

    drawHeart() {
      const { ctx } = this.tree;
      const { point, color, scale, figure } = this.heart;
      ctx.save();
      ctx.fillStyle = color;
      ctx.translate(point.x, point.y);
      tracePath(ctx, figure, scale);
      ctx.fill();
      ctx.restore();
    }

    drawCircle() {
      const { ctx } = this.tree;
      const { point, color, scale, radius } = this.circle;
      ctx.save();
      ctx.fillStyle = color;
      ctx.translate(point.x, point.y);
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }

    drawLabel() {
      const { ctx } = this.tree;
      const { point, color } = this.heart;
      const s = this.baseScale;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 0.6;
      ctx.translate(point.x, point.y);
      ctx.scale(s, s);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(15, 15);
      ctx.lineTo(66, 15);
      ctx.stroke();
      ctx.font = 'italic 600 11px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(this.label, 20, 12.5);
      ctx.restore();
    }

    clear() {
      const { point, scale } = this.circle;
      const h = 26 * scale;
      this.tree.ctx.clearRect(point.x - h, point.y - h, 4 * h, 4 * h);
    }
  }

  class Footer {
    constructor(tree, width, height, speed) {
      this.tree = tree;
      this.point = new Point(tree.seed.heart.point.x, tree.height - height / 2);
      this.width = width;
      this.height = height;
      this.speed = speed;
      this.length = 0;
    }

    draw() {
      const { ctx } = this.tree;
      const len = this.length / 2;
      ctx.save();
      ctx.strokeStyle = BARK;
      ctx.lineWidth = this.height;
      ctx.lineCap = "round";
      ctx.translate(this.point.x, this.point.y);
      ctx.beginPath();
      ctx.moveTo(-len, 0);
      ctx.lineTo(len, 0);
      ctx.stroke();
      ctx.restore();

      if (this.length < this.width) {
        this.length += this.speed;
      }
    }
  }

  class Branch {
    constructor(tree, p1, p2, p3, radius, length = 100, children = []) {
      this.tree = tree;
      this.points = [p1, p2, p3];
      this.radius = radius;
      this.length = length;
      this.children = children;
      this.len = 0;
      this.t = 1 / (length - 1);
    }

    grow() {
      if (this.len <= this.length) {
        this.draw(bezier(this.points, this.len * this.t));
        this.len += 1;
        this.radius *= 0.97;
      } else {
        this.tree.removeBranch(this);
        this.tree.addBranches(this.children);
      }
    }

    draw(p) {
      const { ctx } = this.tree;
      ctx.save();
      ctx.fillStyle = BARK;
      ctx.shadowColor = BARK;
      ctx.shadowBlur = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
  }

  class Bloom {
    constructor(tree, point, figure, opts = {}) {
      this.tree = tree;
      this.point = point;
      this.figure = figure;
      this.color = opts.color ?? bloomColor();
      this.alpha = opts.alpha ?? randomFloat(0.45, 1);
      this.angle = opts.angle ?? random(0, 360);
      this.scale = opts.scale ?? 0.1;
      this.place = opts.place;
      this.speed = opts.speed;
    }

    flower() {
      this.draw();
      this.scale += 0.1;
      if (this.scale > 1) {
        this.tree.removeBloom(this);
      }
    }

    draw() {
      const { ctx } = this.tree;
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.point.x, this.point.y);
      ctx.scale(this.scale, this.scale);
      ctx.rotate(this.angle);
      tracePath(ctx, this.figure);
      ctx.fill();
      ctx.restore();
    }

    // Falling petal step
    jump() {
      const { height } = this.tree;
      if (this.point.x < -20 || this.point.y > height + 20 || this.speed <= 1) {
        this.tree.removeBloom(this);
        return;
      }
      this.draw();
      this.point = this.place.sub(this.point).div(this.speed).add(this.point);
      this.angle += 0.05;
      this.speed -= 1;
    }
  }

  class Tree {
    constructor(canvas, opt) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { willReadFrequently: true });
      this.width = canvas.width;
      this.height = canvas.height;
      this.opt = opt;
      this.record = {};
      this.branches = [];
      this.blooms = [];
      this.bloomsCache = [];

      const { seed, footer } = opt;
      this.seed = new Seed(
        this,
        new Point(seed.x ?? this.width / 2, seed.y ?? this.height / 2),
        seed.scale,
        seed.color,
        seed.label
      );
      this.footer = new Footer(this, footer.width, footer.height, footer.speed);
      this.addBranches(opt.branch);

      const { num, width, height } = opt.bloom;
      for (let i = 0; i < num; i++) {
        this.bloomsCache.push(this.createBloom(width, height));
      }
    }

    addBranches(list) {
      for (const [x1, y1, x2, y2, x3, y3, r, l, children] of list) {
        this.branches.push(
          new Branch(this, new Point(x1, y1), new Point(x2, y2), new Point(x3, y3), r, l, children)
        );
      }
    }

    removeBranch(branch) {
      this.branches = this.branches.filter((b) => b !== branch);
    }

    canGrow() {
      return this.branches.length > 0;
    }

    grow() {
      for (const branch of [...this.branches]) {
        branch.grow();
      }
    }

    // Random point inside the heart-shaped crown
    createBloom(width, height, opts, offsetX = 0) {
      const figure = this.seed.heart.figure;
      for (;;) {
        const x = random(20, width - 20);
        const y = random(20, height - 20);
        if (inHeart(x - width / 2, height - (height - 40) / 2 - y, 240)) {
          return new Bloom(this, new Point(x + offsetX, y), figure, opts);
        }
      }
    }

    removeBloom(bloom) {
      this.blooms = this.blooms.filter((b) => b !== bloom);
    }

    canFlower() {
      return this.blooms.length > 0;
    }

    flower(num = 1) {
      this.blooms.push(...this.bloomsCache.splice(0, num));
      for (const bloom of [...this.blooms]) {
        bloom.flower();
      }
    }

    snapshot(key, x, y, width, height) {
      this.record[key] = {
        image: this.ctx.getImageData(x, y, width, height),
        point: new Point(x, y),
        width,
        height,
      };
    }

    // Slides a snapshot towards (x, y); returns true while still moving
    move(key, x, y) {
      const rec = this.record[key];
      const speed = rec.speed || 10;
      const i = Math.min(rec.point.x + speed, x);
      const j = Math.min(rec.point.y + speed, y);

      this.ctx.clearRect(rec.point.x, rec.point.y, rec.width, rec.height);
      this.ctx.putImageData(rec.image, i, j);

      rec.point = new Point(i, j);
      rec.speed = Math.max(speed * 0.95, 2);
      return i < x || j < y;
    }

    // Falling petals loop step
    jump() {
      for (const bloom of [...this.blooms]) {
        bloom.jump();
      }

      const { fall, bloom } = this.opt;
      if (this.blooms.length < fall.max) {
        const width = bloom.width / 2 + bloom.width;
        this.blooms.push(
          this.createBloom(
            width,
            bloom.height,
            {
              alpha: 1,
              scale: 1,
              place: new Point(random(fall.placeX[0], fall.placeX[1]), 720),
              speed: random(200, 300),
            },
            fall.offsetX
          )
        );
      }
    }
  }

  window.LoveTree = { Tree };
})();
