// Check out the output of this in
// the console at the bottom-right!

p.println("Text in JavaScript is represented with strings.");
p.println('You can make a string by putting text in "quotes".');
p.println("Or you can put the text in 'quotes'.");
p.println("Use + to " + "concatenate strings. 'a' + 'b' === 'ab'.");

// This draws to the canvas on the right!

// See also:
// http://processingjs.org/reference/text_/
// http://processingjs.org/reference/loadFont_/
// http://processingjs.org/reference/textFont_/
// http://processingjs.org/reference/fill_/

// The text method takes a string and the X,Y coordinate of
// the bottom-left of the text
// p.text(string, x, y);
p.textFont(p.loadFont("serif"));
p.textSize(20);
p.fill(0,0,0);
p.text("Before drawing text on the canvas,", 10, 20);
p.text("you should first choose a font,", 10, 40);
p.text("a font size, and a fill color.", 10, 60);

p.fill(20,100,200);
p.text("You can change the fill color and draw more text too!", 10, 80);

p.textFont(p.loadFont("cursive"));
p.fill(100,100,100);
p.text("The font may also change, of course.", 10, 130);

p.textFont(p.loadFont("serif-bold"), 18);
p.text("Click the canvas to learn more about strings!", 10, 180);

p.mouseClicked = function onMouseClicked() {
  window.parent.open("https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String", "_blank");
};