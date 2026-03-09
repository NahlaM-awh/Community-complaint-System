// Location management
let currentLocationMethod = "manual";

function switchLocationMethod(method) {
    currentLocationMethod = method;
    
    // Update tab styles
    document.querySelectorAll('.location-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-method="${method}"]`).classList.add('active');
    
    // Update location method display
    document.querySelectorAll('.location-method').forEach(div => {
        div.style.display = 'none';
    });
    
    if (method === "manual") {
        document.getElementById("manual-location").style.display = 'block';
    } else if (method === "gps") {
        document.getElementById("gps-location").style.display = 'block';
    }
}

function getGPSLocation() {
    const gpsStatus = document.getElementById("gps-status");
    
    if (!navigator.geolocation) {
        gpsStatus.innerHTML = '<span style="color: #e74c3c;">❌ Geolocation is not supported by your browser</span>';
        return;
    }
    
    gpsStatus.innerHTML = '<span style="color: #f39c12;">⏳ Getting your location...</span>';
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const locationString = `${lat.toFixed(4)}, ${lng.toFixed(4)} (GPS)`;
            
            document.getElementById("gps-location-value").value = locationString;
            gpsStatus.innerHTML = `<span style="color: #27ae60;">✓ Location acquired: ${locationString}</span>`;
        },
        function(error) {
            gpsStatus.innerHTML = `<span style="color: #e74c3c;">❌ ${error.message}</span>`;
        }
    );
}

function getLocationInput() {
    if (currentLocationMethod === "manual") {
        return document.getElementById("location").value;
    } else if (currentLocationMethod === "gps") {
        return document.getElementById("gps-location-value").value;
    }
    return "";
}

function clearImage() {
    document.getElementById("proof-image").value = "";
    document.getElementById("image-preview").style.display = "none";
    document.getElementById("preview-img").src = "";
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert("Image is too large. Max size is 5MB.");
        event.target.value = "";
        return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById("image-preview");
        const previewImg = document.getElementById("preview-img");
        previewImg.src = e.target.result;
        preview.style.display = "block";
        // Store base64 in data attribute for submission
        document.getElementById("proof-image").dataset.base64 = e.target.result;
    };
    reader.readAsDataURL(file);
}

document.addEventListener("DOMContentLoaded", function() {
    const fileInput = document.getElementById("proof-image");
    if (fileInput) {
        fileInput.addEventListener("change", handleImageUpload);
    }

    // Password show/hide toggle for all login forms
    document.querySelectorAll(".toggle-password").forEach(function(button) {
        // Accessibility label
        button.setAttribute("aria-label", "Show password");

        button.addEventListener("click", function() {
            const targetId = this.getAttribute("data-target");
            const input = document.getElementById(targetId);
            if (!input) return;

            if (input.type === "password") {
                input.type = "text";
                this.setAttribute("aria-label", "Hide password");
            } else {
                input.type = "password";
                this.setAttribute("aria-label", "Show password");
            }
        });
    });
});

// Show/hide "Other" category text field
function toggleOtherCategory() {
    const select = document.getElementById("category");
    const otherGroup = document.getElementById("other-category-group");
    const otherInput = document.getElementById("other-category");
    if (!select || !otherGroup || !otherInput) return;

    if (select.value === "Other") {
        otherGroup.style.display = "block";
    } else {
        otherGroup.style.display = "none";
        otherInput.value = "";
    }
}

function submitComplaint() {
    let category = document.getElementById("category").value;
    const description = document.getElementById("description").value;
    const location = getLocationInput();

    // Handle "Other" category with custom text
    if (category === "Other") {
        const otherValue = (document.getElementById("other-category").value || "").trim();
        if (!otherValue) {
            alert("Please enter a category for 'Other'.");
            return;
        }
        category = otherValue;
    }

    if (!category || !description || !location) {
        alert("Please fill in all fields!");
        return;
    }

    const fileInput = document.getElementById("proof-image");
    const imageBase64 = fileInput.dataset.base64 || null;

    const complaint = {
        category: category,
        description: description,
        location: location,
        image: imageBase64
    };

    fetch("/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(complaint)
    })
    .then(async response => {
        // Handle duplicate complaint (HTTP 409)
        if (response.status === 409) {
            let data = {};
            try {
                data = await response.json();
            } catch (e) {
                // ignore JSON parse errors for safety
            }

            const existingId = data.existing_complaint_id;
            const isDuplicate = data.is_duplicate;

            if (isDuplicate && existingId) {
                const confirmSupport = confirm(
                    "Similar complaint already exists.\n\nWould you like to support it instead?"
                );
                if (confirmSupport) {
                    supportComplaint(existingId, function () {
                        // After supporting, refresh user's complaints so counts are updated
                        loadUserComplaints();
                    });
                }
            } else {
                alert(data.message || "A similar complaint already exists.");
            }
            // Stop normal success flow
            return null;
        }

        if (!response.ok) {
            let errData = null;
            try {
                errData = await response.json();
            } catch (e) {
                // ignore
            }
            throw new Error(errData && errData.message ? errData.message : "Network response was not ok");
        }
        return response.json();
    })
    .then(data => {
        // If data is null, it was already handled (duplicate + support prompt)
        if (!data) return;

        alert(data.message);
        // Reset form
        document.getElementById("category").value = "";
        document.getElementById("description").value = "";
        document.getElementById("location").value = "";
        document.getElementById("gps-location-value").value = "";
        document.getElementById("gps-status").innerHTML = "";
        clearImage();
        // Refresh user complaints
        loadUserComplaints();
    })
    .catch(error => {
        console.error("Error:", error);
        alert(error.message || "Something went wrong!");
    });
}

function loadUserComplaints() {
    fetch("/my-complaints")
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById("userComplaintsContainer");
        if (!container) return;

        if (data.length === 0) {
            container.innerHTML = "<p class='loading-text'>No complaints submitted yet.</p>";
            return;
        }

        container.innerHTML = "";
        data.forEach(complaint => {
            let statusClass = "status-pending";
            if (complaint.status === "In Progress") statusClass = "status-in-progress";
            if (complaint.status === "Resolved") statusClass = "status-resolved";
            
            let priorityClass = "priority-low";
            if (complaint.priority === "Medium") priorityClass = "priority-medium";
            if (complaint.priority === "High") priorityClass = "priority-high";
            if (complaint.priority === "Emergency") priorityClass = "priority-emergency";
            
            const imageHTML = complaint.image ? `<div class="complaint-image-container"><img src="${complaint.image}" alt="Proof"></div>` : "";
            const dateSubmitted = complaint.submitted_at ? new Date(complaint.submitted_at).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : "N/A";
            const workerInfo = complaint.assigned_worker ? `<p style="background: #e8f4f8; padding: 10px; border-radius: 4px; margin-top: 10px;"><strong>👷 Assigned to Worker:</strong> ${complaint.assigned_worker}</p>` : '<p style="color: #999; font-size: 14px;">Not yet assigned to a worker</p>';
            const latestUpdate = complaint.worker_updates && complaint.worker_updates.length > 0 ? complaint.worker_updates[complaint.worker_updates.length - 1] : null;
            const updateInfo = latestUpdate ? `<p style="background: #fff5f5; padding: 10px; border-radius: 4px; margin-top: 10px; border-left: 4px solid #f39c12;"><strong>📋 Latest Update:</strong> ${latestUpdate.update}</p>` : '';
            const supportCount = complaint.support_count || 0;
            const rating = complaint.rating || null;
            const feedback = complaint.feedback || "";

            let ratingDisplay = "";
            let feedbackDisplay = "";
            let ratingForm = "";

            if (rating) {
                const filled = "★".repeat(rating);
                const empty = "☆".repeat(5 - rating);
                ratingDisplay = `<p><strong>Rating:</strong> <span class="rating-stars" style="color:#f1c40f; font-size:16px;">${filled}${empty}</span></p>`;
            }

            if (feedback) {
                feedbackDisplay = `<p><strong>User Feedback:</strong> ${feedback}</p>`;
            }

            // Allow rating only if resolved and no rating yet
            if (complaint.status === "Resolved" && !rating) {
                ratingForm = `
                    <div class="update-form" style="margin-top:10px;">
                        <p style="margin:0 0 6px 0;"><strong>Rate this complaint resolution:</strong></p>
                        <div id="rating-${complaint.id}" class="rating-input" data-value="0" style="margin-bottom:8px; cursor:pointer; color:#f1c40f; font-size:20px;">
                            <span class="star" data-value="1" onclick="setFeedbackRating(${complaint.id},1)">☆</span>
                            <span class="star" data-value="2" onclick="setFeedbackRating(${complaint.id},2)">☆</span>
                            <span class="star" data-value="3" onclick="setFeedbackRating(${complaint.id},3)">☆</span>
                            <span class="star" data-value="4" onclick="setFeedbackRating(${complaint.id},4)">☆</span>
                            <span class="star" data-value="5" onclick="setFeedbackRating(${complaint.id},5)">☆</span>
                        </div>
                        <textarea id="feedback-${complaint.id}" placeholder="Write your feedback..." style="width:100%; padding:8px; border-radius:4px; border:1px solid #ddd; min-height:60px; box-sizing:border-box; margin-bottom:8px;"></textarea>
                        <button class="submit-btn" style="width:100%; padding:8px;" onclick="submitComplaintFeedback(${complaint.id})">
                            Submit Feedback
                        </button>
                    </div>
                `;
            }
            
            container.innerHTML += `
                <div class="complaint-card">
                    <p><strong>ID:</strong> #${complaint.id}</p>
                    <p><strong>Submitted:</strong> <span class="submission-date">📅 ${dateSubmitted}</span></p>
                    <p><strong>Category:</strong> ${complaint.category}</p>
                    <p><strong>Priority:</strong> <span class="${priorityClass}">${complaint.priority || "Low"}</span></p>
                    <p><strong>Description:</strong> ${complaint.description}</p>
                    <p><strong>Location:</strong> ${complaint.location}</p>
                    <p><strong>Support:</strong> ${supportCount} people supported</p>
                    ${imageHTML}
                    <p><strong>Status:</strong> <span class="${statusClass}">${complaint.status}</span></p>
                    ${ratingDisplay}
                    ${feedbackDisplay}
                    ${ratingForm}
                    ${workerInfo}
                    ${updateInfo}
                </div>
            `;
        });
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

// Generic support/upvote helper
function supportComplaint(complaintId, onSuccess) {
    fetch(`/support/${complaintId}`, {
        method: "POST"
    })
    .then(async response => {
        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            // ignore JSON parse errors
        }

        if (!response.ok) {
            if (response.status === 401) {
                alert("Please log in to support complaints.");
            } else {
                alert(data.message || "Unable to support this complaint.");
            }
            return;
        }

        alert(data.message || "Thank you for supporting this complaint!");
        if (typeof onSuccess === "function") {
            onSuccess(data.support_count);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Something went wrong while supporting the complaint.");
    });
}

// Star rating helpers for feedback
function setFeedbackRating(complaintId, value) {
    const container = document.getElementById(`rating-${complaintId}`);
    if (!container) return;
    container.dataset.value = value;

    const stars = container.querySelectorAll(".star");
    stars.forEach(star => {
        const starValue = parseInt(star.getAttribute("data-value"), 10);
        star.textContent = starValue <= value ? "★" : "☆";
    });
}

function submitComplaintFeedback(complaintId) {
    const ratingContainer = document.getElementById(`rating-${complaintId}`);
    const feedbackInput = document.getElementById(`feedback-${complaintId}`);

    if (!ratingContainer || !feedbackInput) {
        alert("Feedback form not found.");
        return;
    }

    const rating = parseInt(ratingContainer.dataset.value || "0", 10);
    const feedback = feedbackInput.value.trim();

    if (!rating || rating < 1 || rating > 5) {
        alert("Please select a rating from 1 to 5 stars.");
        return;
    }

    fetch(`/complaint/${complaintId}/feedback`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            rating: rating,
            feedback: feedback
        })
    })
    .then(async response => {
        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            // ignore
        }

        if (!response.ok) {
            alert(data.message || "Unable to submit feedback.");
            return;
        }

        alert(data.message || "Thank you for your feedback!");
        // Refresh complaints so rating + feedback show everywhere
        loadUserComplaints();
    })
    .catch(error => {
        console.error("Error submitting feedback:", error);
        alert("Something went wrong while submitting feedback.");
    });
}

function loadUserNotifications() {
    fetch("/notifications")
    .then(res => res.json())
    .then(data => {
        const container = document.getElementById("userNotificationsContainer");
        if (!container) return;

        if (data.length === 0) {
            container.innerHTML = "<p class='loading-text' style='color: #999;'>No notifications yet.</p>";
            return;
        }

        container.innerHTML = "";
        data.forEach(notif => {
            const unreadClass = notif.read ? '' : 'notification-unread';
            const icon = notif.title.includes('Update') ? '🔔' : '📬';
            
            container.innerHTML += `
                <div class="notification-item ${unreadClass}" style="background: #f9f9f9; padding: 15px; margin-bottom: 10px; border-left: 4px solid #667eea; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <p style="margin: 0 0 5px 0; font-weight: 600; color: #333;">${icon} ${notif.title}</p>
                            <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">${notif.message}</p>
                            <small style="color: #999;">${notif.created_at}</small>
                        </div>
                        ${!notif.read ? `<span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px; white-space: nowrap; margin-left: 10px;">NEW</span>` : ''}
                    </div>
                </div>
            `;
        });
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function loadAdminStats(allComplaints) {
    const statsContainer = document.getElementById("statsContainer");
    if (!statsContainer) return;

    const total = allComplaints.length;
    const pending = allComplaints.filter(c => c.status === "Pending").length;
    const inProgress = allComplaints.filter(c => c.status === "In Progress").length;
    const resolved = allComplaints.filter(c => c.status === "Resolved").length;

    statsContainer.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Total Complaints</span>
            <span class="stat-value">${total}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Pending</span>
            <span class="stat-value">${pending}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">In Progress</span>
            <span class="stat-value">${inProgress}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Resolved</span>
            <span class="stat-value">${resolved}</span>
        </div>
    `;
}

// Global filter state for admin dashboard
let currentFilter = "all";
let allComplaints = []; // Store all complaints for searching

function filterComplaints(status) {
    currentFilter = status;
    
    // Clear search input when changing filter
    const filterInput = document.getElementById("filterInput");
    if (filterInput) {
        filterInput.value = "";
    }
    
    // Update active nav item
    document.querySelectorAll('.admin-nav li').forEach(li => {
        li.classList.remove('active');
    });
    
    // Find and mark the clicked item as active
    const navItems = document.querySelectorAll('.admin-nav li');
    const statusMap = {
        'all': 0,
        'Pending': 1,
        'In Progress': 2,
        'Resolved': 3
    };
    if (statusMap[status] !== undefined) {
        navItems[statusMap[status]].classList.add('active');
    }
    
    // Update section header title
    const headerTitle = document.querySelector('.section-header h2');
    if (status === 'all') {
        headerTitle.textContent = 'Manage All Complaints';
    } else {
        headerTitle.textContent = `${status} Complaints`;
    }
    
    // Reload with filter
    loadComplaints();
}

function loadComplaints(statusFilter) {
    const filterStatus = statusFilter || currentFilter;
    
    fetch("/complaints")
    .then(res => res.json())
    .then(data => {
        const list = document.getElementById("complaintList");
        if (!list) return;

        // Store all complaints for search functionality
        allComplaints = data;
        
        // Update stats
        loadAdminStats(data);
        
        // Filter data based on current filter
        let filteredData = data;
        if (filterStatus !== "all") {
            filteredData = data.filter(c => c.status === filterStatus);
        }

        list.innerHTML = "";
        
        if (filteredData.length === 0) {
            const message = filterStatus === "all" 
                ? "No complaints submitted yet." 
                : `No ${filterStatus.toLowerCase()} complaints.`;
            list.innerHTML = `<p class='loading-text'>${message}</p>`;
            return;
        }

        filteredData.forEach(c => {
            let statusClass = "status-pending";
            if (c.status === "In Progress") statusClass = "status-in-progress";
            if (c.status === "Resolved") statusClass = "status-resolved";
            
            let priorityClass = "priority-low";
            if (c.priority === "Medium") priorityClass = "priority-medium";
            if (c.priority === "High") priorityClass = "priority-high";
            if (c.priority === "Emergency") priorityClass = "priority-emergency";
            
            const imageHTML = c.image ? `<div class="complaint-image-container"><img src="${c.image}" alt="Proof"></div>` : "";
            const dateSubmitted = c.submitted_at ? new Date(c.submitted_at).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : "N/A";
            
            list.innerHTML += `
                <div class="card">
                    <div>
                        <strong>User</strong>
                        <p>${c.user}</p>
                    </div>
                    <div>
                        <strong>Submitted</strong>
                        <p style="font-size: 12px;">📅 ${dateSubmitted}</p>
                    </div>
                    <div>
                        <strong>Category</strong>
                        <p>${c.category}</p>
                    </div>
                    <div>
                        <strong>Location</strong>
                        <p>${c.location}</p>
                    </div>
                    <div style="grid-column: 1 / -1; background: #f9f9f9; padding: 10px; border-radius: 4px; border-left: 4px solid #667eea;">
                        <strong>📝 Description</strong>
                        <p style="margin: 5px 0; color: #555; font-size: 13px;">${c.description}</p>
                    </div>
                    <div>
                        <strong>Priority</strong>
                        <select id="priority-${c.id}" class="priority-select" onchange="updatePriority(${c.id})">
                            <option value="Low" ${c.priority === "Low" ? "selected" : ""}>🟢 Low</option>
                            <option value="Medium" ${c.priority === "Medium" ? "selected" : ""}>🟡 Medium</option>
                            <option value="High" ${c.priority === "High" ? "selected" : ""}>🔴 High</option>
                            <option value="Emergency" ${c.priority === "Emergency" ? "selected" : ""}>🚨 Emergency</option>
                        </select>
                        <p style="font-size: 11px; color: #999; margin-top: 3px;"><span class="${priorityClass}">${c.priority}</span></p>
                    </div>
                    <div>
                        <strong>Status</strong>
                        <p><span class="${statusClass}">${c.status}</span></p>
                    </div>
                    ${c.assigned_worker ? `
                    <div style="background: #ecf0f1; padding: 8px; border-radius: 4px; margin: 5px 0;">
                        <strong>👷 Assigned to</strong>
                        <p>${c.assigned_worker}</p>
                    </div>
                    ` : ''}
                    ${c.worker_updates && c.worker_updates.length > 0 ? `
                    <div style="background: #d5f4e6; padding: 8px; border-radius: 4px; margin: 5px 0; border-left: 4px solid #27ae60;">
                        <strong>📋 Latest Update (✓ Applied)</strong>
                        <p style="margin: 5px 0; font-size: 13px;">${c.worker_updates[c.worker_updates.length - 1].update}</p>
                        <p style="margin: 0; font-size: 11px; color: #555;">Status: <strong>${c.worker_updates[c.worker_updates.length - 1].status}</strong> | ${new Date(c.worker_updates[c.worker_updates.length - 1].timestamp).toLocaleString()}</p>
                    </div>
                    ` : ''}
                    <div style="display: flex; gap: 5px;">
                        <select id="status-${c.id}" class="status-select">
                            <option value="Pending" ${c.status === "Pending" ? "selected" : ""}>Pending</option>
                            <option value="In Progress" ${c.status === "In Progress" ? "selected" : ""}>In Progress</option>
                            <option value="Resolved" ${c.status === "Resolved" ? "selected" : ""}>Resolved</option>
                        </select>
                        <button onclick="updateStatus(${c.id})">Update</button>
                        <button onclick="showAssignWorkerModal(${c.id})" style="background: #667eea; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">👷 Assign</button>
                        <button onclick="showWorkerUpdates(${c.id})" style="background: #f39c12; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">📋 Updates</button>
                    </div>
                    ${imageHTML}
                </div>
            `;
        });
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function updateStatus(id) {
    const statusSelect = document.getElementById(`status-${id}`);
    const newStatus = statusSelect.value;
    
    fetch(`/update/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        loadComplaints();
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function updatePriority(id) {
    const prioritySelect = document.getElementById(`priority-${id}`);
    const newPriority = prioritySelect.value;
    
    fetch(`/priority/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ priority: newPriority })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        loadComplaints();
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

window.onload = function() {
    // Skip dashboard JS on simple login pages
    if (document.body && document.body.classList.contains("login-page")) {
        return;
    }

    const list = document.getElementById("complaintList");
    if (list) {
        // Admin dashboard
        loadComplaints();
        
        // Add search event listener
        const filterInput = document.getElementById("filterInput");
        if (filterInput) {
            filterInput.addEventListener("keyup", searchComplaints);
            filterInput.addEventListener("change", searchComplaints);
        }
    } else {
        // User dashboard
        loadUserNotifications();
        loadUserComplaints();
    }
}

function searchComplaints() {
    const searchTerm = document.getElementById("filterInput").value.toLowerCase();
    const list = document.getElementById("complaintList");
    
    if (!list || allComplaints.length === 0) return;
    
    // Filter by status AND search term
    let filteredData = allComplaints;
    
    // Apply status filter
    if (currentFilter !== "all") {
        filteredData = filteredData.filter(c => c.status === currentFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
        filteredData = filteredData.filter(c => {
            return c.user.toLowerCase().includes(searchTerm) ||
                   c.category.toLowerCase().includes(searchTerm) ||
                   c.description.toLowerCase().includes(searchTerm) ||
                   c.location.toLowerCase().includes(searchTerm) ||
                   c.id.toString().includes(searchTerm);
        });
    }
    
    // Render filtered results
    list.innerHTML = "";
    
    if (filteredData.length === 0) {
        const message = searchTerm ? 
            `No complaints found matching "${searchTerm}"` :
            (currentFilter === "all" ? "No complaints submitted yet." : `No ${currentFilter.toLowerCase()} complaints.`);
        list.innerHTML = `<p class='loading-text'>${message}</p>`;
        return;
    }
    
    filteredData.forEach(c => {
        let statusClass = "status-pending";
        if (c.status === "In Progress") statusClass = "status-in-progress";
        if (c.status === "Resolved") statusClass = "status-resolved";
        
        let priorityClass = "priority-low";
        if (c.priority === "Medium") priorityClass = "priority-medium";
        if (c.priority === "High") priorityClass = "priority-high";
        if (c.priority === "Emergency") priorityClass = "priority-emergency";
        
        const imageHTML = c.image ? `<div class="complaint-image-container"><img src="${c.image}" alt="Proof"></div>` : "";
        const dateSubmitted = c.submitted_at ? new Date(c.submitted_at).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) : "N/A";
        
        list.innerHTML += `
            <div class="card">
                <div>
                    <strong>User</strong>
                    <p>${c.user}</p>
                </div>
                <div>
                    <strong>Submitted</strong>
                    <p style="font-size: 12px;">📅 ${dateSubmitted}</p>
                </div>
                <div>
                    <strong>Category</strong>
                    <p>${c.category}</p>
                </div>
                <div>
                    <strong>Priority</strong>
                    <select id="priority-${c.id}" class="priority-select" onchange="updatePriority(${c.id})">
                        <option value="Low" ${c.priority === "Low" ? "selected" : ""}>🟢 Low</option>
                        <option value="Medium" ${c.priority === "Medium" ? "selected" : ""}>🟡 Medium</option>
                        <option value="High" ${c.priority === "High" ? "selected" : ""}>🔴 High</option>
                        <option value="Emergency" ${c.priority === "Emergency" ? "selected" : ""}>🚨 Emergency</option>
                    </select>
                    <p style="font-size: 11px; color: #999; margin-top: 3px;"><span class="${priorityClass}">${c.priority}</span></p>
                </div>
                <div>
                    <strong>Status</strong>
                    <p><span class="${statusClass}">${c.status}</span></p>
                </div>
                <div style="display: flex; gap: 5px;">
                    <select id="status-${c.id}" class="status-select">
                        <option value="Pending" ${c.status === "Pending" ? "selected" : ""}>Pending</option>
                        <option value="In Progress" ${c.status === "In Progress" ? "selected" : ""}>In Progress</option>
                        <option value="Resolved" ${c.status === "Resolved" ? "selected" : ""}>Resolved</option>
                    </select>
                    <button onclick="updateStatus(${c.id})">Update</button>
                    <button onclick="showAssignWorkerModal(${c.id})" style="background: #667eea; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">👷 Assign</button>
                    <button onclick="showWorkerUpdates(${c.id})" style="background: #f39c12; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">📋 Updates</button>
                </div>
                ${imageHTML}
            </div>
        `;
    });
};

// Worker Assignment Functions
async function showAssignWorkerModal(complaintId) {
    try {
        const response = await fetch('/workers');
        if (!response.ok) {
            alert('Error loading workers');
            return;
        }
        
        const workers = await response.json();
        let options = '<option value="">Select a Worker</option>';
        workers.forEach(w => {
            options += `<option value="${w.username}">${w.name} - ${w.phone}</option>`;
        });
        
        const modalHtml = `
            <div id="assignModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; padding: 30px; border-radius: 8px; max-width: 500px; width: 90%;">
                    <h3>Assign Worker to Complaint #${complaintId}</h3>
                    <select id="workerSelect" style="width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #ddd; border-radius: 4px;">
                        ${options}
                    </select>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="confirmAssignWorker(${complaintId})" style="flex: 1; padding: 10px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">Assign</button>
                        <button onclick="document.getElementById('assignModal').remove()" style="flex: 1; padding: 10px; background: #ccc; color: #333; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading workers');
    }
}

async function confirmAssignWorker(complaintId) {
    const workerSelect = document.getElementById('workerSelect');
    const workerUsername = workerSelect.value;
    
    if (!workerUsername) {
        alert('Please select a worker');
        return;
    }
    
    try {
        const response = await fetch(`/assign/${complaintId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ worker_username: workerUsername })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`✓ ${data.message}`);
            document.getElementById('assignModal').remove();
            loadComplaints();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error assigning worker');
    }
}

async function showWorkerUpdates(complaintId) {
    try {
        const response = await fetch(`/complaint/${complaintId}/worker-updates`);
        if (!response.ok) {
            alert('Error loading updates');
            return;
        }
        
        const data = await response.json();
        
        let updatesHtml = '<div style="max-height: 400px; overflow-y: auto;">';
        if (!data.assigned_worker) {
            updatesHtml += '<p style="color: #999;">No worker assigned yet</p>';
        } else {
            updatesHtml += `<p><strong>Assigned to:</strong> ${data.assigned_worker}</p>`;
            updatesHtml += `<p><strong>Current Status:</strong> <span style="background: #27ae60; color: white; padding: 5px 10px; border-radius: 4px;">${data.current_status}</span></p>`;
            
            if (data.worker_updates.length === 0) {
                updatesHtml += '<p style="color: #999;">No updates from worker yet</p>';
            } else {
                updatesHtml += '<h4>📋 Worker Updates (Status Changes Applied Immediately):</h4>';
                data.worker_updates.forEach((update, index) => {
                    const isLatest = index === data.worker_updates.length - 1;
                    const borderColor = isLatest ? '#27ae60' : '#ddd';
                    updatesHtml += `
                        <div style="background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid ${borderColor};">
                            <small style="color: #999;">${update.timestamp}</small>
                            ${isLatest ? '<span style="background: #27ae60; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px; margin-left: 10px;">✓ APPLIED</span>' : ''}
                            <br>
                            <p style="margin: 8px 0; color: #555;">${update.update}</p>
                            <small>Status Changed To: <strong style="background: #d4edda; padding: 3px 8px; border-radius: 3px; color: #155724;">${update.status}</strong></small>
                        </div>
                    `;
                });
            }
        }
        updatesHtml += '</div>';
        
        const modalHtml = `
            <div id="updatesModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                <div style="background: white; padding: 30px; border-radius: 8px; max-width: 600px; width: 90%;">
                    <h3>Worker Updates - Complaint #${complaintId}</h3>
                    <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 12px; border-radius: 4px; margin-bottom: 15px;">
                        <strong>✓ Workers can now directly update complaint status</strong><br>
                        <small>Status changes are applied immediately and users are notified.</small>
                    </div>
                    ${updatesHtml}
                    <button onclick="document.getElementById('updatesModal').remove()" style="width: 100%; padding: 10px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 15px;">Close</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading updates');
    }
}

async function applyWorkerStatus(complaintId) {
    if (!confirm('Apply worker\'s suggested status to the complaint?')) {
        return;
    }
    
    try {
        const response = await fetch(`/apply-worker-status/${complaintId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`✓ ${data.message}`);
            document.getElementById('updatesModal').remove();
            loadComplaints();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error applying status');
    }
}

// Admin Notifications Functions
// =============================
function loadAdminNotifications() {
    const container = document.getElementById('adminNotificationsContainer');
    const countElement = document.getElementById('adminNotificationCount');
    
    if (!container) return;
    
    fetch('/notifications')
        .then(res => res.json())
        .then(notifications => {
            if (countElement) {
                const unreadCount = notifications.filter(n => !n.read).length;
                countElement.textContent = notifications.length;
                if (unreadCount > 0) {
                    countElement.style.color = '#ff6b6b';
                    countElement.style.fontWeight = 'bold';
                } else {
                    countElement.style.color = '';
                    countElement.style.fontWeight = '';
                }
            }
            
            if (notifications.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No notifications yet.</p>';
                return;
            }
            
            // Sort by created_at (newest first) and unread first
            notifications.sort((a, b) => {
                if (a.read !== b.read) return a.read ? 1 : -1;
                return new Date(b.created_at) - new Date(a.created_at);
            });
            
            let html = '';
            notifications.forEach(notif => {
                const unreadClass = notif.read ? '' : 'notification-unread';
                const isWorkerMessage = notif.title && notif.title.includes('Message from Worker');
                const complaintId = notif.complaint_id || notif.data?.thread_id;
                
                html += `
                    <div class="notification-item ${unreadClass}" style="background: ${notif.read ? '#f9f9f9' : '#fff5f5'}; padding: 15px; margin-bottom: 15px; border-left: 4px solid ${notif.read ? '#667eea' : '#ff6b6b'}; border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <p style="margin: 0 0 5px 0; font-weight: 600; color: #333;">
                                    ${isWorkerMessage ? '💬' : '🔔'} ${notif.title}
                                </p>
                                <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">${notif.message}</p>
                                <small style="color: #999;">${notif.created_at}</small>
                                ${complaintId ? `<small style="color: #667eea; display: block; margin-top: 5px;">Complaint #${complaintId}</small>` : ''}
                            </div>
                            ${!notif.read ? `
                                <span style="background: #ff6b6b; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px; white-space: nowrap; margin-left: 10px;">NEW</span>
                            ` : ''}
                        </div>
                        ${isWorkerMessage && complaintId ? `
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                                <button onclick="showReplyForm(${complaintId}, '${notif.data?.worker || ''}')" 
                                        style="background: #667eea; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 13px;">
                                    💬 Reply to Worker
                                </button>
                                <button onclick="viewMessageThread(${complaintId})" 
                                        style="background: #f0f0f0; color: #333; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 13px; margin-left: 10px;">
                                    📋 View Conversation
                                </button>
                            </div>
                        ` : ''}
                        ${!notif.read ? `
                            <button onclick="markNotificationRead(${notif.id})" 
                                    style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 10px;">
                                ✓ Mark as Read
                            </button>
                        ` : ''}
                    </div>
                `;
            });
            
            container.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading notifications:', error);
            container.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 20px;">Error loading notifications</p>';
        });
}

function markNotificationRead(notificationId) {
    fetch(`/notifications/${notificationId}/read`, {
        method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
        loadAdminNotifications();
    })
    .catch(error => {
        console.error('Error marking notification as read:', error);
    });
}

function showReplyForm(complaintId, workerUsername) {
    // Check if reply form already exists
    const existingForm = document.getElementById(`reply-form-${complaintId}`);
    if (existingForm) {
        existingForm.style.display = existingForm.style.display === 'none' ? 'block' : 'none';
        return;
    }
    
    const formHtml = `
        <div id="reply-form-${complaintId}" style="margin-top: 15px; padding: 15px; background: #f0f7ff; border: 1px solid #667eea; border-radius: 4px;">
            <strong style="color: #667eea;">Reply to Worker:</strong>
            <textarea id="reply-message-${complaintId}" 
                      placeholder="Type your reply message..." 
                      style="width: 100%; padding: 10px; border: 1px solid #667eea; border-radius: 4px; font-family: inherit; font-size: 14px; margin-top: 10px; margin-bottom: 10px; box-sizing: border-box; min-height: 80px;"></textarea>
            <div>
                <button onclick="sendAdminReply(${complaintId})" 
                        style="background: #667eea; color: white; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer; font-weight: 600; margin-right: 10px;">
                    Send Reply
                </button>
                <button onclick="document.getElementById('reply-form-${complaintId}').style.display='none'" 
                        style="background: #999; color: white; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer; font-weight: 600;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    // Find the notification item and append form
    const notificationItems = document.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
        if (item.innerHTML.includes(`Complaint #${complaintId}`)) {
            const replyButton = item.querySelector(`button[onclick*="showReplyForm(${complaintId}"]`);
            if (replyButton) {
                replyButton.insertAdjacentHTML('afterend', formHtml);
            }
        }
    });
}

function sendAdminReply(complaintId) {
    const message = document.getElementById(`reply-message-${complaintId}`).value.trim();
    
    if (!message) {
        alert('Please enter a reply message');
        return;
    }
    
    fetch(`/admin-reply/${complaintId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success || data.message === 'Reply sent to worker') {
            alert('✓ Reply sent to worker!');
            document.getElementById(`reply-form-${complaintId}`).style.display = 'none';
            document.getElementById(`reply-message-${complaintId}`).value = '';
            loadAdminNotifications();
        } else {
            alert('Error: ' + (data.message || 'Failed to send reply'));
        }
    })
    .catch(error => {
        console.error('Error sending reply:', error);
        alert('Error sending reply');
    });
}

function viewMessageThread(complaintId) {
    fetch(`/complaint/${complaintId}/messages`)
        .then(res => {
            if (res.ok) {
                return res.json();
            } else {
                return res.json().then(err => { throw new Error(err.message || 'Failed to load thread'); });
            }
        })
        .then(data => {
            showMessageThreadModal(complaintId, data.messages || []);
        })
        .catch(error => {
            console.error('Error loading thread:', error);
            alert('Error loading conversation: ' + error.message);
        });
}

function showMessageThreadModal(complaintId, messages) {
    let messagesHtml = '';
    if (messages.length === 0) {
        messagesHtml = '<p style="text-align: center; color: #999; padding: 20px;">No messages yet.</p>';
    } else {
        messages.forEach(msg => {
            const isAdmin = msg.sender_type === 'admin';
            messagesHtml += `
                <div style="margin-bottom: 15px; padding: 12px; background: ${isAdmin ? '#e3f2fd' : '#fff3cd'}; border-left: 4px solid ${isAdmin ? '#2196f3' : '#ffc107'}; border-radius: 4px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <strong style="color: #333;">${msg.sender_name} (${msg.sender_type})</strong>
                        <small style="color: #999;">${msg.created_at}</small>
                    </div>
                    <p style="margin: 0; color: #555;">${msg.message}</p>
                </div>
            `;
        });
    }
    
    const modalHtml = `
        <div id="threadModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; border-radius: 8px; padding: 25px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #667eea; padding-bottom: 15px;">
                    <h2 style="margin: 0; color: #333;">💬 Conversation - Complaint #${complaintId}</h2>
                    <button onclick="document.getElementById('threadModal').remove()" 
                            style="background: #ff6b6b; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
                <div style="margin-bottom: 20px;">
                    ${messagesHtml}
                </div>
                <div style="padding-top: 15px; border-top: 1px solid #eee;">
                    <textarea id="thread-reply-${complaintId}" 
                              placeholder="Type your reply..." 
                              style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; font-size: 14px; margin-bottom: 10px; box-sizing: border-box; min-height: 80px;"></textarea>
                    <button onclick="sendAdminReplyFromThread(${complaintId})" 
                            style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        Send Reply
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function sendAdminReplyFromThread(complaintId) {
    const message = document.getElementById(`thread-reply-${complaintId}`).value.trim();
    
    if (!message) {
        alert('Please enter a reply message');
        return;
    }
    
    fetch(`/admin-reply/${complaintId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success || data.message === 'Reply sent to worker') {
            alert('✓ Reply sent to worker!');
            document.getElementById('threadModal').remove();
            loadAdminNotifications();
        } else {
            alert('Error: ' + (data.message || 'Failed to send reply'));
        }
    })
    .catch(error => {
        console.error('Error sending reply:', error);
        alert('Error sending reply');
    });
}

// Load admin notifications on page load if on admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('adminNotificationsContainer')) {
        loadAdminNotifications();
        // Refresh notifications every 30 seconds
        setInterval(loadAdminNotifications, 30000);
    }
});