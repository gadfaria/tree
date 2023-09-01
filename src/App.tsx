import { useLayoutEffect } from "react";
import config from "../config.json";
import "./App.css";

function App() {
  useLayoutEffect(() => {
    draw();
  }, []);

  async function draw() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    let width = canvas.width;
    let height = canvas.height;

    let opts = {
      seed: {
        x: width / 2 - 20,
        color: "rgb(190, 26, 37)",
        scale: 2,
      },
      branch: [
        [
          535,
          680,
          570,
          250,
          500,
          200,
          30,
          100,
          [
            [
              540,
              500,
              455,
              417,
              340,
              400,
              13,
              100,
              [[450, 435, 434, 430, 394, 395, 2, 40]],
            ],
            [
              550,
              445,
              600,
              356,
              680,
              345,
              12,
              100,
              [[578, 400, 648, 409, 661, 426, 3, 80]],
            ],
            [539, 281, 537, 248, 534, 217, 3, 40],
            [
              546,
              397,
              413,
              247,
              328,
              244,
              9,
              80,
              [
                [427, 286, 383, 253, 371, 205, 2, 40],
                [498, 345, 435, 315, 395, 330, 4, 60],
              ],
            ],
            [
              546,
              357,
              608,
              252,
              678,
              221,
              6,
              100,
              [[590, 293, 646, 277, 648, 271, 2, 80]],
            ],
          ],
        ],
      ],
      bloom: {
        num: 700,
        width: 1080,
        height: 650,
      },
      footer: {
        width: 1200,
        height: 5,
        speed: 10,
      },
    };

    let tree = new Tree(canvas, opts);
    let seed = tree.seed;
    let foot = tree.footer;
    let hold = 1;

    const handleCanvasClick = (e: any) => {
      const offset = canvas.getBoundingClientRect();
      const x = e.pageX - offset.left;
      const y = e.pageY - offset.top;

      console.log(seed?.hover(x, y));
      if (seed?.hover(x, y)) {
        hold = 0;
        canvas.removeEventListener("click", handleCanvasClick);
        canvas.removeEventListener("mousemove", handleMouseMove);
      }
    };

    const handleMouseMove = (e: any) => {
      const offset = canvas.getBoundingClientRect();
      const x = e.pageX - offset.left;
      const y = e.pageY - offset.top;

      if (seed?.hover(x, y)) {
        canvas.style.cursor = "pointer";
      } else {
        canvas.style.cursor = "default";
      }
    };

    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", handleMouseMove);

    await seedAnimate();
    await growAnimate();
    await flowerAnimate();
    await moveAnimate();
    textAnimate();
    await jumpAnimate();

    async function seedAnimate() {
      if (!seed) return;
      if (!foot) return;
      seed.draw();

      while (hold) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      while (seed.canScale()) {
        seed.scale(0.95);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      while (seed.canMove()) {
        seed.move(0, 2);
        foot.draw();
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    async function growAnimate() {
      do {
        tree.grow();
        await new Promise((resolve) => setTimeout(resolve, 10));
      } while (tree.canGrow());
    }

    async function flowerAnimate() {
      do {
        tree.flower(2);
        await new Promise((resolve) => setTimeout(resolve, 10));
      } while (tree.canFlower());
    }

    async function moveAnimate() {
      tree.snapshot("p1", 240, 0, 610, 680);
      while (tree.move("p1", 500, 0)) {
        foot?.draw();
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      foot?.draw();
      tree.snapshot("p2", 500, 0, 610, 680);

      // Set canvas background to an image
      if (canvas.parentElement)
        canvas.parentElement.style.background = `url(${canvas.toDataURL(
          "image/png"
        )})`;

      // Set canvas background color
      canvas.style.background = "#ffe";
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Reset canvas background
      canvas.style.background = "none";
    }

    async function jumpAnimate() {
      while (true) {
        tree.ctx.clearRect(0, 0, width, height);
        tree.jump();
        foot?.draw();
        await new Promise((resolve) => setTimeout(resolve, 26));
      }
    }

    async function textAnimate() {
      const code = document.getElementById("code") as HTMLDivElement;
      code.style.display = "block";

      const clock = document.getElementById("clock") as HTMLDivElement;
      clock.style.display = "block";

      const names = document.getElementById("names") as HTMLSpanElement;
      names.style.display = "block";

      await new Promise((resolve) => setTimeout(resolve, 1000));
      clock.style.opacity = "1";
      names.style.opacity = "1";

      const together = new Date(config.date);

      while (true) {
        timeElapse(new Date(together));
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  return (
    <div id="main">
      <span id="names">
        {config.names[0]} & {config.names[1]}
      </span>
      <div id="wrap">
        <div id="text">
          <div id="code">
            {config.lines
              .map((item) => {
                return `<span class="say">${item}</span><br>
      <span class="say"> </span><br>`;
              })
              .reduce((a, b) => {
                return a + b;
              })}
          </div>
        </div>
        <div id="clock"></div>
        <canvas id="canvas" width="1100" height="680"></canvas>
      </div>
    </div>
  );
}

export default App;

function timeElapse(date: Date) {
  let seconds = (+new Date() - date.getTime()) / 1000;
  let days = Math.floor(seconds / (3600 * 24));
  seconds = seconds % (3600 * 24);
  let hours = Math.floor(seconds / 3600);
  if (hours < 10) {
    hours = 0 + hours;
  }
  seconds = seconds % 3600;
  let minutes = Math.floor(seconds / 60);
  if (minutes < 10) {
    minutes = 0 + minutes;
  }
  seconds = Math.floor(seconds % 60);

  let result =
    '<span class="digit">' +
    days +
    '</span> dias <span class="digit">' +
    hours +
    '</span> horas <span class="digit">' +
    minutes +
    '</span> minutos <span class="digit">' +
    seconds +
    "</span> segundos";

  // $("#clock").html(result);
  const clock = document.getElementById("clock") as HTMLDivElement;
  clock.innerHTML = result;
}

function random(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function bezier(cp: IPoint[], t: number) {
  var p1 = cp[0].mul((1 - t) * (1 - t));
  var p2 = cp[1].mul(2 * t * (1 - t));
  var p3 = cp[2].mul(t * t);
  return p1.add(p2).add(p3);
}

function inheart(x: number, y: number, r: number) {
  // x^2+(y-(x^2)^(1/3))^2 = 1
  // http://www.wolframalpha.com/input/?i=x%5E2%2B%28y-%28x%5E2%29%5E%281%2F3%29%29%5E2+%3D+1
  var z =
    ((x / r) * (x / r) + (y / r) * (y / r) - 1) *
      ((x / r) * (x / r) + (y / r) * (y / r) - 1) *
      ((x / r) * (x / r) + (y / r) * (y / r) - 1) -
    (x / r) * (x / r) * (y / r) * (y / r) * (y / r);
  return z < 0;
}

interface IPoint {
  x: number;
  y: number;

  clone(): IPoint;
  add(o: IPoint): IPoint;
  sub(o: IPoint): IPoint;
  div(n: number): IPoint;
  mul(n: number): IPoint;
}

class Point implements IPoint {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Point(this.x, this.y);
  }

  add(o: Point) {
    const p = this.clone();
    p.x += o.x;
    p.y += o.y;
    return p;
  }

  sub(o: Point) {
    const p = this.clone();
    p.x -= o.x;
    p.y -= o.y;
    return p;
  }

  div(n = 1) {
    const p = this.clone();
    p.x /= n;
    p.y /= n;
    return p;
  }

  mul(n = 1) {
    const p = this.clone();
    p.x *= n;
    p.y *= n;
    return p;
  }
}

interface ITree {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  opt: any;
  record: any;
  seed?: ISeed;
  footer?: IFooter;
  branchs: IBranch[];
  blooms: IBloom[];
  bloomsCache: IBloom[];

  initSeed(): void;
  initFooter(): void;
  initBranch(): void;
  initBloom(): void;
  toDataURL(type: string): string;
  draw(k: string): void;
  addBranch(branch: IBranch): void;
  addBranchs(branchs: any[]): void;
  removeBranch(branch: IBranch): void;
  canGrow(): boolean;
  grow(): void;
  addBloom(bloom: IBloom): void;
  removeBloom(bloom: IBloom): void;
  createBloom(
    width: number,
    height: number,
    radius: number,
    figure: IHeart,
    color?: string,
    alpha?: number,
    angle?: number,
    scale?: number,
    place?: IPoint,
    speed?: number
  ): any;
  canFlower(): boolean;
  flower(num?: number): void;
  snapshot(
    k: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): void;
  setSpeed(k?: string, speed?: number): void;
  move(k?: string, x?: number, y?: number): boolean;
  jump(): void;
}

class Tree implements ITree {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  opt: any;
  record: any;
  seed?: ISeed;
  footer?: IFooter;
  branchs: any[];
  blooms: any[];
  bloomsCache: any[];

  constructor(canvas: HTMLCanvasElement, opt: any = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.opt = opt;
    this.record = {};
    this.branchs = [];
    this.blooms = [];
    this.bloomsCache = [];

    this.initSeed();
    this.initFooter();
    this.initBranch();
    this.initBloom();
  }

  initSeed() {
    let seed = this.opt.seed;
    let x = seed.x || this.width / 2;
    let y = seed.y || this.height / 2;
    let point = new Point(x, y);
    let color = seed.color;
    let scale = seed.scale;

    this.seed = new Seed(this, point, scale, color);
  }

  initFooter() {
    let footer = this.opt.footer || {};
    let width = footer.width || this.width;
    let height = footer.height || 5;
    let speed = footer.speed || 2;
    this.footer = new Footer(this, width, height, speed);
  }

  initBranch() {
    let branchs = this.opt.branch || [];
    console.log(branchs);
    this.branchs = [];
    this.addBranchs(branchs);
  }

  initBloom() {
    if (!this.seed) return;
    let bloom = this.opt.bloom || {};
    let cache = [];
    let num = bloom.num || 500;
    let width = bloom.width || this.width;
    let height = bloom.height || this.height;
    let figure = this.seed.heart.figure;
    let r = 240;

    for (let i = 0; i < num; i++) {
      cache.push(this.createBloom(width, height, r, figure));
    }

    this.blooms = [];
    this.bloomsCache = cache;
  }

  toDataURL(type: string) {
    return this.canvas.toDataURL(type);
  }

  draw(k: string) {
    var s = this,
      ctx = s.ctx;
    var rec = s.record[k];
    if (!rec) {
      return;
    }
    var point = rec.point,
      image = rec.image;

    ctx.save();
    ctx.putImageData(image, point.x, point.y);
    ctx.restore();
  }

  addBranch(branch: IBranch) {
    this.branchs.push(branch);
  }

  addBranchs(branchs: []) {
    let s = this;
    let b;
    let p1;
    let p2;
    let p3;
    let r;
    let l;
    let c;

    for (let i = 0; i < branchs.length; i++) {
      b = branchs[i];
      p1 = new Point(b[0], b[1]);
      p2 = new Point(b[2], b[3]);
      p3 = new Point(b[4], b[5]);
      r = b[6];
      l = b[7];
      c = b[8];
      s.addBranch(new Branch(s, p1, p2, p3, r, l, c));
    }
  }

  removeBranch(branch: IBranch) {
    let branchs = this.branchs;
    for (let i = 0; i < branchs.length; i++) {
      if (branchs[i] === branch) {
        branchs.splice(i, 1);
      }
    }
  }

  canGrow() {
    return !!this.branchs.length;
  }
  grow() {
    let branchs = this.branchs;
    for (let i = 0; i < branchs.length; i++) {
      let branch = branchs[i];
      if (branch) {
        branch.grow();
      }
    }
  }

  addBloom(bloom: IBloom) {
    this.blooms.push(bloom);
  }

  removeBloom(bloom: IBloom) {
    let blooms = this.blooms;
    for (let i = 0; i < blooms.length; i++) {
      if (blooms[i] === bloom) {
        blooms.splice(i, 1);
      }
    }
  }

  createBloom(
    width: number,
    height: number,
    radius: number,
    figure: IHeart,
    color?: string,
    alpha?: number,
    angle?: number,
    scale?: number,
    place?: IPoint,
    speed?: number
  ) {
    let x, y;
    while (true) {
      x = random(20, width - 20);
      y = random(20, height - 20);
      if (inheart(x - width / 2, height - (height - 40) / 2 - y, radius)) {
        return new Bloom(
          this,
          new Point(x, y),
          figure,
          color,
          alpha,
          angle,
          scale,
          place,
          speed
        );
      }
    }
  }

  canFlower() {
    return !!this.blooms.length;
  }
  flower(num = 1) {
    let s = this;
    let blooms = s.bloomsCache.splice(0, num);

    for (let i = 0; i < blooms.length; i++) {
      s.addBloom(blooms[i]);
    }
    blooms = s.blooms;
    for (let j = 0; j < blooms.length; j++) {
      blooms[j].flower();
    }
  }

  snapshot(k: string, x: number, y: number, width: number, height: number) {
    let ctx = this.ctx;
    let image = ctx.getImageData(x, y, width, height);
    this.record[k] = {
      image: image,
      point: new Point(x, y),
      width: width,
      height: height,
    };
  }
  setSpeed(k = "move", speed: number) {
    this.record[k].speed = speed;
  }
  move(k = "move", x: number, y: number) {
    let s = this;
    let ctx = s.ctx;
    let rec = s.record[k];
    let point = rec.point;
    let image = rec.image;
    let speed = rec.speed || 10;
    let width = rec.width;
    let height = rec.height;

    let i = point.x + speed < x ? point.x + speed : x;
    let j = point.y + speed < y ? point.y + speed : y;

    ctx.save();
    ctx.clearRect(point.x, point.y, width, height);
    ctx.putImageData(image, i, j);
    ctx.restore();

    rec.point = new Point(i, j);
    rec.speed = speed * 0.95;

    if (rec.speed < 2) {
      rec.speed = 2;
    }
    return i < x || j < y;
  }

  jump() {
    let s = this;
    let blooms = s.blooms;
    if (blooms.length) {
      for (let i = 0; i < blooms.length; i++) {
        blooms[i].jump();
      }
    }

    if ((blooms.length && blooms.length < 3) || !blooms.length) {
      if (!this.seed) return;
      let bloom = this.opt.bloom || {};
      let width = bloom.width || this.width;
      let height = bloom.height || this.height;
      let figure = this.seed.heart.figure;
      let r = 240;

      for (let i = 0; i < random(1, 2); i++) {
        blooms.push(
          this.createBloom(
            width / 2 + width,
            height,
            r,
            figure,
            undefined,
            1,
            undefined,
            1,
            new Point(random(-100, 600), 720),
            random(200, 300)
          )
        );
      }
    }
  }
}

interface ISeed {
  tree: ITree;
  heart: {
    point: IPoint;
    color: string;
    scale: number;
    figure: IHeart;
  };
  circle: {
    point: IPoint;
    color: string;
    scale: number;
    radius: number;
  };
  draw(): void;
  addPosition(x: number, y: number): void;
  canMove(): boolean;
  move(x: number, y: number): void;
  canScale(): boolean;
  setHeartScale(scale: number): void;
  scale(scale: number): void;
  drawHeart(): void;
  drawCirle(): void;
  drawText(): void;
  clear(): void;
  hover(x: number, y: number): boolean;
}

class Seed implements ISeed {
  tree: ITree;
  heart: {
    point: IPoint;
    color: string;
    scale: number;
    figure: IHeart;
  };
  circle: {
    point: IPoint;
    color: string;
    scale: number;
    radius: number;
  };

  constructor(tree: ITree, point: IPoint, scale = 1, color = "#FF0000") {
    this.tree = tree;

    this.heart = {
      point,
      color,
      scale,
      figure: new Heart(),
    };

    this.circle = {
      point,
      color,
      scale,
      radius: 5,
    };
  }

  draw() {
    this.drawHeart();
    this.drawText();
  }
  addPosition(x = 0, y = 0) {
    this.circle.point = this.circle.point.add(new Point(x, y));
  }
  canMove() {
    return this.circle.point.y < this.tree.height + 20;
  }
  move(x = 0, y = 0) {
    this.clear();
    this.drawCirle();
    this.addPosition(x, y);
  }
  canScale() {
    return this.heart.scale > 0.2;
  }
  setHeartScale(scale = 1) {
    this.heart.scale *= scale;
  }
  scale(scale = 1) {
    this.clear();
    this.drawCirle();
    this.drawHeart();
    this.setHeartScale(scale);
  }
  drawHeart() {
    let ctx = this.tree.ctx;
    let heart = this.heart;
    let point = heart.point;
    let color = heart.color;
    let scale = heart.scale;
    ctx.save();
    ctx.fillStyle = color;
    ctx.translate(point.x, point.y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < heart.figure.length; i++) {
      let p = heart.figure.get(i, scale);
      ctx.lineTo(p.x, -p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  drawCirle() {
    let ctx = this.tree.ctx,
      cirle = this.circle;
    let point = cirle.point,
      color = cirle.color,
      scale = cirle.scale,
      radius = cirle.radius;
    ctx.save();
    ctx.fillStyle = color;
    ctx.translate(point.x, point.y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  drawText() {
    let ctx = this.tree.ctx,
      heart = this.heart;
    let point = heart.point,
      color = heart.color,
      scale = heart.scale;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.translate(point.x, point.y);
    ctx.scale(scale, scale);
    ctx.moveTo(0, 0);
    ctx.lineTo(15, 15);
    ctx.lineTo(60, 15);
    ctx.stroke();

    ctx.moveTo(0, 0);
    ctx.scale(0.75, 0.75);
    ctx.font = "12px,Verdana";
    ctx.fillText("click here", 23, 16);
    ctx.restore();
  }
  clear() {
    let ctx = this.tree.ctx;
    let cirle = this.circle;
    let point = cirle.point;
    let scale = cirle.scale;
    let radius = 26;

    let h = radius * scale;
    let w = h;
    ctx.clearRect(point.x - w, point.y - h, 4 * w, 4 * h);
  }

  hover(x = 0, y = 0) {
    let ctx = this.tree.ctx;
    let pixel = ctx.getImageData(x, y, 1, 1);
    return pixel.data[3] == 255;
  }
}

interface IHeart {
  points: IPoint[];
  length: number;
  get(i: number, scale?: number): IPoint;
}

class Heart implements IHeart {
  points: IPoint[];
  length: number;
  constructor() {
    // x = 16 sin^3 t
    // y = 13 cos t - 5 cos 2t - 2 cos 3t - cos 4t
    // http://www.wolframalpha.com/input/?i=x+%3D+16+sin%5E3+t%2C+y+%3D+(13+cos+t+-+5+cos+2t+-+2+cos+3t+-+cos+4t)

    let points = [],
      x,
      y,
      t;
    for (let i = 10; i < 30; i += 0.2) {
      t = i / Math.PI;
      x = 16 * Math.pow(Math.sin(t), 3);
      y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      points.push(new Point(x, y));
    }
    this.points = points;
    this.length = points.length;
  }

  get(i = 0, scale = 1) {
    return this.points[i].mul(scale);
  }
}

interface IFooter {
  tree: ITree;
  point: IPoint;
  width: number;
  height: number;
  speed: number;
  length: number;
  draw(): void;
}

class Footer implements IFooter {
  tree: ITree;
  point: IPoint;
  width: number;
  height: number;
  speed: number;
  length: number;

  constructor(tree: ITree, width = 0, height = 0, speed = 2) {
    this.tree = tree;
    this.point = new Point(tree.seed?.heart.point.x, tree.height - height / 2);
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.length = 0;
  }

  draw() {
    let ctx = this.tree.ctx,
      point = this.point;
    let len = this.length / 2;

    ctx.save();
    ctx.strokeStyle = "rgb(35, 31, 32)";
    ctx.lineWidth = this.height;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.translate(point.x, point.y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, 0);
    ctx.lineTo(-len, 0);
    ctx.stroke();
    ctx.restore();

    if (this.length < this.width) {
      this.length += this.speed;
    }
  }
}

interface IBranch {
  tree: ITree;
  point1: IPoint;
  point2: IPoint;
  point3: IPoint;
  radius: number;
  length: number;
  branchs: any[];
  len: number;
  t: number;
}

class Branch implements IBranch {
  tree: ITree;
  point1: IPoint;
  point2: IPoint;
  point3: IPoint;
  radius: number;
  length: number;
  branchs: any[];
  len: number;
  t: number;

  constructor(
    tree: ITree,
    point1: IPoint,
    point2: IPoint,
    point3: IPoint,
    radius: number,
    length = 100,
    branchs = []
  ) {
    this.tree = tree;
    this.point1 = point1;
    this.point2 = point2;
    this.point3 = point3;
    this.radius = radius;
    this.length = length;
    this.branchs = branchs;
    this.len = 0;
    this.t = 1 / (this.length - 1);
  }

  grow() {
    let s = this,
      p;
    if (s.len <= s.length) {
      p = bezier([s.point1, s.point2, s.point3], s.len * s.t);
      s.draw(p);
      s.len += 1;
      s.radius *= 0.97;
    } else {
      s.tree.removeBranch(s);
      s.tree.addBranchs(s.branchs);
    }
  }

  draw(p: IPoint) {
    let s = this;
    let ctx = s.tree.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "rgb(35, 31, 32)";
    ctx.shadowColor = "rgb(35, 31, 32)";
    ctx.shadowBlur = 2;
    ctx.moveTo(p.x, p.y);
    ctx.arc(p.x, p.y, s.radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

interface IBloom {
  tree: ITree;
  point: IPoint;
  figure: IHeart;
  color: string;
  alpha: number;
  angle: number;
  scale: number;
  place?: IPoint;
  speed?: number;
}

class Bloom implements IBloom {
  tree: ITree;
  point: IPoint;
  figure: IHeart;
  color: string;
  alpha: number;
  angle: number;
  scale: number;
  place?: IPoint;
  speed?: number;
  constructor(
    tree: ITree,
    point: IPoint,
    figure: IHeart,
    color = "rgb(255," + random(0, 255) + "," + random(0, 255) + ")",
    alpha = random(0.3, 1),
    angle = random(0, 360),
    scale = 0.1,
    place?: IPoint,
    speed?: number
  ) {
    this.tree = tree;
    this.point = point;
    this.color = color;
    this.alpha = alpha;
    this.angle = angle;
    this.scale = scale;
    this.place = place;
    this.speed = speed;
    this.figure = figure;
  }

  setFigure(figure: IHeart) {
    this.figure = figure;
  }
  flower() {
    let s = this;
    s.draw();
    s.scale += 0.1;

    if (s.scale > 1) {
      s.tree.removeBloom(s);
    }
  }
  draw() {
    let s = this;
    let ctx = s.tree.ctx;
    let figure = s.figure;

    ctx.save();
    ctx.fillStyle = s.color;
    ctx.globalAlpha = s.alpha;
    ctx.translate(s.point.x, s.point.y);
    ctx.scale(s.scale, s.scale);
    ctx.rotate(s.angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < figure.length; i++) {
      let p = figure.get(i);
      ctx.lineTo(p.x, -p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  jump() {
    let s = this;
    let height = s.tree.height;

    if (s.point.x < -20 || s.point.y > height + 20) {
      s.tree.removeBloom(s);
    } else {
      if (!s.place || !s.speed) return;
      s.draw();
      s.point = s.place.sub(s.point).div(s.speed).add(s.point);
      s.angle += 0.05;
      s.speed -= 1;
    }
  }
}
