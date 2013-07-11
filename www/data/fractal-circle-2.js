var startTime = Date.now();
var time = 0;
p.loop();

p.noFill();
var drawCircleFractal = function (x, y, width, height, size) {
  if (size < 0.5) {
    return;
  }
  p.stroke(255,255,255);
  p.ellipse(x, y, size * width, size * height);
  var x1 = x + 12 * size * p.cos(time);
  var y1 = y + 12 * size * p.sin(1.618 * time);
  var x2 = x - 12 * size * p.cos(p.sqrt(2) * time);
  var y2 = y - 12 * size * p.sin(time);
  var size1 = size * 0.5;
  drawCircleFractal(x1, y1, width, height, size1);
  drawCircleFractal(x2, y2, width, height, size1);
  drawCircleFractal(x, y, width, height, size1);
};

p.draw = function () {
  time = (Date.now() - startTime) / 1000;
  p.fill(100,100,100,100);
  p.rect(0,0,p.width,p.height);
  drawCircleFractal(p.width/2, p.height/2, p.width/10, p.height/10, 10 + 2 * p.sin(time));
};
