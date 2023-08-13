function showSignup() {
  document.getElementById('gray-box').style.display = 'none'; // 로그인 박스 숨기기
  document.getElementById('signup-overlay').style.display = 'block';
  
  //document.getElementById('aframe-scene').pause();
}

function closeSignup() {
  document.getElementById('signup-overlay').style.display = 'none';
  document.getElementById('gray-box').style.display = 'block'; // 로그인 박스 보이기

  // A-Frame 씬 재시작
  document.getElementById('aframe-scene').play();
}

var registrationData = {};

function validateStep(step) {
var csrftoken = getCookie('csrftoken');

console.log("CSRF token:", csrftoken);

var formData = new FormData();
if (step === 1) {
    registrationData.username = $('#signup-username').val();
    formData.append('username', registrationData.username);
} else if (step === 2) {
    registrationData.full_name = $('#full_name').val();
    formData.append('full_name', registrationData.full_name);
} else if (step === 3) {
    registrationData.password1 = $('#password1').val();
    registrationData.password2 = $('#password2').val();
    formData.append('password1', registrationData.password1);
    formData.append('password2', registrationData.password2);
}

$.ajax({
    type: 'POST',
    url: '/validate_step/' + step + '/',
    data: formData,
    processData: false,
    contentType: false,
    beforeSend: function (xhr) {
      xhr.setRequestHeader('X-CSRFToken', csrftoken);
    },
    success: function (response) {
        if (response.status === 'success') {
            if (step === 3) {
                finalRegistration();
            } else {
                $('#step' + step).hide();
                $('#step' + (step + 1)).show();
            }
        } else {
             alert('Error: ' + response.errors);
        }
    },
    error: function () {
        alert('Error: Something went wrong.');
    }
});
}   

  function finalRegistration() {
    var csrftoken = getCookie('csrftoken');
    
      $.ajax({
          type: 'POST',
          url: '/register_login/',
          data: {
              'action': 'register',
              'username': registrationData.username,
              'full_name': registrationData.full_name,
              'password1': registrationData.password1,
              'password2': registrationData.password2,
              'csrfmiddlewaretoken': csrftoken
          },
          success: function (response) {
              if (response.status === 'success') {
               
                  window.location.href = '/login/';
              } else {
                  alert('Error: ' + response.errors);
              }
          },
          error: function () {
              alert('에러가 발생함');
          }
      });
  }


document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  var formData = new FormData(this);
  fetch('/login/', {
    method: 'POST',
    body: formData,
    headers: {
      'X-CSRFToken': getCookie('csrftoken') 
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      window.location.href = '/lobby/'; 
    } else {
      alert(data.message);
    }
  });
});

function getCookie(name) {
  var cookieArr = document.cookie.split(";");
  for (var i = 0; i < cookieArr.length; i++) {
    var cookiePair = cookieArr[i].split("=");
    if (name == cookiePair[0].trim()) {
      return decodeURIComponent(cookiePair[1]);
    }
  }
  return null;
}