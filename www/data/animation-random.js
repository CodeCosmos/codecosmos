/* Random ANIMATION! */

// Start in the middle of the screen
var faceX = p.width/2;
var faceY = p.height/2;
var randomScaleX = 2.0;
var randomScaleY = 10.0;

// To do animation in processing we need to put our drawing
// code in a function. This lets Processing distinguish between
// the code we want to run every time and the code we want to run once.
p.draw = function () {

  // p.random(low, high) returns a new random number between low and high every time it is called
  // for example, p.random(-1, 1) will return numbers bigger than -1 but smaller than 1 such as
  // 0.1237861287, -0.75176, 0, 0.99999, etc.
  faceX = faceX + p.random(-randomScaleX/2, randomScaleX/2);
  faceY = faceY + p.random(-randomScaleY/2, randomScaleY/2);
  
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
  // when the mouse is clicked, make randomScaleX 50% bigger
  randomScaleX = randomScaleX * 1.5;
};

// Update 15 times per second
p.frameRate(15);
// Start updating
p.loop();
