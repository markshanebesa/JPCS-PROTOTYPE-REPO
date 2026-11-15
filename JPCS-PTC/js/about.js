
// Get the logged-in account
let currentUser = null;

try {
    currentUser = JSON.parse(
        localStorage.getItem("jpcsMe")
    );
} catch (error) {
    currentUser = null;
}

// Redirect users who are not logged in
if (!currentUser || currentUser.role !== "student") {
    window.location.replace("login.html");
}

// Logout button
document.getElementById("logoutBtn").addEventListener(
    "click",
    function () {

        // Remove logged-in account
        localStorage.removeItem("jpcsMe");

        // Return to login page
        window.location.replace("login.html");
    }
);
