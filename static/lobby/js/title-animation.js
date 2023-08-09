const textToAnimate = "PLATYVERSE";


const textElement = document.getElementById("animated-text");


let currentLength = 0;


const animationInterval = setInterval(() => {
 
  const currentText = textToAnimate.substring(0, currentLength + 1);

  textElement.setAttribute("value", currentText);

  if (currentLength >= textToAnimate.length) {
    clearInterval(animationInterval);
  }
  currentLength++;
}, 300); 
