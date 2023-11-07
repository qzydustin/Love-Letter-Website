const startTypewriter = async (element, speed = 75) => {
  element.style.display = "block";
  const str = element.innerHTML;
  let progress = 0;
  element.innerHTML = "";
  const timer = setInterval(() => {
    const current = str.charAt(progress);
    if (current === "<") {
      // Skip over HTML tags
      progress = str.indexOf(">", progress) + 1;
    } else {
      // Increment the progress
      progress++;
    }
    // Display the current substring with a cursor
    element.innerHTML = `${str.substring(0, progress)}${
      progress & 1 ? "_" : ""
    }`;
    // If the full string is displayed, stop the interval
    if (progress >= str.length) {
      clearInterval(timer);
      // Optionally remove the cursor at the end
      element.innerHTML = str;
    }
  }, speed);
};

(() => {
  const random = (min, max) =>
    min + Math.floor(Math.random() * (max - min + 1));

  const bezier = (cp, t) => {
    const [p0, p1, p2] = cp;
    return p0
      .mul(Math.pow(1 - t, 2))
      .add(p1.mul(2 * t * (1 - t)))
      .add(p2.mul(t * t));
  };

  const inheart = (x, y, r) => {
    const nx = x / r;
    const ny = y / r;
    const nz = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny;
    return nz < 0;
  };

  class Point {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }

    clone() {
      return new Point(this.x, this.y);
    }

    add(o) {
      return new Point(this.x + o.x, this.y + o.y);
    }

    sub(o) {
      return new Point(this.x - o.x, this.y - o.y);
    }

    div(n) {
      return new Point(this.x / n, this.y / n);
    }

    mul(n) {
      return new Point(this.x * n, this.y * n);
    }
  }

  class Heart {
    constructor() {
      this.points = [];
      for (let i = 10; i < 30; i += 0.2) {
        const t = i / Math.PI;
        const x = 16 * Math.sin(t) ** 3; // Using ** for exponentiation
        const y =
          13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t);
        this.points.push(new Point(x, y));
      }
      this.length = this.points.length;
    }

    get(i, scale = 1) {
      // Using default parameter for scale
      return this.points[i].mul(scale);
    }
  }

  class Seed {
    constructor(tree, point, scale = 1, color = "#FF0000") {
      this.tree = tree;

      this.heart = {
        point,
        scale,
        color,
        figure: new Heart(),
      };

      this.circle = {
        point,
        scale,
        color,
        radius: 5,
      };
    }

    draw = () => {
      this.drawHeart();
      this.drawText();
    };

    addPosition = (x, y) => {
      this.circle.point = this.circle.point.add(new Point(x, y));
    };

    canMove = () => this.circle.point.y < this.tree.height + 20;

    move = (x, y) => {
      this.clear();
      this.drawCircle();
      this.addPosition(x, y);
    };

    canScale = () => this.heart.scale > 0.2;

    setHeartScale = (scale) => {
      this.heart.scale *= scale;
    };

    scale = (scale) => {
      this.clear();
      this.drawCircle();
      this.drawHeart();
      this.setHeartScale(scale);
    };

    drawHeart = () => {
      const { ctx } = this.tree;
      const { point, color, scale } = this.heart;

      ctx.save();
      ctx.fillStyle = color;
      ctx.translate(point.x, point.y);
      ctx.beginPath();
      ctx.moveTo(0, 0);

      for (let i = 0; i < this.heart.figure.length; i++) {
        const p = this.heart.figure.get(i, scale);
        ctx.lineTo(p.x, -p.y);
      }

      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    drawCircle = () => {
      const { ctx } = this.tree;
      const { point, color, scale, radius } = this.circle;

      ctx.save();
      ctx.fillStyle = color;
      ctx.translate(point.x, point.y);
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    drawText = () => {
      const { ctx } = this.tree;
      const { point, color, scale } = this.heart;

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
      ctx.font = '12px "微软雅黑", "Verdana"';
      ctx.fillText("Miss You", 23, 10);
      ctx.restore();
    };

    clear = () => {
      const { ctx } = this.tree;
      const { point, scale } = this.circle;
      const radius = 26;
      const w = radius * scale;
      const h = radius * scale;
      ctx.clearRect(point.x - w, point.y - h, 4 * w, 4 * h);
    };

    hover = (x, y) => {
      const { ctx } = this.tree;
      const pixel = ctx.getImageData(x, y, 1, 1);
      return pixel.data[3] === 255;
    };
  }

  class Footer {
    constructor(tree, width, height, speed = 2) {
      this.tree = tree;
      this.point = new Point(tree.seed.heart.point.x, tree.height - height / 2);
      this.width = width;
      this.height = height;
      this.speed = speed;
      this.length = 0;
    }

    draw() {
      const ctx = this.tree.ctx;
      const { point, height, length, width, speed } = this;

      ctx.save();
      ctx.strokeStyle = "rgb(35, 31, 32)";
      ctx.lineWidth = height;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.translate(point.x, point.y);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(length / 2, 0);
      ctx.lineTo(-length / 2, 0);
      ctx.stroke();
      ctx.restore();

      if (length < width) {
        this.length += speed;
      }
    }
  }

  class Tree {
    constructor(canvas, width, height, opt = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.width = width;
      this.height = height;
      this.opt = opt;
      this.record = {};
      this.initSeed();
      this.initFooter();
      this.initBranch();
      this.initBloom();
    }

    initSeed() {
      const {
        x = this.width / 2,
        y = this.height / 2,
        color = "#FF0000",
        scale = 1,
      } = this.opt.seed || {};
      const point = new Point(x, y);
      this.seed = new Seed(this, point, scale, color);
    }

    initFooter() {
      const {
        width = this.width,
        height = 5,
        speed = 2,
      } = this.opt.footer || {};
      this.footer = new Footer(this, width, height, speed);
    }

    initBranch() {
      const branches = this.opt.branch || [];
      this.branches = [];
      this.addBranches(branches);
    }

    initBloom() {
      const {
        num = 500,
        width = this.width,
        height = this.height,
      } = this.opt.bloom || {};
      const figure = this.seed.heart.figure;
      const r = 240;
      let cache = [];
      for (let i = 0; i < num; i++) {
        cache.push(this.createBloom(width, height, r, figure));
      }
      this.blooms = [];
      this.bloomsCache = cache;
    }

    toDataURL(type) {
      return this.canvas.toDataURL(type);
    }

    draw(k) {
      const rec = this.record[k];
      if (!rec) return;

      const { point, image } = rec;
      this.ctx.save();
      this.ctx.putImageData(image, point.x, point.y);
      this.ctx.restore();
    }

    addBranch(branch) {
      this.branches.push(branch);
    }

    addBranches(branches) {
      branches.forEach((branch) => {
        const [x1, y1, x2, y2, x3, y3, r, l, c] = branch;
        const p1 = new Point(x1, y1);
        const p2 = new Point(x2, y2);
        const p3 = new Point(x3, y3);
        this.addBranch(new Branch(this, p1, p2, p3, r, l, c));
      });
    }

    removeBranch(branch) {
      this.branches = this.branches.filter((b) => b !== branch);
    }

    canGrow() {
      return this.branches.length > 0;
    }

    grow() {
      this.branches.forEach((branch) => branch && branch.grow());
    }

    addBloom(bloom) {
      this.blooms.push(bloom);
    }

    removeBloom(bloom) {
      this.blooms = this.blooms.filter((b) => b !== bloom);
    }

    createBloom(
      width,
      height,
      radius,
      figure,
      color,
      alpha,
      angle,
      scale,
      place,
      speed
    ) {
      let x, y;
      while (true) {
        x = Math.random() * (width - 40) + 20;
        y = Math.random() * (height - 40) + 20;
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
      return this.blooms.length > 0;
    }

    flower(num) {
      let blooms = this.bloomsCache.splice(0, num);
      blooms.forEach((bloom) => this.addBloom(bloom));
      this.blooms.forEach((bloom) => bloom.flower());
    }

    snapshot(k, x, y, width, height) {
      const image = this.ctx.getImageData(x, y, width, height);
      this.record[k] = { image, point: new Point(x, y), width, height };
    }

    setSpeed(k, speed) {
      this.record[k || "move"].speed = speed;
    }

    move(k, x, y) {
      const ctx = this.ctx;
      const rec = this.record[k || "move"];
      let { point, image, speed = 10, width, height } = rec;

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
      const blooms = this.blooms;
      if (blooms.length) {
        blooms.forEach((bloom) => bloom.jump());
      }
      if ((blooms.length && blooms.length < 3) || !blooms.length) {
        const bloomOpt = this.opt.bloom || {};
        const width = bloomOpt.width || this.width;
        const height = bloomOpt.height || this.height;
        const figure = this.seed.heart.figure;
        const r = 240;

        for (let i = 0; i < random(1, 2); i++) {
          this.blooms.push(
            this.createBloom(
              width / 2 + width,
              height,
              r,
              figure,
              `rgb(255,${random(0, 255)},${random(0, 255)})`,
              1,
              null,
              1,
              new Point(random(-100, 600), 720),
              random(200, 300)
            )
          );
        }
      }
    }
  }

  class Branch {
    constructor(
      tree,
      point1,
      point2,
      point3,
      radius,
      length = 100,
      branchs = []
    ) {
      this.tree = tree;
      this.point1 = point1;
      this.point2 = point2;
      this.point3 = point3;
      this.radius = radius;
      this.length = length;
      this.len = 0;
      this.t = 1 / (length - 1);
      this.branchs = branchs;
    }

    grow() {
      if (this.len <= this.length) {
        const p = bezier(
          [this.point1, this.point2, this.point3],
          this.len * this.t
        );
        this.draw(p);
        this.len += 1;
        this.radius *= 0.97;
      } else {
        this.tree.removeBranch(this);
        this.tree.addBranches(this.branchs);
      }
    }

    draw(p) {
      const ctx = this.tree.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = "rgb(35, 31, 32)";
      ctx.shadowColor = "rgb(35, 31, 32)";
      ctx.shadowBlur = 2;
      ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, this.radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  class Bloom {
    constructor(
      tree,
      point,
      figure,
      color = `rgb(255,${random(0, 255)},${random(0, 255)})`,
      alpha = random(0.3, 1),
      angle = random(0, 360),
      scale = 0.1,
      place,
      speed
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

    setFigure(figure) {
      this.figure = figure;
    }

    flower = () => {
      this.draw();
      this.scale += 0.1;
      if (this.scale > 1) {
        this.tree.removeBloom(this);
      }
    };

    draw = () => {
      const { ctx } = this.tree;
      const { figure } = this;
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.point.x, this.point.y);
      ctx.scale(this.scale, this.scale);
      ctx.rotate(this.angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let i = 0; i < this.figure.length; i++) {
        const p = this.figure.get(i);
        ctx.lineTo(p.x, -p.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    jump = () => {
      if (this.point.x < -20 || this.point.y > this.tree.height + 20) {
        this.tree.removeBloom(this);
      } else {
        this.draw();
        const { x, y } = this.place
          .sub(this.point)
          .div(this.speed)
          .add(this.point);
        this.point = { x, y };
        this.angle += 0.05;
        this.speed -= 1;
      }
    };
  }

  window.random = random;
  window.bezier = bezier;
  window.Point = Point;
  window.Tree = Tree;
})(window);
