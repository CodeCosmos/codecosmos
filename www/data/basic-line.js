// All of our drawing is done with a library called Processing,
// which is why the methods start with "p.". You can also use
// "processing.", but who wants to type that much?

// Unlike in math class, the origin (x=0, y=0) is in the top left,
// which means that y = 100 is below y = 0!

/* LINES */

// See also: http://processingjs.org/reference/line_/

// The line method takes four arguments, these are the x and y
// coordinates for the two points that define the line segment
// you want to draw.

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
