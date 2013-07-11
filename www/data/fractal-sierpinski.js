var drawTriangles = function (x, y, width, height, steps) {
  if (steps > 1 && width > 3 && height > 3) {
    var width1 = width / 2;
    var height1 = height / 2;
    var steps1 = steps - 1;
    drawTriangles(x, y - height1/2, width1, height1, steps1);
    drawTriangles(x - width1/2, y + height1/2, width1, height1, steps1);
    drawTriangles(x + width1/2, y + height1/2, width1, height1, steps1);
  } else {
    // Maybe you can think of other things to draw here?
    p.triangle(x - width/2, y + height/2,
               x, y - height/2,
               x + width/2, y + height/2);
  }
};

p.draw = function () {
  // try changing this!
  var numSteps = 1;
  drawTriangles(p.width/2, p.height/2, p.width, p.height, numSteps);
};
