let font;

const loader = new THREE.FontLoader();
loader.load("/static/login/font/test_font1.json", loadedFont => {
  font = loadedFont;
  startAnimation();
});

function startAnimation() {
  const textToAnimate = "PLATYVERSE";
  const sceneElement = document.getElementById("aframe-scene");
  let currentLength = 0;

  const totalLength = textToAnimate.length;

  const animationInterval = setInterval(() => {
    const currentChar = textToAnimate.charAt(currentLength);
    let geometry = new THREE.TextGeometry(currentChar, {
      font: font,
      size: 0.8,
      height: 0.1,
      bevelEnabled: true,
      bevelSize: 0.05,
      bevelThickness: 0.05
    });

    let material = new THREE.MeshBasicMaterial({ color: "white"  });
    let textMesh = new THREE.Mesh(geometry, material);

    let textEntity = document.createElement("a-entity");
    textEntity.setObject3D("mesh", textMesh);
    textEntity.setAttribute("position", { x: currentLength * -10, y: 30, z: 50 + currentLength * -5 });
    textEntity.setAttribute("scale", { x: 7, y: 7, z: 5 });

    sceneElement.appendChild(textEntity);

    textEntity.addEventListener("loaded", () => {
      textEntity.setAttribute("animation", {
        property: "position",
        to: { x: currentLength * 7 - 40, y: 40, z: 30 },
        dur: 1000,
        easing: "easeInOutQuad"
      });

      // 모든 문자의 애니메이션이 끝난 후 로그인 박스와 회전 컨트롤 표시
      if (currentLength === totalLength - 1) {
        document.getElementById("gray-box").style.display = "block";
        document.querySelector(".rotation-controls").style.display = "flex";
      }
    });

    currentLength++;
    if (currentLength >= totalLength) {
      clearInterval(animationInterval);
    }
  }, 300);
}