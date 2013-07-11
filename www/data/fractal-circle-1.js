var startTime = Date.now();
var time = 0;
p.loop();

var drawCircleFractal = function (x, y, width, height, size) {
  if (size < 0.5) {
    return;
  }
  p.fill(255 - 20 * size, 255 - 20 * size, 255);
  p.ellipse(x, y, size * width, size * height);
  var x1 = x + 8 * p.cos(time);
  var y1 = y + 8 * p.sin(1.618 * time);
  var size1 = size * 0.9;
  drawCircleFractal(x1, y1, width, height, size1);
};

p.draw = function () {
  time = (Date.now() - startTime) / 1000;
  p.fill(100,100,100,100);
  p.rect(0,0,p.width,p.height);
  drawCircleFractal(p.width/2, p.height/2, p.width/10, p.height/10, 10);
};
