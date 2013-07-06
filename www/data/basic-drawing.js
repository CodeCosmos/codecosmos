// All of our drawing is done with a library called Processing,
// which is why the methods start with "p.".

/* LINES */

// See also: http://processingjs.org/reference/line_/

// Unlike in math class, the origin (x=0, y=0) is in the top left,
// which means that y = 100 is below y = 0!

// The line method takes four arguments, these are the x and y
// coordinates for two points.
// p.line(x1, y1, x2, y2);

// L
p.line(10, 10, 10, 100);
p.line(10, 100, 50, 100);
// I
p.line(60, 10, 60, 100);
// N
p.line(70, 10, 70, 100);
p.line(70, 10, 100, 100);
p.line(100, 100, 100, 10);
// E
p.line(110, 10, 110, 100);
p.line(110, 10, 150, 10);
p.line(110, 55, 150, 55);
p.line(110, 100, 150, 100);

/* RECTANGLES (and squares) */

// See also: http://processingjs.org/reference/rect_/

// Processing doesn't have a special method for squares, so
// you just use the rectangle drawing rect method to draw them.

// Notice how the outside of the rect is drawn in black, this
// outline is called the stroke. The inside is filled with white,
// this is called the fill.

// The rect method takes four arguments, these are the top-left
// x and y coordinates and the width and height.
// p.rect(x, y, width, height);

// R
p.rect(10, 110, 10, 60);
p.rect(20, 110, 30, 10);
// E
p.rect(60, 110, 10, 60);
p.rect(60, 110, 40, 10);
p.rect(60, 135, 40, 10);
p.rect(60, 160, 40, 10);
// C
p.rect(110, 110, 10, 60);
p.rect(110, 110, 40, 10);
p.rect(110, 160, 40, 10);
// T
p.rect(175, 110, 10, 60);
p.rect(160, 110, 40, 10);

/* ELLIPSES (and circles) */

// See also: http://processingjs.org/reference/ellipse_/

// The ellipse method takes four arguments, these are the center
// x and y coordinates and the width and height.
// p.ellipse(x, y, width, height)

p.ellipse(210, 50, 80, 80);
p.ellipse(190, 40, 15, 15);
p.ellipse(220, 40, 15, 15);
p.ellipse(210, 70, 35, 15);