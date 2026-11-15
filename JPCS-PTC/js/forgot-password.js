
// JPCS - PTC Forgot Password

let verifiedEmail = "";

// Read registered accounts
function getUsers() {
    try {
        const users = JSON.parse(
            localStorage.getItem("jpcsUsers") || "[]"
        );

        return Array.isArray(users) ? users : [];
    } catch (error) {
        return [];
    }
}

// Clear error messages
function clearErrors() {
    document.getElementById("emailError").textContent = "";
    document.getElementById("studentIdError").textContent = "";
    document.getElementById("passwordError").textContent = "";
    document.getElementById("confirmError").textContent = "";
    document.getElementById("generalMessage").textContent = "";
}

// Step 1: Verify account
document.getElementById("verifyForm").addEventListener(
    "submit",
    function (event) {
        event.preventDefault();
        clearErrors();

        const email = document.getElementById("email")
            .value.trim().toLowerCase();

        const studentId = document.getElementById("studentId")
            .value.trim();

        const schoolDomain = "@paterostechnologicalcollege.edu.ph";

        if (!email.endsWith(schoolDomain)) {
            document.getElementById("emailError").textContent =
                "Please use your PTC institutional email.";
            return;
        }

        if (!studentId) {
            document.getElementById("studentIdError").textContent =
                "Please enter your Student ID.";
            return;
        }

        const users = getUsers();

        const student = users.find(function (user) {
            return user.role !== "admin" &&
                String(user.email || "").toLowerCase() === email &&
                String(user.studentId || "").trim() === studentId;
        });

        if (!student) {
            document.getElementById("studentIdError").textContent =
                "The email and Student ID do not match a registered account.";
            return;
        }

        verifiedEmail = email;

        document.getElementById("verifyForm").hidden = true;
        document.getElementById("resetForm").hidden = false;
    }
);

// Show or hide password
function togglePassword(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    if (input.type === "password") {
        input.type = "text";
        button.textContent = "Hide";
    } else {
        input.type = "password";
        button.textContent = "Show";
    }
}

document.getElementById("showNewPassword").addEventListener(
    "click",
    function () {
        togglePassword("newPassword", "showNewPassword");
    }
);

document.getElementById("showConfirmPassword").addEventListener(
    "click",
    function () {
        togglePassword("confirmPassword", "showConfirmPassword");
    }
);

// Step 2: Reset password
document.getElementById("resetForm").addEventListener(
    "submit",
    function (event) {
        event.preventDefault();
        clearErrors();

        if (!verifiedEmail) {
            document.getElementById("generalMessage").textContent =
                "Please verify your account first.";
            return;
        }

        const newPassword = document.getElementById(
            "newPassword"
        ).value;

        const confirmPassword = document.getElementById(
            "confirmPassword"
        ).value;

        let valid = true;

        if (
            newPassword.length < 8 ||
            !/[A-Za-z]/.test(newPassword) ||
            !/[0-9]/.test(newPassword)
        ) {
            document.getElementById("passwordError").textContent =
                "Password must contain at least 8 characters, a letter, and a number.";
            valid = false;
        }

        if (newPassword !== confirmPassword) {
            document.getElementById("confirmError").textContent =
                "Passwords do not match.";
            valid = false;
        }

        if (!valid) {
            return;
        }

        const users = getUsers();

        const index = users.findIndex(function (user) {
            return user.role !== "admin" &&
                String(user.email || "").toLowerCase() === verifiedEmail;
        });

        if (index === -1) {
            document.getElementById("generalMessage").textContent =
                "Account not found. Please verify again.";
            return;
        }

        // Update password
        users[index].password = newPassword;

        try {
            localStorage.setItem(
                "jpcsUsers",
                JSON.stringify(users)
            );

            // Require a fresh login
            localStorage.removeItem("jpcsMe");

            verifiedEmail = "";

            document.getElementById("resetForm").hidden = true;
            document.getElementById("successSection").hidden = false;

        } catch (error) {
            document.getElementById("generalMessage").textContent =
                "Unable to save the new password.";
        }
    }
);
