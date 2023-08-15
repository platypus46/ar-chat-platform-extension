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

  const totalLength = textToAnimate.length;

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
        to: { x: currentLength * 10 - 55, y: 40, z: 30 },
        dur: 1000,
        easing: "easeInOutQuad"
      });

      // 모든 문자의 애니메이션이 끝난 후 로그인 박스와 회전 컨트롤을 표시
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

var woodenSign = document.getElementById('wooden-sign');
woodenSign.addEventListener('click', function () {
  moveCameraToWoodenSign();
});

let rotateInterval = null;

function rotateCameraByDegrees(direction) {
  let rotationAmount = direction === 'left' ? 0.5 : -0.5; 
  let totalRotation = 0;

  if (rotateInterval) {
    clearInterval(rotateInterval);
  }

  rotateInterval = setInterval(function() {
    const cameraEl = document.querySelector('a-entity[camera]');
    let currentRotation = cameraEl.getAttribute('rotation');
    cameraEl.setAttribute('rotation', { x: currentRotation.x, y: currentRotation.y + rotationAmount, z: currentRotation.z });
    totalRotation += Math.abs(rotationAmount);

    if (totalRotation >= 20) {
      clearInterval(rotateInterval);
      rotateInterval = null;
    }
  }, 20); // 20ms 마다 회전
}




function createTextbox() {
  let oldTextbox = document.getElementById("help-textbox");
  if (oldTextbox) {
    oldTextbox.remove();
  }

  let textbox = document.createElement("div");
  textbox.id = "help-textbox";

  let title = "";
  let content = "";
  switch (window.count) {
    case 1:
      title = "닉네임 생성 규칙";
      content = `
      1. 닉네임의 길이는 2이상이어야 합니다.<br>
      2. 기존 아이디와의 중복은 허용하지 않습니다.<br>
      3. 4~64자 (문자 또는 숫자)가 포함되어야 하지만, 공백이나 분음 부호를 포함할 수 없습니다.<br>
      <br>
      아래의 기호는 허용되지 않습니다.<br>
      ,  - ' + " \\ / <  >   & ; ^ # = ( ) : % * |
      `;
      break;
    case 2:
      title = "비밀번호 생성 규칙";
      content = `
      1. 비밀번호는 8~128자 (한 글자 이상과 한 숫자 이상)여야 하며 공백을 포함할 수 없습니다..<br>
      2. 비밀번호에는 하나 이상의 기호가 포함되어야합니다.<br>
      3. 비밀번호 필드는 대/소문자를 구분합니다.<br>
      `;
      break;
    default:
      title = "아이디 생성 규칙";
      content = `
      1. 사용자 아이디에 실명, 생년월일, 주소 등의 개인정보를 사용하지 마세요.<br>
      2. 패스워드, PIN 또는 기타 민감한 정보를 사용자 아이디로 사용하지 마세요.<br>
      3. 'password', 'admin', 'login' 등과 같이 피싱 시도에 사용될 수 있는 단어나 문구를 포함하지 마세요.<br>
      4. 4~64자 (문자 또는 숫자)가 포함되어야 하지만, 공백이나 분음 부호를 포함할 수 없습니다.<br>
      <br>
      아래의 기호는 허용되지 않습니다.<br>
      ,  - ' + " \\ / <  >   & ; ^ # = ( ) : % * |
      `;
      break;
  }

  textbox.innerHTML = `
    <h1 class="title">${title}</h1>
    <p class="content">${content}</p>
    <button onclick="closeTextbox()">닫기</button>`;
  
  document.body.appendChild(textbox);
}

function closeTextbox() {
  // 카메라 엘리먼트 참조
  const cameraEl = document.querySelector('a-entity[camera]');

  // 이전에 적용된 애니메이션 제거
  cameraEl.removeAttribute('animation');

  // 새로운 애니메이션 설정
  cameraEl.setAttribute('animation', {
    property: 'position',
    to: { x: 0, y: 20, z: 100 },
    dur: 2000, 
    easing: 'easeInOutQuad'
  });

  document.getElementById("help-textbox").remove();
  
  setTimeout(function() {
    document.getElementById('signup-box').style.display = 'block';
  }, 2000); 
}

function moveCameraToWoodenSign() {
  document.getElementById('signup-box').style.display = 'none';

  const cameraEl = document.querySelector('a-entity[camera]');
  const position = { x: 60, y: 6, z: 55 };

  // 애니메이션 이벤트 리스너 추가 (한 번만 실행)
  cameraEl.addEventListener('animationcomplete', function() {
    createTextbox();
  }, { once: true }); // 이곳에 { once: true } 추가

  cameraEl.setAttribute('animation', {
    property: 'position',
    to: `${position.x} ${position.y} ${position.z}`,
    dur: 2000,
    easing: 'easeInOutQuad'
  });
}
