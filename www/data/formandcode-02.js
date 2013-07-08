/**
 * Repeat: Recursive Tree
 * from Form+Code in Design, Art, and Architecture 
 * by Casey Reas, Chandler McWilliams, and LUST
 * Princeton Architectural Press, 2010
 * ISBN 9781568989372
 *
 * This program is based on Context Free program 
 * "Foggy Tree by Chris Coyne:
 * http://www.contextfreeart.org/gallery/view.php?id=4 
 * 
 * This code was written for Processing 1.2+
 * Get Processing at http://www.processing.org/download
 */
// http://formandcode.com/code-examples/repeat-recursive-tree

var dotSize = 9;
var angleOffsetA = p.radians(1.5); // Convert 1.5 degrees to radians
var angleOffsetB = p.radians(50);  // Convert 50 degrees to radians
var seed1;
var seed2;

seed1 = function seed1(dotSize, angle, x, y) {
  if (dotSize > 1.0) {
    var newx;
    var newy;
    // Create a random number between 0 and 1
    var r = p.random(0, 1.0);  
    
    if (r > 0.02) {  
      // 98% chance this will happen
      p.ellipse(x, y, dotSize, dotSize);
      newx = x + (p.cos(angle) * dotSize);
      newy = y + (p.sin(angle) * dotSize);
      seed1(dotSize * 0.99, angle - angleOffsetA, newx, newy);   
    } else {  
      // 02% chance this will happen
      p.ellipse(x, y, dotSize, dotSize);
      newx = x + p.cos(angle);
      newy = y + p.sin(angle);
      seed2(dotSize * 0.99, angle + angleOffsetA, newx, newy);
      seed1(dotSize * 0.60, angle + angleOffsetB, newx, newy);
      seed2(dotSize * 0.50, angle - angleOffsetB, newx, newy);
    }
  }
};
seed2 = function seed2(dotSize, angle, x, y) {
  if (dotSize > 1.0) {
    // Create a random number between 0 and 1
    var r = p.random(0, 1.0);
    var newx;
    var newy;
    
    if (r > 0.05) {
      // 95% chance this will happen
      p.ellipse(x, y, dotSize, dotSize);
      newx = x + dotSize * p.cos(angle);
      newy = y + dotSize * p.sin(angle);
      seed2(dotSize * 0.99, angle + angleOffsetA, newx, newy);
    } else {
      // 05% chance this will happen
      p.ellipse(x, y, dotSize, dotSize);
      newx = x + p.cos(angle);
      newy = y + p.sin(angle);
      seed1(dotSize * 0.99, angle + angleOffsetA, newx, newy);  
      seed2(dotSize * 0.60, angle + angleOffsetB, newx, newy);
      seed1(dotSize * 0.50, angle - angleOffsetB, newx, newy);
    }
  }
};

// update once per second
p.frameRate(1);
p.loop();

p.draw = function draw() {
  var width = p.width;
  var height = p.height;
  p.background(255);            // White background
  p.translate(width/2, height); // Move to the center, bottom of the screen
  p.fill(0);
  p.noStroke();
  seed1(dotSize, p.radians(270), 0, 0);  // Start the tree
};
