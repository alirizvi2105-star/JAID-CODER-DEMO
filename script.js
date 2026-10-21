const form = document.getElementById("requestForm");
const requestList = document.getElementById("requestList");
const message = document.getElementById("message");

let requests = [];

try {
    const saved = JSON.parse(
        localStorage.getItem("hospitalRequests") || "[]"
    );

    if (Array.isArray(saved)) {
        requests = saved.filter(item =>
            item &&
            Number.isFinite(item.id) &&
            typeof item.room === "string" &&
            typeof item.age === "number" &&
            typeof item.supplies === "string" &&
            typeof item.priority === "string" &&
            typeof item.notes === "string" &&
            ["Pending", "In Progress", "Delivered"].includes(item.status)
        );
    }
} catch (error) {
    requests = [];
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function saveRequests() {
    try {
        localStorage.setItem(
            "hospitalRequests",
            JSON.stringify(requests)
        );
        return true;
    } catch (error) {
        message.textContent =
            "Storage unavailable. Changes may not be saved.";
        message.className = "error-message";
        return false;
    }
}

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const room = document.getElementById("room").value.trim();
    const age = Number(document.getElementById("age").value);
    const supplies = document.getElementById("supplies").value.trim();
    const priority = document.getElementById("priority").value;
    const notes = document.getElementById("notes").value.trim();

    if (!room || !supplies || !Number.isInteger(age) ||
        age < 0 || age > 120) {
        message.textContent = "Please enter valid request details.";
        message.className = "error-message";
        return;
    }

    const request = {
        id: Date.now(),
        room,
        age,
        supplies,
        priority,
        notes,
        status: "Pending"
    };

    requests.unshift(request);

    if (!saveRequests()) {
        requests.shift();
        renderRequests();
        return;
    }

    form.reset();
    message.textContent = "Request submitted successfully!";
    message.className = "success-message";

    renderRequests();

    document.getElementById("requests").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

function renderRequests() {
    document.getElementById("totalRequests").textContent =
        requests.length + (requests.length === 1 ? " Request" : " Requests");

    document.getElementById("totalCount").textContent =
        requests.length;

    document.getElementById("pendingCount").textContent =
        requests.filter(r => r.status === "Pending").length;

    document.getElementById("deliveredCount").textContent =
        requests.filter(r => r.status === "Delivered").length;

    if (requests.length === 0) {
        requestList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">📋</div>
                <h3>No requests yet</h3>
                <p>Submit your first request using the form.</p>
            </div>
        `;
        return;
    }

    requestList.innerHTML = requests.map(request => {
        const statusClass = request.status.replace(/\s+/g, "-");

        return `
            <article class="request-item">
                <div class="request-top">
                    <div>
                        <h3>Room ${escapeHTML(request.room)}</h3>
                        <p>Patient Age: ${request.age}</p>
                        <p>Supplies: ${escapeHTML(request.supplies)}</p>
                        ${request.notes
                            ? <p>Notes: ${escapeHTML(request.notes)}</p>
                            : ""}
                    </div>
                    <span class="priority ${escapeHTML(request.priority)}">
                        ${escapeHTML(request.priority)}
                    </span>
                </div>

                <div class="status-row">
                    <span class="status-label ${statusClass}">
                        ${escapeHTML(request.status)}
                    </span>

                    <select
                        aria-label="Update status for room ${escapeHTML(request.room)}"
                        onchange="updateStatus(${request.id}, this.value)">
                        <option value="Pending"
                            ${request.status === "Pending" ? "selected" : ""}>
                            Pending
                        </option>
                        <option value="In Progress"
                            ${request.status === "In Progress" ? "selected" : ""}>
                            In Progress
                        </option>
                        <option value="Delivered"
                            ${request.status === "Delivered" ? "selected" : ""}>
                            Delivered
                        </option>
                    </select>

                    <button class="delete-btn"
                        onclick="deleteRequest(${request.id})">
                        Delete
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

function updateStatus(id, newStatus) {
    const allowedStatuses = ["Pending", "In Progress", "Delivered"];

    if (!allowedStatuses.includes(newStatus)) return;

    const request = requests.find(r => r.id === id);
    if (!request) return;

    const oldStatus = request.status;
    request.status = newStatus;

    if (!saveRequests()) {
        request.status = oldStatus;
    }

    renderRequests();
}

function deleteRequest(id) {
    const previous = requests;
    requests = requests.filter(r => r.id !== id);

    if (!saveRequests()) {
        requests = previous;
        renderRequests();
        return;
    }

    renderRequests();
}

renderRequests();