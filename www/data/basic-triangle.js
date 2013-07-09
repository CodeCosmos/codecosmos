/* Triangles and rotation */

// See also: http://processingjs.org/reference/triangle_/

// The triangle method takes six arguments, representing the three
// points that define the triangle.

// p.triangle(x1, y1, x2, y2, x3, y3);

p.background(255,255,255);

p.pushMatrix();
// Move it over a bit so we can see the whole thing
p.translate(100, 100);
// Top point is (0, -50)
// bottom-left is (-50, 25)
// bottom-right is (50, 25)
p.triangle(0, -50, -50, 25, 50, 25);
p.popMatrix();

// There's something special about those coordinates, if you add
// all the x coordinates together, or if you add all of the y
// coordinates together, you get 0.

// In math-speak you might say the centroid of the triangle is at
// the origin. This is just a precise way of saying that the center
// of the triangle is at the origin, which means the center will
// stay in the same place when you rotate it.

// Let's draw the same triangle a few more times, but
// this time we'll rotate it before we draw it!
p.pushMatrix();
p.translate(100, 100);
p.rotate(p.radians(45));
p.triangle(0, -50, -50, 25, 50, 25);
p.popMatrix();

// We can do some basic math calculations very easily too:
// Addition: 1 + 2
// Subtraction: 1 - 2
// Multiplication: 1 * 2
// Division: 1 / 2
p.pushMatrix();
p.translate(100, 100);
p.rotate(2 * p.radians(45));
p.triangle(0, -50, -50, 25, 50, 25);
p.popMatrix();

p.pushMatrix();
p.translate(100, 100);
p.rotate(p.radians(3 * 45));
p.triangle(0, -50, -50, 25, 50, 25);
p.popMatrix();

p.pushMatrix();
p.translate(100, 100);
p.rotate(p.PI);
p.triangle(0, -50, -50, 25, 50, 25);
p.popMatrix();
