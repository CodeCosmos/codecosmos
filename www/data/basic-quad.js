/* Quads and colors */

// See also: http://processingjs.org/reference/quad_/

// The quad method takes six arguments, representing the four
// points that define the quadrilateral. A quadrilateral is
// any shape with four sides like a rectangle, trapezoid, or square.

// p.quad(x1, y1, x2, y2, x3, y3, x4, y4);

// Paint the whole background this color.
// Try playing with these numbers.
// Here's a hint: it only understands whole numbers between 0 and 255.
p.background(255, 200, 100);

// This is a strange hourglass shape, instead of a square. The reason
// is that quad expects the points to be in clockwise order! Here
// we are giving the points from top-left, top-right, bottom-left, bottom-right.
// It wants the points from top-left, top-right, bottom-right, bottom-left.
p.pushMatrix();
// This translates us to the center of the canvas
p.translate(p.width / 2, p.height / 2);
p.quad(-20, -20, 20, -20, -20, 20, 20, 20);
p.popMatrix();

// This is a square, up and to the left of the hourglass.
// It's almost exactly the same as the above shape, 
// but we fixed the order of those points.

// We're also going to change the stroke color. This is
// what Processing calls the outline.
p.stroke(255, 0, 0);
p.pushMatrix();
// This translates us to the center of the canvas
p.translate(p.width / 4, p.height / 4);
p.quad(-20, -20, 20, -20, 20, 20, -20, 20);
p.popMatrix();

// For this one we want to change the fill color
// and the stroke color
p.fill(0, 255, 0);
p.stroke(0, 0, 255);
p.pushMatrix();
p.translate(3 * p.width / 4, p.height / 4);
p.quad(-20, 0, 20, -20, 20, 20, -20, 20);
p.popMatrix();

// There's a fourth parameter you can use for colors, called alpha.
// This makes them translucent, so you can see some of what is under them!
p.fill(0, 0, 255, 255/2);
p.pushMatrix();
p.translate(p.width / 2, 3 * p.height / 4);
p.quad(-20, -100, 20, -100, 20, 100, -20, 100);
p.quad(-100, -20, 100, -20, 100, 20, -100, 20);
p.popMatrix();
