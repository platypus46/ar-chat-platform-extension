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
      this.debounceDuration = 500; // 500ms
  
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