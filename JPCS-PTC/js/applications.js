
// JPCS - PTC Application Management

let admin = null;
let selectedId = null;

try {
    admin = JSON.parse(localStorage.getItem("jpcsMe"));
} catch (error) {
    admin = null;
}

// Admin access only
if (!JPCS.require(["main-admin", "co-admin"])) {
    window.location.replace("login.html");
} else {
    loadApplications();
    loadSchedule();
}

// Read saved applications
function getApplications() {
    try {
        const data = JSON.parse(
            localStorage.getItem("jpcsApps") || "[]"
        );

        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

// Read membership calendar
function getCalendar() {
    try {
        return JSON.parse(
            localStorage.getItem("jpcsMembershipCalendar")
        );
    } catch (error) {
        return null;
    }
}

// Today's local date
function todayISO() {
    const date = new Date();

    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0");
}

// Get student information
function getName(app) {
    return app.fullName ||
        app.name ||
        [
            app.formData?.firstname,
            app.formData?.middleInitial,
            app.formData?.surname
        ].filter(Boolean).join(" ") ||
        "Unknown Student";
}

function getStudentId(app) {
    return String(
        app.accountStudentId ||
        app.studentId ||
        app.studentNo ||
        ""
    );
}

function getEmail(app) {
    return String(
        app.accountEmail || app.email || ""
    );
}

// Calculate effective status
function getStatus(app) {
    const calendar = getCalendar();

    if (calendar && calendar.membershipEndDate &&
        todayISO() >= calendar.membershipEndDate) {
        return "Inactive";
    }

    if (app.status === "Active") return "Active";
    if (app.status === "Inactive") return "Inactive";

    return "Pending";
}

// Create table cell
function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = String(value || "-");
    row.appendChild(cell);
    return cell;
}

// Display application records
function loadApplications() {
    const applications = getApplications();

    const search = document.getElementById(
        "searchInput"
    ).value.trim().toLowerCase();

    const filter = document.getElementById(
        "statusFilter"
    ).value;

    const table = document.getElementById(
        "applicationsTable"
    );

    table.innerHTML = "";

    // Update statistics
    document.getElementById("totalCount").textContent =
        applications.length;

    document.getElementById("pendingCount").textContent =
        applications.filter(app => getStatus(app) === "Pending").length;

    document.getElementById("activeCount").textContent =
        applications.filter(app => getStatus(app) === "Active").length;

    document.getElementById("inactiveCount").textContent =
        applications.filter(app => getStatus(app) === "Inactive").length;

    let count = 0;

    applications.forEach(function (app, index) {
        const name = getName(app);
        const id = getStudentId(app);
        const email = getEmail(app);
        const status = getStatus(app);

        const matchesSearch =
            name.toLowerCase().includes(search) ||
            id.toLowerCase().includes(search) ||
            email.toLowerCase().includes(search);

        const matchesFilter =
            filter === "All" || filter === status;

        if (!matchesSearch || !matchesFilter) return;

        count++;

        const row = document.createElement("tr");

        addCell(row, id);
        addCell(row, name);
        addCell(row, app.applicationType || "New Membership");
        addCell(row, app.date || "-");
        addCell(row, status);

        const actionCell = document.createElement("td");
        const viewBtn = document.createElement("button");

        viewBtn.type = "button";
        viewBtn.className = "main-btn small-btn";
        viewBtn.textContent = "View";

        viewBtn.addEventListener("click", function () {
            viewApplication(index);
        });

        actionCell.appendChild(viewBtn);
        row.appendChild(actionCell);
        table.appendChild(row);
    });

    if (count === 0) {
        const row = document.createElement("tr");
        const cell = addCell(row, "No applications found.");
        cell.colSpan = 6;
        table.appendChild(row);
    }
}

// Show selected application
function viewApplication(index) {
    const applications = getApplications();
    const app = applications[index];

    if (!app) return;

    selectedId = index;

    const details = {
        detailName: getName(app),
        detailId: getStudentId(app),
        detailEmail: getEmail(app),
        detailCourse: app.course || app.formData?.program || "BSIT",
        detailYear: app.yearSection ||
            [
                app.formData?.yearLevel,
                app.formData?.section
            ].filter(Boolean).join(" "),
        detailType: app.applicationType,
        detailGender: app.gender || app.formData?.gender,
        detailDate: app.date,
        detailReceipt: app.receiptNo || app.formData?.receiptNo,
        detailStatus: getStatus(app)
    };

    Object.keys(details).forEach(function (id) {
        document.getElementById(id).textContent =
            details[id] || "-";
    });

    JPCSRecords.showDetails(
        document.getElementById("completeApplicationDetails"),
        JPCSRecords.findStudent(app),
        app
    );

    document.getElementById("approveBtn").disabled =
        getStatus(app) === "Active";

    document.getElementById("inactiveBtn").disabled =
        getStatus(app) === "Inactive";

    document.getElementById("actionMessage").textContent = "";

    const section = document.getElementById("detailsSection");
    section.hidden = false;
    section.scrollIntoView();
}

// Update application status
function updateStatus(newStatus) {
    if (selectedId === null) return;

    const applications = getApplications();
    const app = applications[selectedId];

    if (!app) return;

    const message = document.getElementById("actionMessage");

    if (newStatus === "Active") {
        const calendar = getCalendar();

        if (!calendar ||
            !calendar.membershipEndDate ||
            todayISO() >= calendar.membershipEndDate) {

            message.textContent =
                "Cannot approve. Set a valid membership end date.";
            return;
        }

        const confirmed = confirm(
            "Have you verified this student's payment and eligibility?"
        );

        if (!confirmed) return;
    }

    app.status = newStatus;
    app.adminManualStatus = true;
    app.updatedAt = new Date().toISOString();

    try {
        localStorage.setItem(
            "jpcsApps",
            JSON.stringify(applications)
        );

        JPCS.log("Application reviewed", getStudentId(app) + ": " + newStatus);
        loadApplications();
        viewApplication(selectedId);

        message.textContent =
            "Application status updated to " + newStatus + ".";
    } catch (error) {
        message.textContent =
            "Unable to save the application status.";
    }
}

// Approve button
document.getElementById("approveBtn").addEventListener(
    "click",
    function () {
        updateStatus("Active");
    }
);

// Mark inactive button
document.getElementById("inactiveBtn").addEventListener(
    "click",
    function () {
        updateStatus("Inactive");
    }
);

// Close details
document.getElementById("closeBtn").addEventListener(
    "click",
    function () {
        document.getElementById("detailsSection").hidden = true;
        selectedId = null;
    }
);

// Search
document.getElementById("searchInput").addEventListener(
    "input",
    loadApplications
);

// Filter
document.getElementById("statusFilter").addEventListener(
    "change",
    loadApplications
);

// Display membership schedule
function loadSchedule() {
    const calendar = getCalendar();

    document.getElementById("deadlineDisplay").textContent =
        calendar?.applicationDeadline || "Not Set";

    document.getElementById("endDisplay").textContent =
        calendar?.membershipEndDate || "Not Set";
}

// Check duplicate applications
document.getElementById("checkDuplicatesBtn").addEventListener(
    "click",
    function () {
        const applications = getApplications();
        const results = document.getElementById("duplicateResults");

        results.innerHTML = "";

        const ids = {};
        const emails = {};
        const duplicates = [];

        applications.forEach(function (app) {
            const id = getStudentId(app).trim().toLowerCase();
            const email = getEmail(app).trim().toLowerCase();

            if (id) {
                ids[id] = (ids[id] || 0) + 1;
            }

            if (email) {
                emails[email] = (emails[email] || 0) + 1;
            }
        });

        Object.keys(ids).forEach(function (id) {
            if (ids[id] > 1) {
                duplicates.push(
                    "Student ID " + id + " appears " +
                    ids[id] + " times."
                );
            }
        });

        Object.keys(emails).forEach(function (email) {
            if (emails[email] > 1) {
                duplicates.push(
                    "Email " + email + " appears " +
                    emails[email] + " times."
                );
            }
        });

        if (duplicates.length === 0) {
            const p = document.createElement("p");
            p.textContent = "No duplicate applications found.";
            results.appendChild(p);
            return;
        }

        duplicates.forEach(function (text) {
            const box = document.createElement("div");
            box.className = "duplicate-item";
            box.textContent = text;
            results.appendChild(box);
        });
    }
);

// Logout
document.getElementById("logoutBtn").addEventListener(
    "click",
    function () {
        localStorage.removeItem("jpcsMe");
        window.location.replace("login.html");
    }
);


// Co-admin returns to their own dashboard, not Main Admin.
if (JPCS.staff() && JPCS.staff().role === "co-admin") {
    document.querySelectorAll('a[href="admin.html"]').forEach(function (link) {
        link.href = "co-admin.html";
        link.textContent = "Co-Admin Panel";
    });
}

// Click the statistics to display matching applications.
const applicationStats = ["All", "Pending", "Active", "Inactive"];
document.querySelectorAll(".stat-box").forEach(function (card, index) {
    card.addEventListener("click", function () {
        document.getElementById("statusFilter").value =
            applicationStats[index];
        document.getElementById("searchInput").value = "";
        loadApplications();
        document.getElementById("applicationsTable").scrollIntoView();
    });
});
