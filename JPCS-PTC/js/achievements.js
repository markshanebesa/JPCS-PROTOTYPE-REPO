// Only students can open this page.
let achievementUser = null;
try {
    achievementUser = JSON.parse(
        localStorage.getItem("jpcsMe") || "null"
    );
} catch (error) {
    achievementUser = null;
}

if (!achievementUser || achievementUser.role !== "student") {
    window.location.replace("login.html");
}

document.getElementById("logoutBtn").addEventListener(
    "click",
    function () {
        localStorage.removeItem("jpcsMe");
        window.location.replace("login.html");
    }
);
