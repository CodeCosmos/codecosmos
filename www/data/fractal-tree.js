var startTime = Date.now();
var t = 0;
p.loop();

var drawBranches = function (length) {
  p.pushMatrix();
  var theta1 = (1/6) * p.PI + p.sin(t)/100;
  var theta2 = -(1/6) * p.PI + p.sin(t)/100;
  var scaleBranch1 = 0.66;
  var scaleBranch2 = 0.66;
  if (length < 3) {
    p.strokeWeight(1);
    p.stroke(0, 100, 0);
  } else {
    p.strokeWeight(p.sqrt(length) / 2);
    p.stroke(100, 100, 0);
  }
  
  p.line(0, 0, 0, -length);
  if (length > 3) {
    p.pushMatrix();
    p.translate(0, -length);
    p.rotate(theta1);
    drawBranches(length * scaleBranch1);
    p.popMatrix();

    p.pushMatrix();
    p.translate(0, -length);
    p.rotate(theta2);
    drawBranches(length * scaleBranch2);
    p.popMatrix();
  }
  p.popMatrix();
};

p.draw = function () {
  t = (Date.now() - startTime)/1000;
  p.noStroke();
  p.fill(255,255,255,200);
  p.rect(0, 0, p.width, p.height);
  p.translate(p.width/2, p.height);
  drawBranches(p.height/4);
};
