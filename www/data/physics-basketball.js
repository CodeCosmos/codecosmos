var radius = 20;
var x = radius;
var y = p.height - radius;
var t = 0;
var vx = 0;
var vy = 10;
var ax = 0;
var ay = 1;
var vt = 0.01 * p.PI;
var drag = 0.99;
var dampening = 0.5;
var hoopRadius = 80;
var hoopHeight = 10;
var hoopY = p.height - 300;
var hoopX = p.width - hoopRadius;
p.loop();
p.frameRate(30);
p.draw = function () {
  
  // clear screen
  p.noStroke();
  p.fill(255,255,255,150);
  p.rect(0,0,p.width,p.height);

  // draw back hoop
  p.stroke(180,180,180);
  p.noFill();
  p.strokeWeight(5);
  p.arc(hoopX, hoopY, 2 * hoopRadius, 10, p.PI, 2 * p.PI);
  p.strokeWeight(1);
  
  // draw ball
  p.stroke(0,0,0);
  p.fill(255,200,0);
  p.pushMatrix();
  p.translate(x, y);
  p.ellipse(0, 0, 2 * radius, 2 * radius);
  p.noFill();
  p.rotate(t);
  p.arc(1.25 * radius, 0, 2 * radius, 2 * radius, 0.70 * p.PI, 1.3 * p.PI);
  p.arc(-1.25 * radius, 0, 2 * radius, 2 * radius, 1.70 * p.PI, 2.3 * p.PI);
  p.popMatrix();

  // draw front hoop
  p.stroke(140,140,140);
  p.noFill();
  p.strokeWeight(5);
  p.arc(hoopX, hoopY, 2 * hoopRadius, hoopHeight, 0, p.PI);
  p.strokeWeight(1);
  
  // draw front net
  var slope = 4;
  for (var i = 0; i < 10; i++) {
    var j = i + 1;
    
    // criss-cross line, left to slightly lower right
    p.line(hoopX - hoopRadius + i * slope, hoopY + 10 * i,
           hoopX + hoopRadius - j * slope, hoopY + 10 * j);
    // criss-cross line, left to slightly higher right
    p.line(hoopX - hoopRadius + j * slope, hoopY + 10 * j,
           hoopX + hoopRadius - i * slope, hoopY + 10 * i);
    
    // lines from the rim down to the bottom
    var angle = i * (p.PI / 20);
    p.line(hoopX - hoopRadius * p.cos(angle),
           hoopY + 0.5 * hoopHeight * p.sin(angle),
           hoopX - hoopRadius + i * slope + 40,
           hoopY + 100);
    p.line(hoopX - hoopRadius * p.cos(angle+p.PI/2),
           hoopY + 0.5 * hoopHeight * p.sin(angle+p.PI/2),
           hoopX - hoopRadius + (i + 21) * slope,
           hoopY + 100);
  }
  p.line(hoopX - hoopRadius + 40, hoopY + 100, hoopX + hoopRadius - 40, hoopY + 100);

  
  // update velocity and position
  vx = vx * drag + ax;
  vy = vy * drag + ay;
  x = x + vx;
  y = y + vy;
  t = t + vt;
  if (x <= radius) {
    vx = -vx;
    x = radius;
  }
  // bounce off the left and right wall
  if (x >= p.width - radius) {
    vx = -vx;
    x = p.width - radius;
  }
  // bounce off the bottom
  if (y >= p.height - radius) {
    y = p.height - radius;
    vy = -vy;
  }
  function dist2(x0, y0, x1, y1) {
    var dx = x1 - x0;
    var dy = y1 - y0;
    return p.sqrt(dx * dx + dy * dy);
  }
  // function to bounce off the inside or outside of the rim
  function checkRim(rimX, rimY, hoopRadius) {
    var dx = rimX - x;
    var dy = rimY - y;
    var dist = dist2(rimX, rimY, x, y);
    p.stroke(0,255,0,50);
    p.line(x, y, rimX, rimY);
    if (dist < 2 * radius) {
      var angle = p.atan2(dy, dx);
      var mag = p.sqrt(vx * vx + vy * vy);
      var nx = dx / dist;
      var ny = dy / dist;
      x = rimX - 1.75 * nx * hoopRadius;
      y = rimY - 1.75 * ny * hoopRadius;
      vy = -mag * ny;
      vx = -mag * nx;
    }
  }
  checkRim(hoopX - 4 * radius, hoopY, radius);
  checkRim(hoopX + 4 * radius, hoopY, radius);
  // function to bounce off the inside of the net
  function checkNet(x0, y0, x1, y1, r) {
    // calculate the vector of the net
    var dx = x1 - x0;
    var dy = y1 - y0;
    var len = dist2(x0, y0, x1, y1);
    // calculate the normalized dot product
    var dot = ((x - x0) * dx  + (y - y0) * dy) / len;
    // don't look at the top of the net because
    // it will bounce off the rim and we don't want to try and bounce
    // off both at the same time
    if (dot < 0.2 * len) {
      dot = 0.2 * len;
    } else if (dot > len) {
      dot = len;
    }
    var segx = x0 + dot * dx / len;
    var segy = y0 + dot * dy / len;
    p.stroke(255,0,0,50);
    p.line(x0, y0, x1, y1);
    p.line(x, y, segx, segy);
    var dist = dist2(x, y, segx, segy);
    var sx = segx - x;
    var sy = segy - y;
    var nx = sx/dist;
    var ny = sy/dist;
    p.stroke(0,255,255, 100);
    // draw exaggerated reflection vectors
    p.line(x, y,
           x + 5 * (vx - 2 * (nx * vx + ny * vy) * nx),
           y + 5 * (vx - 2 * (ny * vy + ny * vy) * ny));
    if (dist < radius) {
      vx = dampening * (vx - 2 * (nx * vx + ny * vy) * nx);
      vy = dampening * (vy - 2 * (nx * vx + ny * vy) * nx);
      x = segx - 1.1 * nx * radius;
      y = segy - 1.1 * ny * radius;
    }
  }
  checkNet(hoopX - 4 * radius, hoopY,
           hoopX - 4 * radius + 40, hoopY + 100);
  checkNet(hoopX + 4 * radius, hoopY,
           hoopX + 4 * radius - 40, hoopY + 100);
  p.stroke(0,0,255,100);
  // draw an exaggerated (5x) velocity vector
  p.line(x, y, x + vx * 5, y + vy * 5);
  vt = vx / (p.PI * radius);
};
