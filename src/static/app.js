document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        
        const participantsList = details.participants.map(p => `<li><span class="participant-email">${p}</span><button class="delete-btn" data-activity="${name}" data-email="${p}" title="Unregister">✕</button></li>`).join("");

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <div class="participants-header">
              <strong>Participants (${details.participants.length}/${details.max_participants}):</strong>
              <button class="add-participant-btn" data-activity="${name}" title="Add participant">+</button>
            </div>
            <ul class="participants-list">
              ${participantsList || '<li class="no-participants">No participants yet</li>'}
            </ul>
            <div class="add-participant-form hidden" id="form-${name}">
              <input type="email" class="add-email-input" placeholder="student@mergington.edu" />
              <button class="confirm-add-btn" data-activity="${name}">Add</button>
              <button class="cancel-add-btn" data-activity="${name}">Cancel</button>
            </div>
          </div>
        `;

        activitiesList.appendChild(activityCard);
        
        // Add event listeners to delete buttons
        activityCard.querySelectorAll(".delete-btn").forEach(btn => {
          btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const activity = btn.dataset.activity;
            const email = btn.dataset.email;
            
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
                {
                  method: "POST",
                }
              );
              
              if (response.ok) {
                fetchActivities();
              } else {
                const result = await response.json();
                alert(result.detail || "Failed to unregister");
              }
            } catch (error) {
              alert("Error unregistering participant");
              console.error("Error:", error);
            }
          });
        });
        
        // Add event listeners to add participant button
        const addBtn = activityCard.querySelector(".add-participant-btn");
        const form = activityCard.querySelector(".add-participant-form");
        const confirmBtn = activityCard.querySelector(".confirm-add-btn");
        const cancelBtn = activityCard.querySelector(".cancel-add-btn");
        const emailInput = activityCard.querySelector(".add-email-input");
        
        addBtn.addEventListener("click", () => {
          form.classList.toggle("hidden");
          if (!form.classList.contains("hidden")) {
            emailInput.focus();
          }
        });
        
        cancelBtn.addEventListener("click", () => {
          form.classList.add("hidden");
          emailInput.value = "";
        });
        
        confirmBtn.addEventListener("click", async () => {
          const email = emailInput.value.trim();
          const activity = confirmBtn.dataset.activity;
          if (!email) {
            alert("Please enter an email address");
            return;
          }
          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
              {
                method: "POST",
              }
            );
            const result = await response.json();
            if (response.ok) {
              // Close form and reset input
              form.classList.add("hidden");
              emailInput.value = "";
              fetchActivities();
            } else {
              alert(result.detail || "Failed to add participant");
            }
          } catch (error) {
            alert("Error adding participant");
            console.error("Error:", error);
          }
        });
        
        // Allow Enter key to submit
        emailInput.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            confirmBtn.click();
          }
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
