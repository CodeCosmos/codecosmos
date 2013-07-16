/*
The trick to drawing a heart is to use a cubic
bezier curve. You can learn more about them here:
http://en.wikipedia.org/wiki/B%C3%A9zier_curve
*/

// color page
p.background(0, 0, 0);

//heart
p.pushMatrix();
p.translate(p.width/2, p.height/2);
p.scale(9,9);
p.noStroke();
p.fill(255, 0, 0);

// These are the y coordinates of the middle of the heart
var topy = -10;
var bottomy = 20;
// Play with these numbers to get the
// exact heart shape that you want. These
// are the control points of the bezier curves
var cx1 = 10;
var cy1 = -20;
var cx2 = 30;
var cy2 = -10;

p.beginShape();
// Start at the top-middle of the heart
p.vertex(0, topy);
// Curve around the right side from top to bottom
p.bezierVertex(cx1, cy1, cx2, cy2, 0, bottomy);
// Curve around the left side from bottom to top
p.bezierVertex(-cx2, cy2, -cx1, cy1, 0, topy);
p.endShape(p.CLOSE);

// Here we draw the control points of the curves to
// make it easier to visualize what is going on.
// You'll probably want to comment out or remove
// this code after you find the control points you want.
p.fill(255,255,255);
p.ellipse(0, topy, 1, 1);
p.ellipse(0, bottomy, 1, 1);
p.ellipse(cx1, cy1, 1, 1);
p.ellipse(cx2, cy2, 1, 1);
p.strokeWeight(0.1);
p.stroke(255,255,255);
p.line(0, topy, cx1, cy1);
p.line(cx1, cy1, cx2, cy2);
p.line(cx2, cy2, 0, bottomy);

p.popMatrix();