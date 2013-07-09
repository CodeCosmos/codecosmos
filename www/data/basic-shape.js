/* Make any shape you want */

// See also: http://processingjs.org/reference/beginShape_/
//           http://processingjs.org/reference/endShape_/
//           http://processingjs.org/reference/vertex_/

// Feeling limited by lines, triangles, and quads? You can make
// any shape you want as long as you can list the points in
// clockwise order.

p.background(120, 220, 220);
p.pushMatrix();
// Let's draw it in the center
p.translate(p.width/2, p.height/2);

// Start our shape
p.fill(255,255,0);
p.beginShape();
// List all the points, make sure to do this in
// clockwise order around your shape!
p.vertex(-10, -100);
p.vertex(10, -100);
p.vertex(15, -80);
p.vertex(5, -50);
p.vertex(10, 0);
p.vertex(-10, 50);
p.vertex(0, 0);
p.vertex(-10, -50);
p.vertex(-5, -80);
// end the shape, and close it
p.endShape(p.CLOSE);

p.popMatrix();