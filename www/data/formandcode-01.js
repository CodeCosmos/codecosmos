/**
 * Repeat: Embedded Iteration 
 * from Form+Code in Design, Art, and Architecture 
 * by Casey Reas, Chandler McWilliams, and LUST
 * Princeton Architectural Press, 2010
 * ISBN 9781568989372
 * 
 * This code was written for Processing 1.2+
 * Get Processing at http://www.processing.org/download
 */
// http://formandcode.com/code-examples/repeat-embedded
var option = 1;
p.draw = function () {
  var x;
  var y;
  var width = p.width;
  var height = p.height;
  p.noFill();
  p.background(255);
  if (option === 1) {
    // Option 1: Stitches
    for (x = 50; x <= width - 50; x += 20) {
      for (y = 50; y <= height - 50; y += 20) {
        p.line(x - 5, y - 5, x + 5, y + 5);
        p.line(x + 5, y - 5, x - 5, y + 5);
      }
    }
  } else if (option === 2) {
    // Option 2: Perspective
    for (x = 50; x <= width - 50; x += 20) {
      for (y = 50; y <= height - 50; y += 20) {
        p.line(x, y, width/2, height/2);
      }
    }
  } else if (option === 3) {
    // Option 3: Overlapping circles
    for (x = 50; x <= width - 50; x += 20) {
      for (y = 50; y <= height - 50; y += 20) {
        p.ellipse(x, y, 40, 40);
      }
    }
  } else if (option === 4) {
    // Option 4: Rotating arcs
    var count = 120;
    for (x = 50; x <= width - 50; x += 20) {
      for (y = 50; y <= height - 50; y += 20) {
        var s = p.map(count, 120, 0, 0, p.TWO_PI * 2);
        p.arc(x, y, 14, 14, s, s + p.PI);
        count--;
      }
    }
  } else if (option === 5) {
    // Option 5: Groups of 5
    for (x = 50; x < width - 50; x += 20) {
      for (y = 50; y < height - 50; y += 20) {
        for (var i = 0; i < 16; i += 4) {
          p.line(x + i, y, x + i, y + 12);
        }
        p.line(x, y, x + 12 ,y + 12);
      }
    }
  }
};
p.mousePressed = function () {
  option++;
  if (option > 5) {
    option = 1;
  }
  p.redraw();
};