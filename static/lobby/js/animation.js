const textToAnimate = "PLATYVERSE";


const textElement = document.getElementById("animated-text");


let currentLength = 0;


const animationInterval = setInterval(() => {
 
  const currentText = textToAnimate.substring(0, currentLength + 1);

  textElement.setAttribute("value", currentText);

  if (currentLength >= textToAnimate.length) {
    clearInterval(animationInterval);
    document.getElementById("gray-box").style.display = "block";
  }
  currentLength++;
}, 200); 
