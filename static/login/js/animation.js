let font;

const loader = new THREE.FontLoader();
loader.load("/static/login/font/test_font.json", loadedFont => {
  font = loadedFont;
  startAnimation();
});

function startAnimation() {
  const textToAnimate = "PLATYVERSE";
  const sceneElement = document.getElementById("aframe-scene");
  let currentLength = 0;

  const animationInterval = setInterval(() => {
    const currentChar = textToAnimate.charAt(currentLength);
    let geometry = new THREE.TextGeometry(currentChar, {
      font: font,
      size: 1,
      height: 0.1,
      bevelEnabled: true,
      bevelSize: 0.05,
      bevelThickness: 0.05
    });

    let material = new THREE.MeshBasicMaterial({ color: "black" });
    let textMesh = new THREE.Mesh(geometry, material);

    let textEntity = document.createElement("a-entity");
    textEntity.setObject3D("mesh", textMesh);
    textEntity.setAttribute("position", { x: currentLength * -10, y: 30, z: 50 + currentLength * -5 });
    textEntity.setAttribute("scale", { x: 9, y: 9, z: 9 });

    sceneElement.appendChild(textEntity);

    textEntity.addEventListener("loaded", () => {
      textEntity.setAttribute("animation", {
        property: "position",
        to: { x: currentLength * 10 - 55, y: 40, z: 20 },
        dur: 1000,
        easing: "easeInOutQuad"
      });
    });

    if (currentLength >= textToAnimate.length - 1) {
      clearInterval(animationInterval);
      document.getElementById("gray-box").style.display = "block";
    }
    currentLength++;
  }, 300);
}




