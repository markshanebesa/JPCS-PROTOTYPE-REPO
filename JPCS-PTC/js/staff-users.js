// Main Admin: manage staff accounts, student login status and logs.
const canManageAccounts = JPCS.require(["main-admin"]);
let editingStaffEmail = null;

function appendCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value || "-";
    row.appendChild(cell);
    return cell;
}

function staffList() {
    const table = document.getElementById("staffTable");
    table.innerHTML = "";

    JPCS.list("jpcsStaffUsers").forEach(function (user) {
        const row = document.createElement("tr");
        appendCell(row, user.name);
        appendCell(row, user.email);
        appendCell(row, user.role);
        appendCell(row, user.active === false ? "Inactive" : "Active");

        const cell = document.createElement("td");
        const button = document.createElement("button");
        button.textContent = "Edit";
        button.type = "button";
        button.addEventListener("click", function () {
            editingStaffEmail = user.email;
            document.getElementById("staffName").value = user.name;
            document.getElementById("staffEmail").value = user.email;
            document.getElementById("staffEmail").readOnly = true;
            document.getElementById("staffRole").value = user.role;
            document.getElementById("staffActive").checked =
                user.active !== false;
            document.getElementById("staffPassword").value = "";
            document.getElementById("staffMessage").textContent =
                "Editing " + user.email + ". Leave password blank to keep it.";
            window.scrollTo(0, 0);
        });
        cell.appendChild(button);
        row.appendChild(cell);
        table.appendChild(row);
    });
}

function clearStaffForm() {
    editingStaffEmail = null;
    document.getElementById("staffForm").reset();
    document.getElementById("staffEmail").readOnly = false;
    document.getElementById("staffMessage").textContent = "";
}

document.getElementById("clearStaff").addEventListener(
    "click", clearStaffForm
);

document.getElementById("staffForm").addEventListener(
    "submit", function (event) {
        event.preventDefault();
        const name = document.getElementById("staffName").value.trim();
        const email = document.getElementById("staffEmail")
            .value.trim().toLowerCase();
        const role = document.getElementById("staffRole").value;
        const password = document.getElementById("staffPassword").value;
        const active = document.getElementById("staffActive").checked;
        const message = document.getElementById("staffMessage");
        const allowed = [
            "moderator", "co-admin", "main-admin", "organization-head"
        ];
        const session = JPCS.session();

        if (!name || !email || !allowed.includes(role)) return;

        if (email === session.email &&
            (!active || role !== "main-admin")) {
            message.textContent = "You cannot disable or demote yourself.";
            return;
        }

        const users = JPCS.list("jpcsStaffUsers");
        const existing = users.find(user => user.email === editingStaffEmail);
        const taken = users.some(user =>
            user.email === email && user.email !== editingStaffEmail
        );

        if (taken) {
            message.textContent = "This email is already used.";
            return;
        }

        if ((!existing && password.length < 8) ||
            (password && password.length < 8)) {
            message.textContent = "Password must be at least 8 characters.";
            return;
        }

        if (existing) {
            existing.name = name;
            existing.role = role;
            existing.active = active;
            if (password) existing.password = password;
        } else {
            users.push({
                name: name,
                email: email,
                password: password,
                role: role,
                active: active
            });
        }

        localStorage.setItem("jpcsStaffUsers", JSON.stringify(users));
        JPCS.log("Officer account saved", email + " - " + role);
        clearStaffForm();
        message.textContent = "Staff account saved.";
        staffList();
        showLogs();
    }
);

function studentList() {
    const table = document.getElementById("studentsTable");
    table.innerHTML = "";
    const students = JPCS.list("jpcsUsers");

    students.forEach(function (student) {
        if (student.role !== "student") return;
        const row = document.createElement("tr");
        appendCell(row, student.studentId);
        appendCell(row, student.name);
        appendCell(row, student.email);
        appendCell(row, student.active === false ? "Inactive" : "Active");

        const cell = document.createElement("td");
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = student.active === false ? "Activate" : "Deactivate";
        button.addEventListener("click", function () {
            if (!confirm("Change this student's login status?")) return;
            const current = JPCS.list("jpcsUsers");
            const target = current.find(user => user.email === student.email);
            if (!target) return;
            target.active = target.active === false;
            localStorage.setItem("jpcsUsers", JSON.stringify(current));
            JPCS.log("Student login status changed", student.email);
            studentList();
            showLogs();
        });
        const view = document.createElement("button");
        view.type = "button";
        view.textContent = "View Details";
        view.style.marginLeft = "8px";
        view.addEventListener("click", function () {
            JPCSRecords.showDetails(
                document.getElementById("staffStudentDetails"),
                student,
                JPCSRecords.findApplication(student)
            );
            document.getElementById("staffStudentDetails")
                .scrollIntoView();
        });
        cell.appendChild(button);
        cell.appendChild(view);
        row.appendChild(cell);
        table.appendChild(row);
    });
}

function showLogs() {
    const table = document.getElementById("logsTable");
    table.innerHTML = "";
    JPCS.list("jpcsActivityLogs").slice().reverse().forEach(function (entry) {
        const row = document.createElement("tr");
        appendCell(row, entry.date);
        appendCell(row, entry.email);
        appendCell(row, entry.action);
        appendCell(row, entry.details);
        table.appendChild(row);
    });
}

document.getElementById("downloadBackup").addEventListener(
    "click", function () {
        const backup = {};
        [
            "jpcsUsers", "jpcsStaffUsers", "jpcsApps", "jpcsEvents",
            "jpcsAnnouncements", "jpcsMembershipCalendar",
            "jpcsActivityLogs"
        ].forEach(function (key) {
            backup[key] = localStorage.getItem(key);
        });
        const blob = new Blob([JSON.stringify(backup, null, 2)], {
            type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "jpcs-backup.json";
        link.click();
        URL.revokeObjectURL(url);
        JPCS.log("Backup exported", "Includes demo account passwords");
        showLogs();
    }
);

document.getElementById("logoutBtn").addEventListener(
    "click", () => JPCS.logout()
);

if (canManageAccounts) {
    staffList();
    studentList();
    showLogs();
}
