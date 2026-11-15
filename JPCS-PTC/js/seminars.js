
// Get the logged-in student
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

    window.location.replace("login.html");

} else {

    // Get logout button
    const logoutBtn = document.getElementById("logoutBtn");

    // Logout functionality
    logoutBtn.addEventListener("click", function () {

        // Remove current login session
        localStorage.removeItem("jpcsMe");

        // Return to login page
        window.location.replace("login.html");

    });

}
