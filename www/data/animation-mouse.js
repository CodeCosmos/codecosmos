/* Mouse based ANIMATION! */

// Start in the middle of the screen
var faceX = p.width/2;
var faceY = p.height/2;

// we want to start normal with no rotation
var upsideDown = false;

// To do animation in processing we need to put our drawing
// code in a function. This lets Processing distinguish between
// the code we want to run every time and the code we want to run once.
p.draw = function () {
  // See how far away we are from the mouse cursor
  var distanceX = p.mouseX - faceX;
  var distanceY = p.mouseY - faceY;
  // Move 50% closer to the mouse cursor
  faceX = faceX + 0.5 * distanceX;
  faceY = faceY + 0.5 * distanceY;
  
  // Save the current drawing style (black stroke, white fill)
  p.pushStyle();
  // turn off the outline
  p.noStroke();
  // paint the whole screen purple with 25% alpha
  p.fill(200, 128, 255, 0.25 * 255);
  p.rect(0, 0, p.width, p.height);
  // pop the style back to what it was (black stroke, white fill)
  p.popStyle();

  p.pushMatrix();
  p.translate(faceX, faceY);
  if (upsideDown) {
    p.rotate(p.PI);
  }

  // Draw a face as a circle
  p.ellipse(0, 0, 80, 80);
  // Left eye (well, our left)
  p.ellipse(-20, -10, 15, 15);
  // Right eye
  p.ellipse(20, -10, 15, 15);
  // Mouth
  p.ellipse(0, 20, 35, 15);
  p.popMatrix();
};

p.mousePressed = function () {
  // when the mouse is pressed, we want to flip the face upside down!
  if (upsideDown) {
    upsideDown = false;
  } else {
    upsideDown = true;
  }
};

// Update 15 times per second
p.frameRate(15);
// Start updating
p.loop();
