/* Time+Trig based ANIMATION! */

// To do animation in processing we need to put our drawing
// code in a function. This lets Processing distinguish between
// the code we want to run every time and the code we want to run once.

// This is a variable, it stores a value. We want to remember the
// time that our code started running so we know how long
// it has been running. Date.now() tells us how many milliseconds have
// happened since January 1, 1970 GMT. This is a really BIG number!
var startTime = Date.now();

p.draw = function () {
  // This calculates the number of seconds that our code has been running.
  // We need to divide by 1000 because there are 1000 milliseconds in one
  // second.
  var secondsToCircleScreen = 30;
  // min returns the smaller of two numbers
  // faceRadius is how much space we want to reserve for the face
  var faceRadius = 40;
  var faceDiameter = faceRadius * 2;
  var screenDiameter = p.min(p.width, p.height);
  var screenRadius = screenDiameter / 2;
  var animationRadius = screenRadius - faceRadius;
  var radiansPerSecond = animationRadius / (secondsToCircleScreen * 2 * p.PI);
  var elapsedTime = (Date.now() - startTime) / 1000;
  var currentAngle = radiansPerSecond * elapsedTime;
  
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
  // center it first
  p.translate(p.width/2, p.height/2);
  // now move it again
  p.translate(animationRadius * p.cos(radiansPerSecond * elapsedTime),
              animationRadius * p.sin(radiansPerSecond * elapsedTime));

  // Draw a face as a circle
  p.ellipse(0, 0, faceRadius * 2, faceRadius * 2);
  // Left eye (well, our left)
  p.ellipse(-20, -10, 15, 15);
  // Right eye
  p.ellipse(20, -10, 15, 15);
  // Mouth
  p.ellipse(0, 20, 35, 15);
  p.popMatrix();
};

// Update 15 times per second
p.frameRate(15);
// Start updating
p.loop();
