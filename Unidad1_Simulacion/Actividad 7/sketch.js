let walkerA, walkerB;
let pointerActive = false;
let pointerX, pointerY;

let COLOR_A = [200, 80, 100];
let COLOR_B = [340, 80, 100];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();

  walkerA = new Walker(width / 2, height * 0.4, COLOR_A);
  walkerB = new Walker(width / 2, height * 0.6, COLOR_B);
}

function draw() {
  background(230, 15, 8);

  pointerActive = (mouseIsPressed || touches.length > 0);
  pointerX = touches.length > 0 ? touches[0].x : mouseX;
  pointerY = touches.length > 0 ? touches[0].y : mouseY;

  walkerA.updateBias(pointerActive ? createVector(pointerX, pointerY) : null, true);
  walkerB.updateBias(walkerA.pos, false);

  walkerA.step();
  walkerB.step();

  walkerA.show();
  walkerB.show();
}

class Walker {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.col = col;

    this.sdBase = 1.8;
    this.sd = this.sdBase;

    this.bias = createVector(0, 0);
    this.biasMax = 6;
    this.biasGrowth = 0.35;
    this.biasDecay = 0.94;

    this.levyChanceBase = 0.006;
    this.levyChance = this.levyChanceBase;
    this.levyRange = 130;
    this.dashQueue = [];
    this.dashSteps = 9;

    this.invitePhase = random(1000);
    this.inviteAmp = 0.08;

    this.trail = [];
    this.trailLife = 220;
  }

  updateBias(target, flee = false) {
    if (target) {
      let dir = p5.Vector.sub(target, this.pos);
      let d = dir.mag();

      if (d < 2) {
        dir = p5.Vector.random2D();
      }

      if (flee) dir.mult(-1);
      dir.setMag(this.biasGrowth);
      this.bias.add(dir);
      this.bias.limit(this.biasMax);

      let closeness = constrain(map(min(d, 250), 0, 250, 1, 0), 0, 1);
      this.sd = lerp(this.sdBase, this.sdBase * 0.5, closeness);
      this.levyChance = lerp(this.levyChanceBase, this.levyChanceBase * 4, closeness);
    } else {
      this.bias.mult(this.biasDecay);
      this.bias.x += sin((frameCount + this.invitePhase) * 0.01) * this.inviteAmp;
      this.bias.y += cos((frameCount + this.invitePhase) * 0.013) * this.inviteAmp;
      this.sd = lerp(this.sd, this.sdBase, 0.05);
      this.levyChance = lerp(this.levyChance, this.levyChanceBase, 0.05);
    }
  }

  step() {
    let stepVec;

    if (this.dashQueue.length > 0) {
      stepVec = this.dashQueue.shift();
    } else if (random(1) < this.levyChance) {
      let total = p5.Vector.random2D().mult(random(this.levyRange * 0.5, this.levyRange));
      let sub = total.copy().div(this.dashSteps);
      for (let i = 0; i < this.dashSteps - 1; i++) this.dashQueue.push(sub.copy());
      stepVec = sub.copy();
    } else {
      let sx = randomGaussian(this.bias.x, this.sd);
      let sy = randomGaussian(this.bias.y, this.sd);
      stepVec = createVector(sx, sy);
    }

    this.pos.add(stepVec);
    this.pos.x = constrain(this.pos.x, 0, width);
    this.pos.y = constrain(this.pos.y, 0, height);

    this.trail.push({ x: this.pos.x, y: this.pos.y, life: this.trailLife });

    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life--;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
  }

  show() {
    for (let p of this.trail) {
      let alpha = map(p.life, 0, this.trailLife, 0, 60);
      fill(this.col[0], this.col[1], this.col[2], alpha);
      circle(p.x, p.y, 6);
    }
    fill(this.col[0], this.col[1], this.col[2], 100);
    circle(this.pos.x, this.pos.y, 16);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}