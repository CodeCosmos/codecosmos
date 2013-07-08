/**
 * Parameterize: Wave
 * from Form+Code in Design, Art, and Architecture 
 * by Casey Reas, Chandler McWilliams, and LUST
 * Princeton Architectural Press, 2010
 * ISBN 9781568989372
 * 
 * This code was written for Processing 1.2+
 * Get Processing at http://www.processing.org/download
 */
// http://formandcode.com/code-examples/parameterize-waves
var brickWidth = 40;
var brickHeight = 15;
var cols;
var rows;
var columnOffset = 60;
var rowOffset = 30;
var rotationIncrement = 0.15;

p.setup = function setup() {
  cols = p.width / columnOffset;
  rows = (p.height - columnOffset) / rowOffset;
};

p.draw = function draw() {
  p.background(255);
  p.translate(30, 30);
  for (var i=0; i < cols; i++) {
    p.pushMatrix();
    p.translate(i * columnOffset, 0);
    var r = p.random(-p.QUARTER_PI, p.QUARTER_PI);
    var dir = 1;
    for (var j = 0; j < rows; j++) {
      p.pushMatrix();
      p.translate(0, rowOffset * j);
      p.rotate(r);
      p.rect(-brickWidth/2, -brickHeight/2, brickWidth, brickHeight);
      p.popMatrix();
      r += dir * rotationIncrement;
      if (r > p.QUARTER_PI || r < -p.QUARTER_PI) {
        dir *= -1;
      }
    }
    p.popMatrix();
  }
};

p.mousePressed = function () {
  p.redraw();
};