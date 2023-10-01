/** 한글 폰트 지정 */
AFRAME.registerComponent("auto-font", {
    schema: {
      font: { type: "string", default: "" },
      fontImage: { type: "string", default: "" },
    },

    init: function () {
      const scene = document.querySelector("a-scene");

      this.data.font = this.data.font || scene.getAttribute("data-font-json");
      this.data.fontImage =
        this.data.fontImage || scene.getAttribute("data-font-png");

      // 초기 엔터티에 폰트 적용
      this.applyFontToEntities(this.el.querySelectorAll("[text]"));

      // 새로 추가되는 엔터티에 대한 이벤트 리스너
      this.el.sceneEl.addEventListener(
        "child-attached",
        this.childAttached.bind(this)
      );
    },

    pause: function () {
      this.el.sceneEl.removeEventListener(
        "child-attached",
        this.childAttached.bind(this)
      );
    },

    childAttached: function (evt) {
      if (evt.detail.el.hasAttribute("text")) {
        this.applyFontToEntities([evt.detail.el]);
      }
    },

    applyFontToEntities: function (entities) {
      entities.forEach((textEl) => {
        textEl.setAttribute("text", "font", this.data.font);
        textEl.setAttribute("text", "fontImage", this.data.fontImage);
        textEl.setAttribute("text", "shader", "msdf"); // MSDF 쉐이더 적용
        textEl.setAttribute("text", "width", 0.3);
      });
    },
  });

AFRAME.registerComponent("scene-debounced-click", {
    // 클릭 이벤트 중복 방지 코드
    init: function () {
      this.lastClickTime = 0;
      this.debounceDuration = 300; // 300ms
  
      // 씬에 클릭 이벤트 리스너 추가
      this.el.addEventListener("click", this.handleClick.bind(this));
    },
  
    handleClick: function (evt) {
      const currentTime = new Date().getTime();
  
      if (currentTime - this.lastClickTime < this.debounceDuration) {
        // 이전 클릭 이후로 충분한 시간이 지나지 않았으므로 이벤트를 무시합니다.
        evt.stopPropagation(); // 추가 이벤트 처리를 중지
        return;
      }
  
      this.lastClickTime = currentTime;
    },
  });

AFRAME.registerComponent('rounded-box', {
    schema: {
      width: { type: 'number', default: 1 },
      height: { type: 'number', default: 1 },
      depth: { type: 'number', default: 0.1 },
      radius: { type: 'number', default: 0.1 },
      color: { type: 'color', default: '#D8BFD8' }  // Light purple color
    },
  
    init: function() {
      const data = this.data;
  
      const geometry = new THREE.RoundedBoxGeometry(data.width, data.height, data.depth, data.radius);
      const material = new THREE.MeshBasicMaterial({ color: data.color });
      this.mesh = new THREE.Mesh(geometry, material);
  
      this.el.setObject3D('mesh', this.mesh);
    },
  
    update: function(oldData) {
      const data = this.data;
      if (data.color !== oldData.color) {
        this.mesh.material.color.set(data.color);
      }
    },
  
    remove: function() {
      this.el.removeObject3D('mesh');
    }
});

AFRAME.registerComponent('rounded-plane-box', {
  schema: {
    width: { type: 'number', default: 1 },
    height: { type: 'number', default: 1 },
    radius: { type: 'number', default: 0.1 },
    color: { type: 'color', default: '#D8BFD8' }  
  },

  init: function() {
    const data = this.data;

    const roundedRectShape = new THREE.Shape();
    const x = -data.width/2;  
    const y = data.height/2;
    roundedRectShape.moveTo(x, y - data.radius);
    roundedRectShape.lineTo(x, y - data.height + data.radius);
    roundedRectShape.quadraticCurveTo(x, y - data.height, x + data.radius, y - data.height);
    roundedRectShape.lineTo(x + data.width - data.radius, y - data.height);
    roundedRectShape.quadraticCurveTo(x + data.width, y - data.height, x + data.width, y - data.height + data.radius);
    roundedRectShape.lineTo(x + data.width, y - data.radius);
    roundedRectShape.quadraticCurveTo(x + data.width, y, x + data.width - data.radius, y);
    roundedRectShape.lineTo(x + data.radius, y);
    roundedRectShape.quadraticCurveTo(x, y, x, y - data.radius);

    // Convert shape to geometry
    const geometry = new THREE.ShapeBufferGeometry(roundedRectShape);
    const material = new THREE.MeshBasicMaterial({ color: data.color });
    this.mesh = new THREE.Mesh(geometry, material);

    this.el.setObject3D('mesh', this.mesh);
  },

  update: function(oldData) {
    const data = this.data;
    if (data.color !== oldData.color) {
      this.mesh.material.color.set(data.color);
    }
  },

  remove: function() {
    this.el.removeObject3D('mesh');
  }
});


AFRAME.registerComponent('click-handler', {
  init: function () {
    this.el.addEventListener('click', function (event) {
      console.log('Object clicked!');
    });
  }
});
