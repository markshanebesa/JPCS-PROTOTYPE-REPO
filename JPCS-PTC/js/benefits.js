
// Get the logged-in account
let currentUser = null;

try {
    currentUser = JSON.parse(
        localStorage.getItem("jpcsMe")
    );
} catch (error) {
    currentUser = null;
}

// Check if the student is logged in
if (!currentUser || currentUser.role !== "student") {

    // Redirect to login page
    window.location.replace("login.html");

} else {

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn.addEventListener("click", function () {

        // Remove logged-in session
        localStorage.removeItem("jpcsMe");

        // Return to login page
        window.location.replace("login.html");

    });

}
