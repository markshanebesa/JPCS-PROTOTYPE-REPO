// Co-Admin: student and membership records.
const canManageMembers = JPCS.require(["co-admin", "main-admin"]);
let selectedStudentEmail = null;
let selectedStatistic = "students";

function refreshCounts() {
    const apps = JPCSRecords.applications();
    const students = JPCSRecords.students();

    document.getElementById("studentCount").textContent = students.length;
    ["Pending", "Active", "Inactive"].forEach(function (status) {
        document.getElementById(status.toLowerCase() + "Count")
            .textContent = apps.filter(function (app) {
                return JPCSRecords.status(app) === status;
            }).length;
    });
}

function makeCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text || "-";
    row.appendChild(cell);
    return cell;
}

function showStatistic(type) {
    selectedStatistic = type;
    JPCSRecords.showList(
        type,
        document.getElementById("statRecordsSection"),
        document.getElementById("statRecordsTitle"),
        document.getElementById("statRecordsTable"),
        document.getElementById("statRecordDetail")
    );
    document.getElementById("statRecordsSection").scrollIntoView();
}

function readName(student) {
    const fields = JPCSRecords.detailFields(student, null);
    return {
        surname: student.surname || fields[0][1] || "",
        givenName: student.givenName || fields[1][1] || "",
        middle: student.middleInitial || ""
    };
}

function openEditor(student) {
    selectedStudentEmail = student.email;
    const name = readName(student);
    const app = JPCSRecords.findApplication(student);
    const form = app?.formData || {};

    document.getElementById("editSurname").value = name.surname;
    document.getElementById("editGivenName").value = name.givenName;
    document.getElementById("editMiddleInitial").value = name.middle;
    document.getElementById("editBirthDate").value =
        student.birthDate || form.birthDate || "";
    document.getElementById("editGender").value =
        student.gender || form.gender || "Male";
    document.getElementById("editCourse").value = student.course || "";
    document.getElementById("editYear").value =
        student.yearSection || "";
    document.getElementById("editContact").value = student.contact || "";
    document.getElementById("editClass").value =
        student.classification || "Regular";
    document.getElementById("editYearLevel").value =
        form.yearLevel || "";
    document.getElementById("editSection").value = form.section || "";
    document.getElementById("editType").value =
        form.applicationType || app?.applicationType || "New Membership";
    document.getElementById("editReceipt").value =
        form.receiptNo || app?.receiptNo || "";
    document.getElementById("editSignature").value =
        form.signature || app?.signature || "";
    document.getElementById("editSignedDate").value =
        form.signedDate || app?.signedDate || "";

    // An officer cannot create an application merely by editing an account.
    ["editYearLevel", "editSection", "editType", "editReceipt",
     "editSignature", "editSignedDate"].forEach(function (id) {
        document.getElementById(id).disabled = !app;
    });

    document.getElementById("studentMessage").textContent = "";
    document.getElementById("editStudentSection").hidden = false;
    document.getElementById("editStudentSection").scrollIntoView();
}

function refreshStudents() {
    const tbody = document.getElementById("studentTable");
    const query = document.getElementById("studentSearch")
        .value.trim().toLowerCase();
    tbody.innerHTML = "";

    const students = JPCSRecords.students().filter(function (student) {
        return [student.studentId, student.name, student.email]
            .join(" ").toLowerCase().includes(query);
    });

    students.forEach(function (student) {
        const row = document.createElement("tr");
        makeCell(row, student.studentId);
        makeCell(row, student.name);
        makeCell(row, student.email);
        makeCell(row, student.yearSection);

        const cell = document.createElement("td");
        const view = document.createElement("button");
        view.type = "button";
        view.textContent = "View Details";
        view.addEventListener("click", function () {
            JPCSRecords.showDetails(
                document.getElementById("studentDetailContent"),
                student,
                JPCSRecords.findApplication(student)
            );
            const section = document.getElementById("studentDetailSection");
            section.hidden = false;
            section.scrollIntoView();
        });

        const edit = document.createElement("button");
        edit.type = "button";
        edit.textContent = "Edit";
        edit.className = "secondary";
        edit.style.marginLeft = "8px";
        edit.addEventListener("click", function () {
            openEditor(student);
        });

        cell.appendChild(view);
        cell.appendChild(edit);
        row.appendChild(cell);
        tbody.appendChild(row);
    });

    if (!students.length) {
        makeCell(tbody.insertRow(), "No students found.").colSpan = 5;
    }
}

// Save registration information and existing application fields.
document.getElementById("editStudentForm").addEventListener(
    "submit", function (event) {
        event.preventDefault();
        if (!selectedStudentEmail) return;

        const users = JPCS.list("jpcsUsers");
        const user = users.find(function (item) {
            return item.email === selectedStudentEmail &&
                item.role === "student";
        });
        if (!user) return;

        const surname = document.getElementById("editSurname").value.trim();
        const given = document.getElementById("editGivenName").value.trim();
        const middleRaw = document.getElementById("editMiddleInitial")
            .value.trim().toUpperCase();
        const middle = middleRaw ? middleRaw.replace(/\.$/, "") + "." : "";
        const course = document.getElementById("editCourse").value.trim();
        const year = document.getElementById("editYear").value.trim();
        const contact = document.getElementById("editContact").value.trim();
        const birthDate = document.getElementById("editBirthDate").value;
        const gender = document.getElementById("editGender").value;
        const classification = document.getElementById("editClass").value;
        const message = document.getElementById("studentMessage");

        if (!surname || !given || !course || !year ||
            (middleRaw && !/^[A-Z]\.?$/.test(middleRaw))) {
            message.textContent = "Complete the required fields. " +
                "Middle Initial must be one letter.";
            return;
        }

        if (contact && !/^09\d{9}$/.test(contact)) {
            message.textContent = "Enter a valid 11-digit contact number.";
            return;
        }

        user.surname = surname;
        user.givenName = given;
        user.middleInitial = middle;
        user.name = [given, middle, surname].filter(Boolean).join(" ");
        user.course = course;
        user.yearSection = year;
        user.contact = contact;
        user.birthDate = birthDate;
        user.gender = gender;
        user.classification = classification;

        const apps = JPCS.list("jpcsApps");
        const app = apps.find(function (item) {
            const email = String(
                item.accountEmail || item.email || ""
            ).toLowerCase();
            const id = String(
                item.accountStudentId || item.studentId || ""
            );
            return email === user.email.toLowerCase() ||
                id === String(user.studentId);
        });

        if (app) {
            if (!app.formData) app.formData = {};
            const form = app.formData;
            form.surname = surname;
            form.firstname = given;
            form.middleInitial = middle;
            form.program = course;
            form.yearLevel = document.getElementById("editYearLevel")
                .value.trim();
            form.section = document.getElementById("editSection")
                .value.trim();
            form.applicationType = document.getElementById("editType").value;
            form.receiptNo = document.getElementById("editReceipt")
                .value.trim();
            form.signature = document.getElementById("editSignature")
                .value.trim();
            form.signedDate = document.getElementById("editSignedDate").value;
            form.birthDate = birthDate;
            form.gender = gender;
            // IDs and email are deliberately not changed.
            form.email = app.email || user.email;
            form.studentNo = String(app.studentId || user.studentId);

            app.fullName = user.name;
            app.course = course;
            app.yearSection = form.yearLevel && form.section ?
                form.yearLevel + " " + form.section : year;
            app.contact = contact;
            app.classification = classification;
            app.birthDate = birthDate;
            app.gender = gender;
            app.receiptNo = form.receiptNo;
            app.signature = form.signature;
            app.signedDate = form.signedDate;
            app.applicationType = form.applicationType;
        }

        try {
            localStorage.setItem("jpcsUsers", JSON.stringify(users));
            if (app) {
                localStorage.setItem("jpcsApps", JSON.stringify(apps));
            }
            JPCS.log("Student record updated", user.studentId);
            document.getElementById("editStudentSection").hidden = true;
            document.getElementById("studentDetailSection").hidden = true;
            selectedStudentEmail = null;
            refreshCounts();
            refreshStudents();
            if (!document.getElementById("statRecordsSection").hidden) {
                showStatistic(selectedStatistic);
            }
        } catch (error) {
            message.textContent = "Could not save student changes.";
        }
    }
);

document.getElementById("cancelStudent").addEventListener(
    "click", function () {
        selectedStudentEmail = null;
        document.getElementById("editStudentSection").hidden = true;
    }
);

document.getElementById("closeStudentDetail").addEventListener(
    "click", function () {
        document.getElementById("studentDetailSection").hidden = true;
    }
);

document.getElementById("studentSearch").addEventListener(
    "input", refreshStudents
);

document.querySelectorAll(".stat[data-records]").forEach(function (card) {
    card.addEventListener("click", function () {
        showStatistic(card.dataset.records);
    });
});

document.getElementById("closeStatRecords").addEventListener(
    "click", function () {
        document.getElementById("statRecordsSection").hidden = true;
    }
);

document.getElementById("logoutBtn").addEventListener(
    "click", function () { JPCS.logout(); }
);

if (canManageMembers) {
    refreshCounts();
    refreshStudents();
}
