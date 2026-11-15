
// JPCS - PTC Student Profile

let currentUser = null;

try {
    currentUser = JSON.parse(
        localStorage.getItem("jpcsMe") || "null"
    );
} catch (error) {
    currentUser = null;
}

// Student access only
if (!currentUser || currentUser.role !== "student") {
    window.location.replace("login.html");
} else {
    loadProfile();
    loadMembership();
    loadNotifications();
}

// Read saved arrays
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

// Find logged-in student
function getStudent() {
    const users = readList("jpcsUsers");
    const email = String(
        currentUser.email || ""
    ).toLowerCase();

    return users.find(function (user) {
        return String(user.email || "").toLowerCase() === email;
    }) || null;
}

// Get separate name fields
function getNameParts(student) {
    let surname = student.surname || student.lastName || "";
    let givenName = student.givenName ||
        student.firstname || student.firstName || "";
    let middle = student.middleInitial || "";

    // Support older accounts that only saved Full Name
    if (!surname || !givenName) {
        const words = String(student.name || "")
            .trim().split(/\s+/).filter(Boolean);

        if (words.length >= 2) {
            surname = surname || words.pop();

            const last = words[words.length - 1] || "";

            if (!middle && /^[a-zA-Z]\. ?$/.test(last)) {
                middle = words.pop().replace(/\s/g, "");
            } else if (!middle && /^[a-zA-Z]$/.test(last)) {
                middle = words.pop() + ".";
            }

            givenName = givenName || words.join(" ");
        } else if (!givenName) {
            givenName = words.join(" ");
        }
    }

    return {
        surname: surname,
        givenName: givenName,
        middleInitial: middle
    };
}

// Display saved text
function showText(id, value) {
    document.getElementById(id).textContent = value || "-";
}

// =====================================
// STUDENT INFORMATION
// =====================================

function loadProfile() {
    const student = getStudent();

    if (!student) {
        localStorage.removeItem("jpcsMe");
        window.location.replace("login.html");
        return;
    }

    currentUser = student;
    const name = getNameParts(student);

    showText("displaySurname", name.surname);
    showText("displayGivenName", name.givenName);
    showText("displayMiddleInitial", name.middleInitial);
    showText("displayStudentId", student.studentId);
    showText("displayEmail", student.email);
    showText("displayCourse", student.course);
    showText("displayYearSection", student.yearSection);
    showText("displayContact", student.contact);
    showText("displayBirthDate", student.birthDate);
    showText("displayGender", student.gender);
    showText("displayClassification", student.classification);
}

// =====================================
// EDIT PROFILE
// =====================================

function clearEditErrors() {
    document.querySelectorAll(
        "#editForm .error"
    ).forEach(function (element) {
        element.textContent = "";
    });
}

function showEditError(id, message) {
    document.getElementById(id).textContent = message;
}

// Open Edit Profile
document.getElementById("editBtn").addEventListener(
    "click",
    function () {
        const student = getStudent();
        if (!student) return;

        const name = getNameParts(student);

        document.getElementById("editSurname").value =
            name.surname;

        document.getElementById("editGivenName").value =
            name.givenName;

        document.getElementById("editMiddleInitial").value =
            name.middleInitial;

        document.getElementById("editStudentId").value =
            student.studentId || "";

        document.getElementById("editEmail").value =
            student.email || "";

        document.getElementById("editCourse").value =
            student.course || "";

        document.getElementById("editYearSection").value =
            student.yearSection || "";

        document.getElementById("editContact").value =
            student.contact || "";

        document.getElementById("editBirthDate").value =
            student.birthDate || "";

        document.getElementById("editGender").value =
            student.gender || "";

        document.getElementById("editClassification").value =
            student.classification || "";

        clearEditErrors();

        document.getElementById("editMessage").textContent = "";
        document.getElementById("profileMessage").textContent = "";

        document.getElementById("editSection").hidden = false;
        document.getElementById("editSection").scrollIntoView();
    }
);

// Save Profile Changes
document.getElementById("editForm").addEventListener(
    "submit",
    function (event) {
        event.preventDefault();
        clearEditErrors();

        const surname = document.getElementById(
            "editSurname"
        ).value.trim();

        const givenName = document.getElementById(
            "editGivenName"
        ).value.trim();

        let middle = document.getElementById(
            "editMiddleInitial"
        ).value.trim().toUpperCase();

        const course = document.getElementById(
            "editCourse"
        ).value.trim();

        const yearSection = document.getElementById(
            "editYearSection"
        ).value.trim();

        const contact = document.getElementById(
            "editContact"
        ).value.trim();

        const birthDate = document.getElementById(
            "editBirthDate"
        ).value;

        const gender = document.getElementById(
            "editGender"
        ).value;

        const classification = document.getElementById(
            "editClassification"
        ).value;

        let valid = true;

        if (!surname) {
            showEditError(
                "surnameError",
                "Surname is required."
            );
            valid = false;
        }

        if (!givenName) {
            showEditError(
                "givenNameError",
                "Given name is required."
            );
            valid = false;
        }

        if (middle && !/^[A-Z]\.?$/.test(middle)) {
            showEditError(
                "middleInitialError",
                "Enter one letter only, such as D."
            );
            valid = false;
        } else if (middle && !middle.endsWith(".")) {
            middle += ".";
        }

        if (!course) {
            showEditError(
                "courseError",
                "Course is required."
            );
            valid = false;
        }

        if (!yearSection) {
            showEditError(
                "yearError",
                "Year and section are required."
            );
            valid = false;
        }

        if (!/^09\d{9}$/.test(contact)) {
            showEditError(
                "contactError",
                "Enter an 11-digit number starting with 09."
            );
            valid = false;
        }

        const today = new Date();
        const todayText = today.getFullYear() + "-" +
            String(today.getMonth() + 1).padStart(2, "0") + "-" +
            String(today.getDate()).padStart(2, "0");

        if (!birthDate || birthDate > todayText) {
            showEditError(
                "birthDateError",
                "Select a valid birth date."
            );
            valid = false;
        }

        if (!gender) {
            showEditError(
                "genderError",
                "Select your gender."
            );
            valid = false;
        }

        if (!classification) {
            showEditError(
                "classificationError",
                "Select your classification."
            );
            valid = false;
        }

        if (!valid) return;

        const users = readList("jpcsUsers");

        const email = String(
            currentUser.email || ""
        ).toLowerCase();

        const index = users.findIndex(function (user) {
            return String(user.email || "").toLowerCase() === email;
        });

        if (index < 0) {
            document.getElementById("editMessage").textContent =
                "Student account not found.";
            return;
        }

        // Update account information
        const student = users[index];

        student.surname = surname;
        student.givenName = givenName;
        student.middleInitial = middle;

        // Keep name for other existing pages
        student.name = [givenName, middle, surname]
            .filter(Boolean).join(" ");

        student.course = course;
        student.yearSection = yearSection;
        student.contact = contact;
        student.birthDate = birthDate;
        student.gender = gender;
        student.classification = classification;

        try {
            localStorage.setItem(
                "jpcsUsers",
                JSON.stringify(users)
            );

            localStorage.setItem(
                "jpcsMe",
                JSON.stringify(student)
            );

            currentUser = student;
            loadProfile();

            document.getElementById("editSection").hidden = true;

            document.getElementById("profileMessage").textContent =
                "Profile updated successfully.";

        } catch (error) {
            document.getElementById("editMessage").textContent =
                "Unable to save changes.";
        }
    }
);

// Cancel editing
document.getElementById("cancelBtn").addEventListener(
    "click",
    function () {
        document.getElementById("editSection").hidden = true;
        clearEditErrors();
    }
);

// =====================================
// CHANGE PASSWORD
// =====================================

function clearPasswordErrors() {
    document.querySelectorAll(
        "#passwordForm .error"
    ).forEach(function (element) {
        element.textContent = "";
    });
}

// Show or hide all password inputs
document.getElementById("showPasswords").addEventListener(
    "change",
    function () {
        const type = this.checked ? "text" : "password";

        ["oldPassword", "newPassword", "confirmPassword"]
            .forEach(function (id) {
                document.getElementById(id).type = type;
            });
    }
);

// Save new password
document.getElementById("passwordForm").addEventListener(
    "submit",
    function (event) {
        event.preventDefault();
        clearPasswordErrors();

        const oldPassword = document.getElementById(
            "oldPassword"
        ).value;

        const newPassword = document.getElementById(
            "newPassword"
        ).value;

        const confirmPassword = document.getElementById(
            "confirmPassword"
        ).value;

        const message = document.getElementById("passwordMessage");
        message.textContent = "";

        const users = readList("jpcsUsers");

        const email = String(
            currentUser.email || ""
        ).toLowerCase();

        const index = users.findIndex(function (user) {
            return String(user.email || "").toLowerCase() === email;
        });

        if (index < 0) {
            message.textContent = "Account not found.";
            return;
        }

        let valid = true;

        // Check old password
        if (oldPassword !== users[index].password) {
            document.getElementById(
                "oldPasswordError"
            ).textContent =
                "Old password is incorrect.";

            valid = false;
        }

        // Check new password
        if (
            newPassword.length < 8 ||
            !/[A-Za-z]/.test(newPassword) ||
            !/[0-9]/.test(newPassword)
        ) {
            document.getElementById(
                "newPasswordError"
            ).textContent =
                "Use at least 8 characters, a letter, and a number.";

            valid = false;

        } else if (newPassword === oldPassword) {
            document.getElementById(
                "newPasswordError"
            ).textContent =
                "New password must be different from the old one.";

            valid = false;
        }

        // Confirm new password
        if (!confirmPassword || newPassword !== confirmPassword) {
            document.getElementById(
                "confirmPasswordError"
            ).textContent =
                "Passwords do not match.";

            valid = false;
        }

        if (!valid) return;

        // Change the saved password
        users[index].password = newPassword;

        try {
            localStorage.setItem(
                "jpcsUsers",
                JSON.stringify(users)
            );

            localStorage.setItem(
                "jpcsMe",
                JSON.stringify(users[index])
            );

            currentUser = users[index];

            document.getElementById("passwordForm").reset();

            ["oldPassword", "newPassword", "confirmPassword"]
                .forEach(function (id) {
                    document.getElementById(id).type = "password";
                });

            message.textContent = "Password changed successfully.";

        } catch (error) {
            message.textContent = "Unable to update password.";
        }
    }
);

// =====================================
// MEMBERSHIP INFORMATION
// =====================================

function getCalendar() {
    try {
        return JSON.parse(
            localStorage.getItem("jpcsMembershipCalendar") || "null"
        );
    } catch (error) {
        return null;
    }
}

function getMyApplication() {
    const applications = readList("jpcsApps");

    const email = String(
        currentUser.email || ""
    ).toLowerCase();

    const studentId = String(
        currentUser.studentId || ""
    );

    return applications.find(function (app) {
        const appEmail = String(
            app.accountEmail || app.email || ""
        ).toLowerCase();

        const appStudentId = String(
            app.accountStudentId || app.studentId || ""
        );

        return (email && appEmail === email) ||
            (studentId && appStudentId === studentId);
    }) || null;
}

function todayISO() {
    const today = new Date();

    return today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");
}

function loadMembership() {
    const application = getMyApplication();
    const calendar = getCalendar();

    let status = "Not Applied";

    if (application) {
        status = application.status || "Pending";

        if (
            calendar &&
            calendar.membershipEndDate &&
            todayISO() >= calendar.membershipEndDate
        ) {
            status = "Inactive";
        }
    }

    const badge = document.getElementById("membershipStatus");

    badge.textContent = status;
    badge.className = "status";

    if (status === "Active") {
        badge.classList.add("active");
    }

    if (status === "Pending") {
        badge.classList.add("pending");
    }

    showText(
        "applicationType",
        application ? application.applicationType : "-"
    );

    showText(
        "applicationDate",
        application ? application.date : "-"
    );

    showText(
        "membershipEndDate",
        calendar ? calendar.membershipEndDate : "Not Set"
    );
}

// =====================================
// NOTIFICATIONS
// =====================================

function loadNotifications() {
    const announcements = readList("jpcsAnnouncements").filter(
        item => item.published !== false
    );

    const list = document.getElementById("notificationList");
    list.innerHTML = "";

    document.getElementById("notificationCount").textContent =
        announcements.length;

    if (announcements.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No announcements available.";
        list.appendChild(message);
        return;
    }

    // Display latest three announcements
    announcements.slice().reverse().slice(0, 3)
        .forEach(function (announcement) {

            const box = document.createElement("div");
            box.className = "notification";

            const title = document.createElement("h3");
            title.textContent =
                announcement.title || "Announcement";

            const date = document.createElement("small");
            date.textContent = announcement.date || "";

            const content = document.createElement("p");
            content.textContent = announcement.content || "";

            box.appendChild(title);
            box.appendChild(date);
            box.appendChild(content);

            list.appendChild(box);
        });
}

// =====================================
// LOGOUT
// =====================================

document.getElementById("logoutBtn").addEventListener(
    "click",
    function () {
        localStorage.removeItem("jpcsMe");
        window.location.replace("login.html");
    }
);
