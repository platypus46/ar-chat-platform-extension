$(document).ready(function () {
  // 프로필 이미지를 클릭하면 파일 업로드 인풋을 클릭하는 이벤트를 바인딩합니다.
  $("#profileImageDisplay").click(function () {
    $("#profileImageInput").click();
  });
  // 파일 업로드 인풋의 값이 변경되면 (파일이 업로드되면) 이 이벤트가 발생합니다.
  $("#profileImageInput").change(function () {
    const formData = new FormData();
    formData.append("profile_picture", $("#profileImageInput")[0].files[0]);

    // AJAX 요청을 통해 서버에 파일을 전송합니다.
    $.ajax({
      url: "/update_profile/", // 서버의 업데이트 프로필 URL. 실제 URL로 변경해야 합니다.
      type: "POST",
      data: formData,
      processData: false, // 파일 전송을 위해 false로 설정합니다.
      contentType: false, // 파일 전송을 위해 false로 설정합니다.
      success: function (response) {
        if (response.status === "success") {
          // 프로필 이미지의 src 속성을 업데이트하여 새 이미지를 표시합니다.
          $("#profileImageDisplay").attr("src", response.image_url);
        } else {
          // 프로필 이미지 업데이트에 실패하면 경고 메시지를 표시합니다.
          alert("Failed to update the profile picture.");
        }
      },
    });
  });
});
