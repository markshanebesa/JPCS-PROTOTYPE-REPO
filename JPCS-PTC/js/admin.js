
// JPCS - PTC Admin Panel

let admin = null;
let selectedApplication = null;
let currentRecordType = "students";

try {
    admin = JSON.parse(localStorage.getItem("jpcsMe"));
} catch (error) {
    admin = null;
}

// Check admin access
if (!JPCS.require(["main-admin"])) {
    window.location.replace("login.html");
} else {
    loadAll();
}

// Read stored arrays
function readList(key) {
    try {
        const data = JSON.parse(
            localStorage.getItem(key) || "[]"
        );

        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

// Save stored arrays
function saveList(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        return false;
    }
}

// Get local date
function todayISO() {
    const date = new Date();

    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0");
}

// Get membership calendar
function getCalendar() {
    try {
        return JSON.parse(
            localStorage.getItem("jpcsMembershipCalendar")
        );
    } catch (error) {
        return null;
    }
}

// Get application status
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

// Get student name
function getName(app) {
    const form = app.formData || {};

    return app.fullName ||
        app.name ||
        [
            form.firstname,
            form.middleInitial,
            form.surname
        ].filter(Boolean).join(" ") ||
        "Unknown Student";
}

// Get student ID
function getStudentId(app) {
    return String(
        app.accountStudentId ||
        app.studentId ||
        app.studentNo ||
        ""
    );
}

// Get student email
function getEmail(app) {
    return String(
        app.accountEmail ||
        app.email ||
        ""
    );
}

// Add a table cell safely
function addCell(row, value) {
    const cell = document.createElement("td");

    cell.textContent = String(value ?? "-");

    row.appendChild(cell);
    return cell;
}

// Add table header
function addHeader(row, text) {
    const th = document.createElement("th");
    th.textContent = text;
    row.appendChild(th);
}

// Display an empty table message
function showEmpty(table, columns, message) {
    const row = document.createElement("tr");
    const cell = addCell(row, message);
    cell.colSpan = columns;
    cell.style.textAlign = "center";
    table.appendChild(row);
}

// Load admin data
function loadAll() {
    loadStatistics();
    loadCalendar();
    loadApplications();
    loadAccounts();
    loadAnnouncements();

    if (!document.getElementById("recordsSection").hidden) {
        showRecords(currentRecordType, false);
    }
}

// ======================================
// STATISTICS
// ======================================

function loadStatistics() {
    const users = readList("jpcsUsers");
    const applications = readList("jpcsApps");

    const students = users.filter(function (user) {
        return user.role === "student";
    });

    let pending = 0;
    let active = 0;
    let inactive = 0;

    applications.forEach(function (app) {
        const status = getStatus(app);

        if (status === "Pending") pending++;
        if (status === "Active") active++;
        if (status === "Inactive") inactive++;
    });

    document.getElementById("totalStudents").textContent =
        students.length;

    document.getElementById("totalApplications").textContent =
        applications.length;

    document.getElementById("pendingCount").textContent =
        pending;

    document.getElementById("activeCount").textContent =
        active;

    document.getElementById("inactiveCount").textContent =
        inactive;
}

// ======================================
// CLICKABLE STATISTICS
// ======================================

function showRecords(type, scroll = true) {
    currentRecordType = type;

    JPCSRecords.showList(
        type,
        document.getElementById("recordsSection"),
        document.getElementById("recordsTitle"),
        document.getElementById("statRecordsTable"),
        document.getElementById("statRecordDetail"),
        document.getElementById("recordsSearch").value
    );

    if (scroll) {
        document.getElementById("recordsSection").scrollIntoView();
    }
}

// Statistics card clicks
document.querySelectorAll(".stat-box").forEach(function (card) {
    card.addEventListener("click", function () {
        document.getElementById("recordsSearch").value = "";
        showRecords(card.dataset.records);
    });
});

// Search displayed records
document.getElementById("recordsSearch").addEventListener(
    "input",
    function () {
        showRecords(currentRecordType, false);
    }
);

// Close records
document.getElementById("closeRecordsBtn").addEventListener(
    "click",
    function () {
        document.getElementById("recordsSection").hidden = true;
    }
);

// ======================================
// MEMBERSHIP SCHEDULE
// ======================================

function loadCalendar() {
    const calendar = getCalendar();

    if (!calendar) return;

    document.getElementById("applicationStart").value =
        calendar.applicationStartDate || "";

    document.getElementById("applicationDeadline").value =
        calendar.applicationDeadline || "";

    document.getElementById("membershipEnd").value =
        calendar.membershipEndDate || "";
}

document.getElementById("calendarForm").addEventListener(
    "submit",
    function (event) {
        event.preventDefault();

        const start = document.getElementById(
            "applicationStart"
        ).value;

        const deadline = document.getElementById(
            "applicationDeadline"
        ).value;

        const end = document.getElementById(
            "membershipEnd"
        ).value;

        const message = document.getElementById(
            "calendarMessage"
        );

        if (deadline < start) {
            message.textContent =
                "Deadline cannot be before the start date.";
            return;
        }

        if (end < deadline) {
            message.textContent =
                "Membership end date cannot be before the deadline.";
            return;
        }

        const calendar = {
            applicationStartDate: start,
            applicationDeadline: deadline,
            membershipEndDate: end
        };

        try {
            localStorage.setItem(
                "jpcsMembershipCalendar",
                JSON.stringify(calendar)
            );

            JPCS.log("Membership schedule updated", start + " to " + end);
            message.textContent =
                "Membership schedule saved successfully.";

            loadStatistics();
            loadApplications();

            if (!document.getElementById("recordsSection").hidden) {
                showRecords(currentRecordType, false);
            }
        } catch (error) {
            message.textContent =
                "Unable to save membership schedule.";
        }
    }
);

// ======================================
// STUDENT APPLICATIONS
// ======================================

function loadApplications() {
    const applications = readList("jpcsApps");

    const search = document.getElementById(
        "applicationSearch"
    ).value.trim().toLowerCase();

    const filter = document.getElementById(
        "applicationFilter"
    ).value;

    const table = document.getElementById(
        "applicationsTable"
    );

    table.innerHTML = "";

    let count = 0;

    applications.forEach(function (app, index) {
        const name = getName(app);
        const studentId = getStudentId(app);
        const email = getEmail(app);
        const status = getStatus(app);

        const matchesSearch = [
            name,
            studentId,
            email
        ].join(" ").toLowerCase().includes(search);

        const matchesFilter =
            filter === "All" || filter === status;

        if (!matchesSearch || !matchesFilter) return;

        count++;

        const row = document.createElement("tr");

        addCell(row, name);
        addCell(row, studentId);
        addCell(row, app.applicationType || "New Membership");
        addCell(row, app.date || "-");
        addCell(row, status);

        const cell = document.createElement("td");
        const button = document.createElement("button");

        button.type = "button";
        button.className = "main-btn small-btn";
        button.textContent = "View";

        button.addEventListener("click", function () {
            viewApplication(index);
        });

        cell.appendChild(button);
        row.appendChild(cell);
        table.appendChild(row);
    });

    if (count === 0) {
        showEmpty(table, 6, "No applications found.");
    }
}

function viewApplication(index) {
    const applications = readList("jpcsApps");
    const app = applications[index];

    if (!app) return;

    selectedApplication = index;

    const form = app.formData || {};

    const details = {
        detailName: getName(app),
        detailId: getStudentId(app),
        detailEmail: getEmail(app),
        detailCourse:
            (app.course || form.program || "BSIT") +
            " - " +
            (app.yearSection || "-"),
        detailType: app.applicationType || "-",
        detailReceipt: app.receiptNo || form.receiptNo || "-",
        detailStatus: getStatus(app)
    };

    Object.keys(details).forEach(function (id) {
        document.getElementById(id).textContent = details[id];
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

    document.getElementById("applicationMessage").textContent = "";

    const section = document.getElementById(
        "applicationDetails"
    );

    section.hidden = false;
    section.scrollIntoView({ behavior: "auto" });
}

function updateStatus(newStatus) {
    if (selectedApplication === null) return;

    const applications = readList("jpcsApps");
    const app = applications[selectedApplication];

    if (!app) return;

    const message = document.getElementById(
        "applicationMessage"
    );

    if (newStatus === "Active") {
        const calendar = getCalendar();

        if (!calendar ||
            !calendar.membershipEndDate ||
            todayISO() >= calendar.membershipEndDate) {
            message.textContent =
                "Set a valid future membership end date first.";
            return;
        }

        if (!confirm(
            "Have you verified the student's payment and eligibility?"
        )) {
            return;
        }
    }

    app.status = newStatus;
    app.adminManualStatus = true;
    app.updatedAt = new Date().toISOString();

    if (!saveList("jpcsApps", applications)) {
        message.textContent = "Unable to save membership status.";
        return;
    }

    JPCS.log("Membership status changed", getStudentId(app) + ": " + newStatus);
    loadStatistics();
    loadApplications();
    viewApplication(selectedApplication);

    if (!document.getElementById("recordsSection").hidden) {
        showRecords(currentRecordType, false);
    }

    message.textContent =
        "Membership status updated to " + newStatus + ".";
}

document.getElementById("approveBtn").addEventListener(
    "click",
    function () {
        updateStatus("Active");
    }
);

document.getElementById("inactiveBtn").addEventListener(
    "click",
    function () {
        updateStatus("Inactive");
    }
);

document.getElementById("closeDetailsBtn").addEventListener(
    "click",
    function () {
        document.getElementById("applicationDetails").hidden = true;
        selectedApplication = null;
    }
);

document.getElementById("applicationSearch").addEventListener(
    "input",
    loadApplications
);

document.getElementById("applicationFilter").addEventListener(
    "change",
    loadApplications
);

// ======================================
// REGISTERED STUDENT ACCOUNTS
// ======================================

function loadAccounts() {
    const users = readList("jpcsUsers");

    const search = document.getElementById(
        "accountSearch"
    ).value.trim().toLowerCase();

    const table = document.getElementById(
        "accountsTable"
    );

    table.innerHTML = "";

    let count = 0;

    users.forEach(function (user) {
        if (user.role !== "student") return;

        const information = [
            user.studentId,
            user.name,
            user.email,
            user.course,
            user.yearSection
        ].join(" ").toLowerCase();

        if (!information.includes(search)) return;

        count++;

        const row = document.createElement("tr");

        addCell(row, user.studentId);
        addCell(row, user.name);
        addCell(row, user.email);
        addCell(row, user.course);
        addCell(row, user.yearSection);

        const actionCell = document.createElement("td");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "record-view-btn";
        button.textContent = "View Details";
        button.addEventListener("click", function () {
            JPCSRecords.showDetails(
                document.getElementById("adminStudentDetails"),
                user,
                JPCSRecords.findApplication(user)
            );
            document.getElementById("adminStudentDetails")
                .scrollIntoView();
        });
        actionCell.appendChild(button);
        row.appendChild(actionCell);
        table.appendChild(row);
    });

    if (count === 0) {
        showEmpty(table, 6, "No registered students found.");
    }
}

document.getElementById("accountSearch").addEventListener(
    "input",
    loadAccounts
);

// ======================================
// ANNOUNCEMENTS
// ======================================

function loadAnnouncements() {
    const announcements = readList("jpcsAnnouncements");

    const container = document.getElementById(
        "adminAnnouncementList"
    );

    container.innerHTML = "";

    if (announcements.length === 0) {
        const text = document.createElement("p");
        text.textContent = "No announcements posted yet.";
        container.appendChild(text);
        return;
    }

    announcements.forEach(function (announcement, index) {
        const box = document.createElement("div");
        box.className = "announcement-item";

        const title = document.createElement("h4");
        title.textContent = announcement.title || "Announcement";

        const date = document.createElement("small");
        date.textContent = announcement.date || "";

        const content = document.createElement("p");
        content.textContent = announcement.content || "";

        box.appendChild(title);
        box.appendChild(date);
        box.appendChild(content);

        if (announcement.image) {
            const image = document.createElement("img");
            image.src = announcement.image;
            image.alt = "Announcement image";
            box.appendChild(image);
        }

        const button = document.createElement("button");
        button.type = "button";
        button.className = "danger-btn small-btn";
        button.textContent = "Delete";

        button.addEventListener("click", function () {
            if (!confirm("Delete this announcement?")) return;

            const updated = readList("jpcsAnnouncements");
            updated.splice(index, 1);

            if (saveList("jpcsAnnouncements", updated)) {
                loadAnnouncements();
            }
        });

        box.appendChild(button);
        container.appendChild(box);
    });
}

document.getElementById("announcementForm").addEventListener(
    "submit",
    function (event) {
        event.preventDefault();

        const title = document.getElementById(
            "announcementTitle"
        ).value.trim();

        const content = document.getElementById(
            "announcementContent"
        ).value.trim();

        const file = document.getElementById(
            "announcementImage"
        ).files[0];

        const message = document.getElementById(
            "announcementMessage"
        );

        if (!title || !content) {
            message.textContent =
                "Please complete the title and content.";
            return;
        }

        function saveAnnouncement(imageData) {
            const announcements = readList("jpcsAnnouncements");

            announcements.push({
                id: "ANN-" + Date.now(),
                title: title,
                content: content,
                date: todayISO(),
                image: imageData || ""
            });

            if (!saveList("jpcsAnnouncements", announcements)) {
                message.textContent =
                    "Unable to save announcement. Try a smaller image.";
                return;
            }

            document.getElementById("announcementForm").reset();

            message.textContent =
                "Announcement posted successfully.";

            JPCS.log("Announcement published", title);
            loadAnnouncements();
        }

        if (file) {
            if (!["image/png", "image/jpeg", "image/webp"]
                .includes(file.type)) {
                message.textContent =
                    "Only JPG, PNG, or WebP images are allowed.";
                return;
            }

            if (file.size > 1024 * 1024) {
                message.textContent =
                    "Image must be smaller than 1 MB.";
                return;
            }

            const reader = new FileReader();

            reader.onload = function () {
                saveAnnouncement(reader.result);
            };

            reader.onerror = function () {
                message.textContent = "Unable to read image.";
            };

            reader.readAsDataURL(file);
        } else {
            saveAnnouncement("");
        }
    }
);

// ======================================
// REFRESH
// ======================================

window.addEventListener("pageshow", function () {
    if (JPCS.staff() && JPCS.staff().role === "main-admin") {
        loadAll();
    }
});

window.addEventListener("storage", function () {
    if (JPCS.staff() && JPCS.staff().role === "main-admin") {
        loadAll();
    }
});

// ======================================
// LOGOUT
// ======================================

document.getElementById("logoutBtn").addEventListener(
    "click",
    function () {
        localStorage.removeItem("jpcsMe");
        window.location.replace("login.html");
    }
);
