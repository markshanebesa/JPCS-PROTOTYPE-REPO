
const signupForm = document.getElementById("signupForm");
const signupSuccess = document.getElementById("signupSuccess");

// Show or hide passwords
function togglePassword(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    button.addEventListener("click", function () {
        if (input.type === "password") {
            input.type = "text";
            button.textContent = "Hide";
        } else {
            input.type = "password";
            button.textContent = "Show";
        }
    });
}

togglePassword("signupPassword", "showPassword");
togglePassword("confirmPassword", "showConfirmPassword");

// Display error below a field
function showError(field, message) {
    document.getElementById(field + "Error").textContent = message;
}

// Remove previous errors
function clearErrors() {
    document.querySelectorAll(".error").forEach(function (error) {
        error.textContent = "";
    });
}

// Remove error when user edits a field
signupForm.querySelectorAll("input, select").forEach(function (input) {
    input.addEventListener("input", function () {
        clearErrors();
    });

    input.addEventListener("change", function () {
        clearErrors();
    });
});

// Read saved data safely
function readList(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

// Register account
signupForm.addEventListener("submit", function (event) {

    event.preventDefault();
    clearErrors();

    // Get form values
    const surname = document.getElementById("surname").value.trim();
    const givenName = document.getElementById("givenName").value.trim();
    let middleInitial = document.getElementById("middleInitial").value.trim();

    const birthDate = document.getElementById("birthDate").value;
    const gender = document.querySelector('input[name="gender"]:checked');

    const studentId = document.getElementById("studentId").value.trim();
    const course = document.getElementById("course").value;
    const yearSection = document.getElementById("yearSection").value.trim();

    const classification = document.querySelector(
        'input[name="classification"]:checked'
    );

    const contact = document.getElementById("contact").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();

    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    let valid = true;

    // Validate name
    if (surname === "") {
        showError("surname", "Surname is required.");
        valid = false;
    }

    if (givenName === "") {
        showError("givenName", "Given name is required.");
        valid = false;
    }

    // Middle initial is optional
    if (middleInitial !== "") {
        middleInitial = middleInitial.replace(/\.$/, "");

        if (!/^[A-Za-z]{1,2}$/.test(middleInitial)) {
            showError("middleInitial", "Enter a valid middle initial.");
            valid = false;
        } else {
            middleInitial += ".";
        }
    }

    // Validate birth date
    if (birthDate === "") {
        showError("birthDate", "Please select your birth date.");
        valid = false;
    } else {
        const today = new Date();
        const selectedDate = new Date(birthDate + "T00:00:00");

        if (isNaN(selectedDate.getTime()) || selectedDate > today) {
            showError("birthDate", "Enter a valid birth date.");
            valid = false;
        }
    }

    // Validate gender
    if (!gender) {
        showError("gender", "Please select your gender.");
        valid = false;
    }

    // Validate student ID
    if (studentId === "") {
        showError("studentId", "Student ID is required.");
        valid = false;
    }

    // Validate course
    if (course === "") {
        showError("course", "Please select your course.");
        valid = false;
    }

    // Validate year and section
    if (yearSection === "") {
        showError("yearSection", "Year and section are required.");
        valid = false;
    }

    // Validate classification
    if (!classification) {
        showError("classification", "Please select your classification.");
        valid = false;
    }

    // Validate contact number
    if (!/^09\d{9}$/.test(contact)) {
        showError("contact", "Enter a valid 11-digit Philippine mobile number.");
        valid = false;
    }

    // Validate institutional email
    const emailPattern =
        /^[^\s@]+@paterostechnologicalcollege\.edu\.ph$/i;

    if (email === "") {
        showError("signupEmail", "Institutional email is required.");
        valid = false;
    } else if (!emailPattern.test(email)) {
        showError(
            "signupEmail",
            "Please use your official PTC institutional email."
        );
        valid = false;
    }

    // Validate password
    if (password.length < 6) {
        showError("signupPassword", "Password must have at least 6 characters.");
        valid = false;
    }

    // Confirm password
    if (confirmPassword === "") {
        showError("confirmPassword", "Please confirm your password.");
        valid = false;
    } else if (password !== confirmPassword) {
        showError("confirmPassword", "Passwords do not match.");
        valid = false;
    }

    if (!valid) {
        return;
    }

    // Get registered accounts and applications
    const accounts = readList("jpcsUsers");
    const applications = readList("jpcsApps");

    // Check duplicate email
    const emailExists = accounts.some(function (user) {
        return String(user.email || "").toLowerCase() === email;
    });

    if (emailExists) {
        showError("signupEmail", "This email is already registered.");
        return;
    }

    // Check duplicate student ID
    const idExists = accounts.some(function (user) {
        return String(user.studentId || "").trim() === studentId;
    });

    const applicationIdExists = applications.some(function (application) {
        return String(
            application.studentId || application.studentNo || ""
        ).trim() === studentId;
    });

    if (idExists || applicationIdExists) {
        showError("studentId", "This Student ID is already registered.");
        return;
    }

    // Combine student name
    const fullName = [
        givenName,
        middleInitial,
        surname
    ].filter(Boolean).join(" ");

    // Create student account
    const newStudent = {
        name: fullName,
        surname: surname,
        givenName: givenName,
        middleInitial: middleInitial,
        birthDate: birthDate,
        gender: gender.value,
        studentId: studentId,
        course: course,
        yearSection: yearSection,
        classification: classification.value,
        contact: contact,
        email: email,
        password: password,
        role: "student"
    };

    // Save account
    accounts.push(newStudent);

    try {
        localStorage.setItem("jpcsUsers", JSON.stringify(accounts));
    } catch (error) {
        showError(
            "signupEmail",
            "Unable to save your account. Please try again."
        );
        return;
    }

    // Show registration success
    signupForm.hidden = true;
    signupSuccess.hidden = false;

    signupSuccess.scrollIntoView();

});
