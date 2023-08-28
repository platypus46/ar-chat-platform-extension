document.addEventListener("DOMContentLoaded", function() {
    const gptApiKeyForm = document.getElementById("gptApiKeyForm");
    
    gptApiKeyForm.addEventListener("submit", function(event) {
      event.preventDefault();
      
      const csrfToken = document.getElementsByName("csrfmiddlewaretoken")[0].value;
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
        } else {
          alert("Failed to save GPT API Key.");
        }
      });
    });
  });
  