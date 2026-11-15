
// JPCS - PTC Members Management

let currentAdmin = null;
let selectedApplicationId = null;

// Get current login session
try {
    currentAdmin = JSON.parse(
        localStorage.getItem("jpcsMe")
    );
} catch (error) {
    currentAdmin = null;
}

// Only administrators can access this page
if (!JPCS.require(["main-admin", "co-admin"])) {
    window.location.replace("login.html");
} else {
    loadMembers();
}

// Read saved data
function getData(key) {
    try {
        const data = JSON.parse(
            localStorage.getItem(key) || "[]"
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

// Today's date
function todayISO() {
    const today = new Date();

    return today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");
}

// Find a registered student
function findStudent(application, users) {
    return users.find(function (user) {
        const email = String(
            user.email || ""
        ).toLowerCase();

        const applicationEmail = String(
            application.accountEmail ||
            application.email ||
            ""
        ).toLowerCase();

        const studentId = String(user.studentId || "");

        const applicationId = String(
            application.accountStudentId ||
            application.studentId ||
            application.studentNo ||
            ""
        );

        return (
            applicationEmail !== "" &&
            email === applicationEmail
        ) || (
            applicationId !== "" &&
            studentId === applicationId
        );
    });
}

// Check membership status
function getStatus(application) {
    const savedStatus = application.status || "Pending";
    const calendar = getCalendar();

    if (calendar && calendar.membershipEndDate) {
        if (todayISO() >= calendar.membershipEndDate) {
            return "Inactive";
        }
    }

    if (savedStatus === "Active") {
        return "Active";
    }

    if (savedStatus === "Pending") {
        return "Pending";
    }

    return "Inactive";
}

// Build members list
function getMembers() {
    const users = getData("jpcsUsers");
    const applications = getData("jpcsApps");

    const members = [];
    const seen = new Set();

    applications.forEach(function (application, index) {
        const student = findStudent(application, users) || {};

        const email = String(
            application.accountEmail ||
            application.email ||
            student.email ||
            ""
        ).toLowerCase();

        const studentId = String(
            application.accountStudentId ||
            application.studentId ||
            application.studentNo ||
            student.studentId ||
            ""
        );

        // Prevent duplicate student records
        const key = studentId || email || "record-" + index;

        if (seen.has(key)) {
            return;
        }

        seen.add(key);

        members.push({
            recordIndex: index,
            name:
                student.name ||
                application.fullName ||
                application.name ||
                "Unknown Student",

            studentId: studentId,
            email: email,

            course:
                student.course ||
                application.course ||
                application.program ||
                "BSIT",

            yearSection:
                student.yearSection ||
                application.yearSection ||
                "-",

            contact:
                student.contact ||
                application.contact ||
                "-",

            applicationType:
                application.applicationType || "-",

            date: application.date || "-",
            status: getStatus(application)
        });
    });

    return members;
}

// Display members table
function loadMembers() {
    const members = getMembers();

    // Update summary cards
    document.getElementById("totalMembers").textContent =
        members.length;

    document.getElementById("activeMembers").textContent =
        members.filter(function (member) {
            return member.status === "Active";
        }).length;

    document.getElementById("inactiveMembers").textContent =
        members.filter(function (member) {
            return member.status === "Inactive";
        }).length;

    document.getElementById("pendingMembers").textContent =
        members.filter(function (member) {
            return member.status === "Pending";
        }).length;

    const search = document.getElementById(
        "searchMember"
    ).value.trim().toLowerCase();

    const filter = document.getElementById(
        "statusFilter"
    ).value;

    const filtered = members.filter(function (member) {
        const matchesSearch =
            member.name.toLowerCase().includes(search) ||
            member.studentId.toLowerCase().includes(search) ||
            member.email.toLowerCase().includes(search);

        const matchesStatus =
            filter === "All" || member.status === filter;

        return matchesSearch && matchesStatus;
    });

    const table = document.getElementById("membersTable");
    table.innerHTML = "";

    if (filtered.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.textContent = "No members found.";

        row.appendChild(cell);
        table.appendChild(row);
        return;
    }

    filtered.forEach(function (member) {
        const row = document.createElement("tr");

        const values = [
            member.studentId,
            member.name,
            member.course,
            member.yearSection
        ];

        values.forEach(function (value) {
            const cell = document.createElement("td");
            cell.textContent = value || "-";
            row.appendChild(cell);
        });

        // Membership status
        const statusCell = document.createElement("td");
        const statusLabel = document.createElement("span");

        statusLabel.className =
            "status " + member.status.toLowerCase();

        statusLabel.textContent = member.status;

        statusCell.appendChild(statusLabel);
        row.appendChild(statusCell);

        // View button
        const actionCell = document.createElement("td");
        const viewButton = document.createElement("button");

        viewButton.type = "button";
        viewButton.className = "view-btn";
        viewButton.textContent = "View";

        viewButton.addEventListener("click", function () {
            viewMember(member.recordIndex);
        });

        actionCell.appendChild(viewButton);
        row.appendChild(actionCell);

        table.appendChild(row);
    });
}

// Show member information
function viewMember(recordIndex) {
    const members = getMembers();

    const member = members.find(function (item) {
        return item.recordIndex === recordIndex;
    });

    if (!member) {
        return;
    }

    selectedApplicationId = recordIndex;

    const details = {
        detailName: member.name,
        detailStudentId: member.studentId,
        detailEmail: member.email,
        detailCourse: member.course,
        detailYearSection: member.yearSection,
        detailContact: member.contact,
        detailType: member.applicationType,
        detailStatus: member.status,
        detailDate: member.date
    };

    Object.keys(details).forEach(function (id) {
        document.getElementById(id).textContent =
            details[id] || "-";
    });

    const app = getData("jpcsApps")[recordIndex];
    JPCSRecords.showDetails(
        document.getElementById("completeMemberDetails"),
        JPCSRecords.findStudent(app),
        app
    );

    document.getElementById("actionMessage").textContent = "";

    // Disable unnecessary actions
    document.getElementById("approveBtn").disabled =
        member.status === "Active";

    document.getElementById("inactiveBtn").disabled =
        member.status === "Inactive";

    document.getElementById("memberDetails").hidden = false;

    document.getElementById("memberDetails").scrollIntoView();
}

// Update membership status
function updateStatus(newStatus) {
    if (selectedApplicationId === null) {
        return;
    }

    const applications = getData("jpcsApps");
    const application = applications[selectedApplicationId];

    if (!application) {
        return;
    }

    // Prevent approval after membership expiration
    if (newStatus === "Active") {
        const calendar = getCalendar();

        if (!calendar || !calendar.membershipEndDate ||
            todayISO() >= calendar.membershipEndDate) {

            document.getElementById("actionMessage").textContent =
                "Cannot approve: no valid active membership period.";
            return;
        }

        const confirmed = confirm(
            "Have you verified this student's payment and eligibility?"
        );

        if (!confirmed) {
            return;
        }
    }

    application.status = newStatus;

    // Record admin action
    application.adminManualStatus = true;
    application.updatedAt = new Date().toISOString();

    try {
        localStorage.setItem(
            "jpcsApps",
            JSON.stringify(applications)
        );
    } catch (error) {
        document.getElementById("actionMessage").textContent =
            "Unable to save membership status.";
        return;
    }

    JPCS.log("Member status updated", application.studentId + ": " + newStatus);
    loadMembers();
    viewMember(selectedApplicationId);

    document.getElementById("actionMessage").textContent =
        "Membership status updated to " + newStatus + ".";
}

// Approve membership
document.getElementById("approveBtn").addEventListener(
    "click",
    function () {
        updateStatus("Active");
    }
);

// Mark inactive
document.getElementById("inactiveBtn").addEventListener(
    "click",
    function () {
        updateStatus("Inactive");
    }
);

// Close member details
document.getElementById("closeBtn").addEventListener(
    "click",
    function () {
        document.getElementById("memberDetails").hidden = true;
        selectedApplicationId = null;
    }
);

// Search members
document.getElementById("searchMember").addEventListener(
    "input",
    loadMembers
);

// Filter members
document.getElementById("statusFilter").addEventListener(
    "change",
    loadMembers
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

// Click a statistics card to filter the member list.
const memberStats = ["All", "Active", "Inactive", "Pending"];
document.querySelectorAll(".stat-box").forEach(function (card, index) {
    card.addEventListener("click", function () {
        document.getElementById("statusFilter").value = memberStats[index];
        document.getElementById("searchMember").value = "";
        loadMembers();
        document.getElementById("membersTable").scrollIntoView();
    });
});
