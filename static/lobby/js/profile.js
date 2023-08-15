$(document).ready(function() {
    $('#userProfilePic').click(function() {
        $('#imageUpload').click();
    });

    $('#imageUpload').change(function() {
        const formData = new FormData();
        formData.append('profile_picture', $('#imageUpload')[0].files[0]);
        
        $.ajax({
            url: '/update_profile/',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if(response.status === 'success') {
                    $('#userProfilePic').attr('src', response.image_url);
                } else {
                    alert('Failed to update the profile picture.');
                }
            }
        });
    });
});
