
// Membership Application - JPCS PTC

const form = document.getElementById("memberForm");
const chooser = document.getElementById("applicationChooser");
const formArea = document.getElementById("applicationArea");
const completed = document.getElementById("alreadyApplied");
const closed = document.getElementById("closedMessage");

let currentUser = null;
let currentApplication = null;

try {
    currentUser = JSON.parse(localStorage.getItem("jpcsMe"));
} catch (error) {
    currentUser = null;
}

// Read saved records
function readList(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

// Read administrator calendar
function getCalendar() {
    try {
        const calendar = JSON.parse(
            localStorage.getItem("jpcsMembershipCalendar") || "null"
        );

        if (!calendar) return null;

        return {
            applicationStartDate:
                calendar.applicationStartDate || calendar.startDate,
            applicationDeadline:
                calendar.applicationDeadline || calendar.endDate,
            membershipEndDate:
                calendar.membershipEndDate || calendar.endDate
        };
    } catch (error) {
        return null;
    }
}

// Today's local date
function todayISO() {
    const now = new Date();

    return now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0");
}

// Format date for display
function formatDate(value) {
    if (!value) return "Not Set";

    const date = new Date(value + "T00:00:00");

    if (isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

// Find application belonging to student
function findApplication() {
    const applications = readList("jpcsApps");

    return applications.find(function (app) {
        const email = String(
            app.accountEmail || app.email || ""
        ).trim().toLowerCase();

        const id = String(
            app.accountStudentId ||
            app.studentId ||
            app.studentNo ||
            ""
        ).trim();

        return email === String(currentUser.email).toLowerCase() ||
            (id !== "" && id === String(currentUser.studentId));
    });
}

// Check if application period is open
function getPeriodState(calendar) {
    if (!calendar ||
        !calendar.applicationStartDate ||
        !calendar.applicationDeadline ||
        !calendar.membershipEndDate) {
        return "not-set";
    }

    const start = calendar.applicationStartDate;
    const deadline = calendar.applicationDeadline;
    const end = calendar.membershipEndDate;

    if (deadline < start || end < start) {
        return "invalid";
    }

    const today = todayISO();

    if (today < start) return "upcoming";
    if (today > deadline) return "closed";

    return "open";
}

// Show text below input
function showError(id, message) {
    document.getElementById(id + "Error").textContent = message;
}

// Remove old errors
function clearErrors() {
    document.querySelectorAll(".error").forEach(function (element) {
        element.textContent = "";
    });
}

// Display application schedule
function loadSchedule() {
    const calendar = getCalendar();

    document.getElementById("startDate").textContent =
        formatDate(calendar && calendar.applicationStartDate);

    document.getElementById("deadlineDate").textContent =
        formatDate(calendar && calendar.applicationDeadline);

    document.getElementById("endDate").textContent =
        formatDate(calendar && calendar.membershipEndDate);

    const state = getPeriodState(calendar);
    const message = document.getElementById("scheduleMessage");

    if (state === "open") {
        message.textContent = "Membership applications are currently open.";
    } else if (state === "upcoming") {
        message.textContent = "Applications have not started yet.";
    } else if (state === "closed") {
        message.textContent = "The application period has ended.";
    } else {
        message.textContent = "The administrator has not published a valid schedule.";
    }

    return state;
}

// Show submitted application
function showCompleted(application) {
    chooser.hidden = true;
    formArea.hidden = true;
    closed.hidden = true;
    completed.hidden = false;

    currentApplication = application;

    let status = application.status || "Pending";
    const calendar = getCalendar();
    const today = todayISO();

    if (calendar && !application.adminManualStatus) {
        if (status === "Pending" &&
            today > calendar.applicationDeadline) {
            status = "Inactive";
        }

        if (today >= calendar.membershipEndDate &&
            (status === "Active" || status === "Pending")) {
            status = "Inactive";
        }
    }

    document.getElementById("completedStatus").textContent = status;
    document.getElementById("completedDate").textContent =
        application.date || "-";

    document.getElementById("completedType").textContent =
        application.applicationType || "-";
}

// Fill the form with registered information
function fillStudentDetails() {
    const name = String(currentUser.name || "").trim();
    const parts = name.split(/\s+/);

    document.getElementById("surname").value =
        currentUser.surname || parts[parts.length - 1] || "";

    document.getElementById("firstname").value =
        currentUser.givenName || parts.slice(0, -1).join(" ");

    document.getElementById("middleInitial").value =
        currentUser.middleInitial || "";

    document.getElementById("email").value =
        currentUser.email || "";

    document.getElementById("studentNo").value =
        currentUser.studentId || "";

    document.getElementById("birthDate").value =
        currentUser.birthDate || "";

    document.getElementById("signature").value =
        currentUser.name || "";

    document.getElementById("signedDate").value = todayISO();

    // Set gender
    const gender = document.querySelector(
        'input[name="gender"][value="' + currentUser.gender + '"]'
    );

    if (gender) gender.checked = true;

    // Try to identify year and section from signup
    const yearSection = String(
        currentUser.yearSection || ""
    ).trim();

    const match = yearSection.match(/(?:BSIT[-\s]*)?([1-4])\s*([A-Za-z]+)$/i);

    if (match) {
        const years = {
            "1": "1st Year",
            "2": "2nd Year",
            "3": "3rd Year",
            "4": "4th Year"
        };

        document.getElementById("yearLevel").value = years[match[1]];
        document.getElementById("section").value = match[2];
    }
}

// Initial page setup
if (!currentUser || currentUser.role !== "student") {
    window.location.replace("login.html");
} else {
    const state = loadSchedule();

    const existing = findApplication();

    if (existing) {
        showCompleted(existing);
    } else if (state === "open") {
        chooser.hidden = false;
        fillStudentDetails();
    } else {
        closed.hidden = false;

        const messages = {
            "not-set": "The administrator has not set the application schedule yet.",
            "invalid": "The administrator's application schedule is invalid.",
            "upcoming": "Membership applications have not started yet.",
            "closed": "The membership application period has ended."
        };

        document.getElementById("closedText").textContent =
            messages[state];
    }
}

// Choose New Membership or Renewal
document.querySelectorAll('input[name="applicationType"]').forEach(
    function (radio) {
        radio.addEventListener("change", function () {
            formArea.hidden = false;
            document.getElementById("typeError").textContent = "";
        });
    }
);

// Validate and submit form
form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();

    const selectedType = document.querySelector(
        'input[name="applicationType"]:checked'
    );

    if (!selectedType) {
        document.getElementById("typeError").textContent =
            "Please select an application type.";
        return;
    }

    const data = {
        applicationType: selectedType.value,
        surname: document.getElementById("surname").value.trim(),
        firstname: document.getElementById("firstname").value.trim(),
        middleInitial: document.getElementById("middleInitial").value.trim(),
        program: document.getElementById("program").value,
        yearLevel: document.getElementById("yearLevel").value,
        section: document.getElementById("section").value.trim(),
        email: document.getElementById("email").value.trim().toLowerCase(),
        studentNo: document.getElementById("studentNo").value.trim(),
        birthDate: document.getElementById("birthDate").value,
        receiptNo: document.getElementById("receiptNo").value.trim(),
        gender: document.querySelector('input[name="gender"]:checked')?.value || "",
        signature: document.getElementById("signature").value.trim(),
        signedDate: document.getElementById("signedDate").value
    };

    let valid = true;

    const requiredFields = [
        "surname", "firstname", "yearLevel", "section",
        "email", "studentNo", "birthDate",
        "gender", "signature", "signedDate"
    ];

    requiredFields.forEach(function (field) {
        if (!data[field]) {
            showError(field, "This field is required.");
            valid = false;
        }
    });

    if (data.middleInitial &&
        !/^(?:[A-Za-z]{1,2}\.?|N\/?A)$/i.test(data.middleInitial)) {
        showError("middleInitial", "Enter a valid middle initial.");
        valid = false;
    }

    if (data.birthDate && data.birthDate > todayISO()) {
        showError("birthDate", "Enter a valid birth date.");
        valid = false;
    }

    if (data.signedDate && data.signedDate > todayISO()) {
        showError("signedDate", "Date cannot be in the future.");
        valid = false;
    }

    const emailPattern =
        /^[^\s@]+@paterostechnologicalcollege\.edu\.ph$/i;

    if (!emailPattern.test(data.email) ||
        data.email !== String(currentUser.email).toLowerCase()) {
        showError("email", "Email must match your registered PTC account.");
        valid = false;
    }

    if (data.studentNo !== String(currentUser.studentId)) {
        showError("studentNo", "Student ID must match your account.");
        valid = false;
    }

    if (!valid) return;

    // Recheck schedule before saving
    const calendar = getCalendar();

    if (getPeriodState(calendar) !== "open") {
        closed.hidden = false;
        chooser.hidden = true;
        formArea.hidden = true;
        document.getElementById("closedText").textContent =
            "The membership application period is not open.";
        return;
    }

    // Prevent duplicate applications
    const applications = readList("jpcsApps");

    if (findApplication()) {
        showCompleted(findApplication());
        return;
    }

    const duplicate = applications.some(function (app) {
        return String(app.email || "").toLowerCase() === data.email ||
            String(app.studentId || app.studentNo || "") === data.studentNo;
    });

    if (duplicate) {
        showError("studentNo", "An application already exists for this account.");
        return;
    }

    const fullName = [
        data.firstname,
        data.middleInitial,
        data.surname
    ].filter(Boolean).join(" ");

    const application = {
        id: "JPCS-" + Date.now(),
        fullName: fullName,
        studentId: data.studentNo,
        email: data.email,
        accountEmail: currentUser.email,
        accountStudentId: currentUser.studentId,
        course: data.program,
        yearSection: data.yearLevel + " " + data.section,
        contact: currentUser.contact || "",
        classification: currentUser.classification || "",
        birthDate: data.birthDate,
        gender: data.gender,
        receiptNo: data.receiptNo,
        signature: data.signature,
        signedDate: data.signedDate,
        applicationType: data.applicationType,
        membershipCycleStart: calendar.applicationStartDate,
        applicationDeadline: calendar.applicationDeadline,
        membershipCycleEnd: calendar.membershipEndDate,
        status: "Pending",
        date: new Date().toLocaleDateString("en-PH"),
        formData: data
    };

    try {
        applications.push(application);

        localStorage.setItem(
            "jpcsApps",
            JSON.stringify(applications)
        );
    } catch (error) {
        showError("studentNo", "Unable to save. Please try again.");
        return;
    }

    showCompleted(application);
});

// Escape text before placing it in a printable HTML page
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return characters[char];
    });
}

// Create a simple printable membership form
function openForm(printNow) {
    if (!currentApplication) return;

    const data = currentApplication.formData || {};
    const popup = window.open("", "_blank");

    if (!popup) {
        document.getElementById("completedStatus").textContent =
            "Please allow pop-ups to view your form.";
        return;
    }

    const fields = [
        ["Application Type", currentApplication.applicationType],
        ["Surname", data.surname],
        ["Firstname", data.firstname],
        ["Middle Initial", data.middleInitial],
        ["Program", data.program],
        ["Year Level", data.yearLevel],
        ["Section", data.section],
        ["Institutional Email", data.email],
        ["Student Number", data.studentNo],
        ["Date of Birth", data.birthDate],
        ["Gender", data.gender],
        ["Receipt Number", data.receiptNo],
        ["Applicant Signature", data.signature],
        ["Date Signed", data.signedDate]
    ];

    let rows = "";

    fields.forEach(function (field) {
        const label = escapeHTML(field[0]);
        const value = escapeHTML(
            String(field[1] || "-").toUpperCase()
        );

        rows += "<tr><th>" + label + "</th><td>" +
            value + "</td></tr>";
    });

    const documentHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>JPCS Membership Application</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 30px auto;
            padding: 20px;
            color: #222;
        }

        h1, h2, p {
            text-align: center;
        }

        h1 {
            color: #064e35;
            font-size: 24px;
        }

        h2 {
            font-size: 18px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
        }

        th, td {
            border: 1px solid #999;
            padding: 12px;
            text-align: left;
            font-size: 13px;
        }

        th {
            width: 35%;
            background-color: #eee;
        }

        .print-btn {
            padding: 12px 20px;
            background-color: #064e35;
            color: white;
            border: none;
            cursor: pointer;
        }

        @media print {
            .print-btn {
                display: none;
            }
        }
    </style>
</head>
<body>
    <h1>JPCS - PTC</h1>
    <h2>Application for Individual Membership</h2>
    <p>Membership Form 1 - 2026</p>

    <table>${rows}</table>

    <p>
        I hereby voluntarily bind myself to comply
        with the JPCS By-Laws, Code of Ethics,
        and regulations adopted by the Society.
    </p>

    <button class="print-btn" onclick="window.print()">
        Print / Save as PDF
    </button>
</body>
</html>`;

    popup.document.open();
    popup.document.write(documentHTML);
    popup.document.close();

    if (printNow) {
        popup.addEventListener("load", function () {
            popup.print();
        });
    }
}

// View, Print, and Save as PDF
document.getElementById("viewBtn").addEventListener("click", function () {
    openForm(false);
});

document.getElementById("printBtn").addEventListener("click", function () {
    openForm(true);
});

document.getElementById("pdfBtn").addEventListener("click", function () {
    openForm(true);
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem("jpcsMe");
    window.location.replace("login.html");
});
