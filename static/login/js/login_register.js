function showSignup() {
    document.getElementById('gray-box').style.display = 'none'; // 로그인 박스 숨기기
    document.getElementById('signup-overlay').style.display = 'block';
  
    // A-Frame 씬 일시 중지
    document.getElementById('aframe-scene').pause();
  }
  
  function closeSignup() {
    document.getElementById('signup-overlay').style.display = 'none';
    document.getElementById('gray-box').style.display = 'block'; // 로그인 박스 보이기
  
    // A-Frame 씬 재시작
    document.getElementById('aframe-scene').play();
  }
  
  document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    var formData = new FormData(this);
    formData.append('action', 'register');
    fetch('/register/', {
      method: 'POST',
      body: formData,
      headers: {
        'X-CSRFToken': getCookie('csrftoken') // CSRF 토큰 추가
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        // 회원가입 성공 처리
        window.location.href = '/login/'; 
      } else {
        // 에러 처리
      }
    });
  });
  
  // getCookie 함수 정의 (CSRF 토큰을 가져오는 함수)
  function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
  
  
  