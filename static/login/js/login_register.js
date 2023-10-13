document.addEventListener("DOMContentLoaded", function () {
  let currentStep = 1;
  let registrationData = {};

  function showStep(step) {
    for (let i = 1; i <= 3; i++) {
      document.getElementById("step" + i).style.display = "none";
      let inputFields = document.querySelectorAll("#step" + i + " input");
      inputFields.forEach((field) => (field.required = false));
    }
    let currentInputFields = document.querySelectorAll(
      "#step" + step + " input"
    );
    currentInputFields.forEach((field) => (field.required = true));
    document.getElementById("step" + step).style.display = "block";
  }

  function resetSignup() {
    registrationData = {};
    currentStep = 1;
    showStep(currentStep);
  }

  document.getElementById("next-to-step2").addEventListener("click", function (e) {
    e.preventDefault();
    let username = document.getElementById("signup-username").value;

    if (!username || username.length < 4 || /[\s\W]/.test(username)) {
      alert("Username is required and must be at least 4 characters long without special characters and spaces!");
      return;
    }

    registrationData.username = username;
    currentStep++;
    showStep(currentStep);
  });

  document.getElementById("next-to-step3").addEventListener("click", function (e) {
    e.preventDefault();
    let full_name = document.getElementById("signup-full_name").value;

    // 정규 표현식: 한글과 영어만 허용
    let regex = /^[가-힣A-Za-z]+$/;

    if (!full_name || !regex.test(full_name)) {
      alert("Full Name is required and must contain only English and Korean characters without spaces!");
      return;
    }

    registrationData.full_name = full_name;
    currentStep++;
    showStep(currentStep);
  });

  document.getElementById("go-to-login-button").addEventListener("click", function () {
    resetSignup();
    closeSignup();
  });

  document.getElementById("signup-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const csrftoken = getCookie("csrftoken");

    if (currentStep === 3) {
      let password1 = document.getElementById("signup-password1").value;
      let password2 = document.getElementById("signup-password2").value;

      if (!password1 || !password2 || /\s/.test(password1) || password1 !== password2) {
        alert("Please ensure passwords are filled, do not contain spaces, and match!");
        return;
      }

      registrationData.password1 = password1;
      registrationData.password2 = password2;
    }

      $.ajax({
        type: "POST",
        url: "/validate_step/" + currentStep + "/",
        data: { ...registrationData, csrfmiddlewaretoken: csrftoken },
        success: function (response) {
          console.log("registrationData:", registrationData); // 이 부분을 추가
          if (response.status === "success") {
            if (currentStep === 3) {
              $.ajax({
                type: "POST",
                url: "/register_login/",
                data: {
                  action: "register", // 추가된 부분
                  ...registrationData,
                  csrfmiddlewaretoken: csrftoken,
                },
                success: function (response) {
                  if (response.status === "success") {
                    window.location.href = "/login/";
                  } else {
                    alert(
                      "Registration Error: " +
                        (response.errors || "Unknown Error")
                    );
                  }
                },
                error: function (jqXHR) {
                  let errorMessage =
                    "Error: Something went wrong during registration.";
                  if (jqXHR.responseJSON && jqXHR.responseJSON.errors) {
                    errorMessage += " " + jqXHR.responseJSON.errors;
                  }
                  alert(errorMessage);
                },
              });
            } else {
              currentStep++;
              showStep(currentStep);
            }
          } else {
            alert("Validation Error: " + (response.errors || "Unknown Error"));
          }
        },
        error: function (jqXHR) {
          let errorMessage = "Error: Something went wrong during validation.";
          if (jqXHR.responseJSON && jqXHR.responseJSON.errors) {
            errorMessage += " " + jqXHR.responseJSON.errors;
          }
          alert(errorMessage);
        },
      });
    });
});

function getCookie(name) {
  var cookieArr = document.cookie.split(";");
  for (var i = 0; i < cookieArr.length; i++) {
    var cookiePair = cookieArr[i].split("=");
    if (name == cookiePair[0].trim()) return decodeURIComponent(cookiePair[1]);
  }
  return null;
}

document
  .getElementById("go-to-signup-button")
  .addEventListener("click", showSignup);
document
  .getElementById("go-to-login-button")
  .addEventListener("click", closeSignup);
function showSignup() {
  document.getElementById("login-container").style.display = "none";
  document.getElementById("signup-container").style.display = "block";
}

function closeSignup() {
  document.getElementById("signup-container").style.display = "none";
  document.getElementById("login-container").style.display = "block";
}

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const csrftoken = getCookie("csrftoken");
  const formData = new FormData(this);

  fetch("/login/", {
    method: "POST",
    body: formData,
    headers: {
      "X-CSRFToken": csrftoken,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success")
        window.location.href = "/lobby/" + data.username + "/";
      else alert(data.message);
    })
    .catch(() => {
      alert("로그인 중 에러가 발생했습니다.");
    });
});
