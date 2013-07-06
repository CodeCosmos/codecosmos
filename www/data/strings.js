// Check out the output of this in
// the console at the bottom-right!

p.println("Text in JavaScript is represented with strings.");
p.println('You can make a string by putting text in "quotes".');
p.println("Or you can put the text in 'quotes'.");

p.println("Use + to " + "concatenate strings. 'a' + 'b' === 'ab'.");
p.println("The backslash character '\\' is special in strings.");
p.println("Backslash is the beginning of what's called an escape sequence.");
p.println("For example, '\\n' represents a new line\n^^ look up there");

// This draws to the canvas on the right!

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
p.text("Click the canvas to learn more!", 10, 180);

p.mouseClicked = function onMouseClicked() {
  window.parent.open("https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String", "_blank");
};