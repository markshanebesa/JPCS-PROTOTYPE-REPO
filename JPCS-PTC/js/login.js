const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("loginEmail");
const passwordInput = document.getElementById("loginPassword");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const showPassword = document.getElementById("showPassword");

const staffPages = {
    "moderator": "moderator.html",
    "co-admin": "co-admin.html",
    "main-admin": "admin.html",
    "organization-head": "organization-head.html"
};

// These are classroom DEMO accounts only.
// They are added automatically once, so no installer is needed.
// A real website must keep account credentials on a secure server.
function installDemoOfficers() {
    const setupKey = "jpcsDemoOfficersReadyV2";

    if (localStorage.getItem(setupKey) === "yes") {
        return;
    }

    const demoAccounts = [
        {
            name: "JPCS Moderator",
            email: "moderator@jpcs.ptc",
            password: "JPCSmod2026!",
            role: "moderator",
            active: true
        },
        {
            name: "JPCS Co-Admin",
            email: "coadmin@jpcs.ptc",
            password: "JPCScoadmin2026!",
            role: "co-admin",
            active: true
        },
        {
            name: "JPCS Main Admin",
            email: "admin@jpcs.ptc",
            password: "JPCSadmin2026!",
            role: "main-admin",
            active: true
        },
        {
            name: "JPCS Organization Head",
            email: "head@jpcs.ptc",
            password: "JPCShead2026!",
            role: "organization-head",
            active: true
        }
    ];

    const savedAccounts = readList("jpcsStaffUsers");

    // On the first visit after this update, restore demo passwords.
    // Keep unrelated staff accounts; do not reset on every page load.
    demoAccounts.forEach(function (demo) {
        const index = savedAccounts.findIndex(function (user) {
            return String(user.email || "").toLowerCase() === demo.email;
        });

        if (index === -1) {
            savedAccounts.push(demo);
        } else {
            savedAccounts[index] = demo;
        }
    });

    try {
        localStorage.setItem(
            "jpcsStaffUsers",
            JSON.stringify(savedAccounts)
        );
        localStorage.setItem(setupKey, "yes");
    } catch (error) {
        emailError.textContent =
            "Could not initialize demo accounts in this browser.";
    }
}

function readList(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

installDemoOfficers();

showPassword.addEventListener("click", function () {
    const visible = passwordInput.type === "password";
    passwordInput.type = visible ? "text" : "password";
    showPassword.textContent = visible ? "Hide" : "Show";
});

emailInput.addEventListener("input", function () {
    emailError.textContent = "";
});

passwordInput.addEventListener("input", function () {
    passwordError.textContent = "";
});

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    emailError.textContent = "";
    passwordError.textContent = "";

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email) {
        emailError.textContent = "Enter your email.";
        return;
    }

    if (!password) {
        passwordError.textContent = "Enter your password.";
        return;
    }

    // Officer accounts are installed separately from the website files.
    const staff = readList("jpcsStaffUsers").find(function (user) {
        return String(user.email).toLowerCase() === email;
    });

    if (staff) {
        if (staff.active === false) {
            passwordError.textContent = "This account is inactive.";
            return;
        }

        if (staff.password !== password) {
            passwordError.textContent = "Incorrect password.";
            return;
        }

        const session = {
            name: staff.name,
            email: staff.email,
            role: staff.role
        };

        localStorage.setItem("jpcsMe", JSON.stringify(session));
        window.location.href = staffPages[staff.role] || "login.html";
        return;
    }

    // Students must use their PTC institutional email.
    const schoolEmail =
        /^[^\s@]+@paterostechnologicalcollege\.edu\.ph$/i;

    if (!schoolEmail.test(email)) {
        emailError.textContent =
            "Use your institutional email or assigned officer account.";
        return;
    }

    const student = readList("jpcsUsers").find(function (user) {
        return String(user.email || "").toLowerCase() === email &&
            user.password === password &&
            user.role === "student" &&
                user.active !== false;
    });

    if (!student) {
        passwordError.textContent = "Incorrect email or password.";
        return;
    }

    localStorage.setItem("jpcsMe", JSON.stringify(student));
    window.location.href = "dashboard.html";
});
