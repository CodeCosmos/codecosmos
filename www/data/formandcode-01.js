var option = 1;
processing.draw = function () {
  processing.noFill();
  processing.background(255);
  var x;
  var y;
  var width = processing.width;
  var height = processing.height;
  var line = processing.line;
  var ellipse = processing.ellipse;
  var map = processing.map;
  var TWO_PI = processing.TWO_PI;
  var PI = processing.PI;
  var arc = processing.arc;
  if (option === 1) {
    // Option 1: Stitches
    for (x = 50; x <= width - 50; x += 20) {
      for (y = 50; y <= height - 50; y += 20) {
        line(x - 5, y - 5, x + 5, y + 5);
        line(x + 5, y - 5, x - 5, y + 5);
      }
    }
  } else if (option === 2) {
    // Option 2: Perspective
    for (x = 50; x <= width - 50; x += 20) {
      for (y = 50; y <= height - 50; y += 20) {
        line(x, y, width/2, height/2);
      }
    }
  } else if (option === 3) {
    // Option 3: Overlapping circles
    for (x = 50; x <= width - 50; x += 20) {
      for (y = 50; y <= height - 50; y += 20) {
        ellipse(x, y, 40, 40);
      }
    }
  } else if (option === 4) {
    // Option 4: Rotating arcs
    var count = 120;
    for (x = 50; x <= width - 50; x += 20) {
      for (y = 50; y <= height - 50; y += 20) {
        var s = map(count, 120, 0, 0, TWO_PI * 2);
        arc(x, y, 14, 14, s, s + PI);
        count--;
      }
    }
  } else if (option === 5) {
    // Option 5: Groups of 5
    for (x = 50; x < width - 50; x += 20) {
      for (y = 50; y < height - 50; y += 20) {
        for (var i = 0; i < 16; i += 4) {
          line(x + i, y, x + i, y + 12);
        }
        line(x, y, x + 12 ,y + 12);
      }
    }
  }
};
processing.mousePressed = function () {
  option++;
  if (option > 5) {
    option = 1;
  }
  processing.redraw();
};