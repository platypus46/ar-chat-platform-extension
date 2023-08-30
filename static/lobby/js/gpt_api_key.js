document.addEventListener("DOMContentLoaded", function() {
  const gptApiKeyForm = document.getElementById("gptApiKeyForm");
  
  gptApiKeyForm.addEventListener("submit", function(event) {
    event.preventDefault();
    
    const csrfTokenElement = document.getElementsByName("csrfmiddlewaretoken")[0];
    const csrfToken = csrfTokenElement.value;
    const gptApiKey = document.getElementById("gptApiKey").value;
    
    fetch("/save_gpt_api_key/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken
      },
      body: JSON.stringify({ gptApiKey })
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === "success") {
        alert("GPT API Key saved successfully!");
        // Get a new CSRF token from the server and update it in the form
        fetch("/get_new_csrf_token/", {
          method: "GET",
        })
        .then(response => response.json())
        .then(data => {
          if (data.new_csrf_token) {
            csrfTokenElement.value = data.new_csrf_token;
          }
        });
      } else {
        alert("Failed to save GPT API Key.");
      }
    });
  });
});