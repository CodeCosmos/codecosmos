/* Arcs */

// See also: http://processingjs.org/reference/arc_/

// The arc method takes six arguments, the first four are exactly
// the same as with an ellipse: x, y, width, height. The last two
// are the start angle and stop angle (in radians). A start angle of
// 0 and an end angle of 2 * p.PI (about 6.283) will draw a full
// ellipse!

// Draw a full circle
p.arc(50, 50, 80, 80, 0, 2 * p.PI);


// Draw a few circles, note which quadrant that is!
// It works that way because y is flipped, bigger is lower
// on the screen.
p.arc(170, 70, 80, 80, 0, 1/2 * p.PI);
p.arc(160, 60, 80, 80, 0, 1/2 * p.PI);
p.arc(150, 50, 80, 80, 0, 1/2 * p.PI);

// Draw Pac-Man!
p.arc(50, 150, 80, 80, 1/4 * p.PI, 7/4 * p.PI);

// In a method call we can add extra lines for readability
p.line(50, 150,
       50 + 40 * p.cos(1/4 * p.PI),
       150 + 40 * p.sin(1/4 * p.PI));
p.line(50, 150,
       50 + 40 * p.cos(7/4 * p.PI),
       150 + 40 * p.sin(7/4 * p.PI));
