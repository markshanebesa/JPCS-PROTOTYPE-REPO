// JPCS - PTC Home Page
let student = null;
try { student = JSON.parse(localStorage.getItem("jpcsMe")); } catch (error) { student = null; }
if (!student || student.role !== "student") {
    window.location.replace("login.html");
}
document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem("jpcsMe");
    window.location.replace("login.html");
});
