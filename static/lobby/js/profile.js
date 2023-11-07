//프로필 변경
$(document).ready(function () {
  $("#profileImageDisplay").click(function () {
    $("#profileImageInput").click();
  });
  $("#profileImageInput").change(function () {
    const formData = new FormData();
    formData.append("profile_picture", $("#profileImageInput")[0].files[0]);

    $.ajax({
      url: "/update_profile/", 
      type: "POST",
      data: formData,
      processData: false, 
      contentType: false, 
      success: function (response) {
        if (response.status === "success") {
          $("#profileImageDisplay").attr("src", response.image_url);
        } else {
          alert("Failed to update the profile picture.");
        }
      },
    });
  });
});
