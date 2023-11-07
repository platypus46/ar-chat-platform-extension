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

      this.applyFontToEntities(this.el.querySelectorAll("[text]"));

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
        textEl.setAttribute("text", "shader", "msdf"); 
        textEl.setAttribute("text", "width", 0.3);
      });
    },
  });

// 클릭 이벤트 중복 방지 코드
AFRAME.registerComponent("scene-debounced-click", {
    init: function () {
      this.lastClickTime = 0;
      this.debounceDuration = 200; 
  
      this.el.addEventListener("click", this.handleClick.bind(this));
    },
  
    handleClick: function (evt) {
      const currentTime = new Date().getTime();
  
      if (currentTime - this.lastClickTime < this.debounceDuration) {
        evt.stopPropagation(); 
        return;
      }
  
      this.lastClickTime = currentTime;
    },
  });

//모서리가 둥근 박스(3d)
AFRAME.registerComponent('rounded-box', {
    schema: {
      width: { type: 'number', default: 1 },
      height: { type: 'number', default: 1 },
      depth: { type: 'number', default: 0.1 },
      radius: { type: 'number', default: 0.1 },
      color: { type: 'color', default: '#D8BFD8' } 
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

//모서리가 둥근 박스(2d)
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

AFRAME.registerComponent('flat-shading', {
  init: function () {
    this.el.setAttribute('material', 'shader', 'flat');
    this.el.sceneEl.addEventListener('child-attached', (event) => {
      event.detail.el.setAttribute('material', 'shader', 'flat');
    });
  }
});