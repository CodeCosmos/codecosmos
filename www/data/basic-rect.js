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

// Try changing the order of these drawing operations to figure out
// how it works!

// Draw a square at x = 5, y = 5 that is 250 wide by 250 tall
p.rect(5, 5, 250, 250);

// Draw RECT in rectangles over the square

// R
p.rect(30, 80, 10, 60);
p.rect(40, 80, 30, 10);
// E
p.rect(80, 80, 10, 60);
p.rect(80, 80, 40, 10);
p.rect(80, 105, 40, 10);
p.rect(80, 130, 40, 10);
// C
p.rect(130, 80, 10, 60);
p.rect(130, 80, 40, 10);
p.rect(130, 130, 40, 10);
// T
p.rect(195, 80, 10, 60);
p.rect(180, 80, 40, 10);