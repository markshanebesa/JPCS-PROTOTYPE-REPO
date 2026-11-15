// Organization Head: information and statistics only, no edit controls.
const canViewReports = JPCS.require(["organization-head", "main-admin"]);

function getCurrentStatus(app, endDate) {
    const date = new Date();
    const today = date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0");

    if (endDate && today >= endDate) return "Inactive";
    return app.status || "Pending";
}

function showPublished(items, containerId, formatter) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (!items.length) {
        container.textContent = "No published records.";
        return;
    }

    items.forEach(function (item) {
        const card = document.createElement("div");
        card.className = "entry";
        const title = document.createElement("h3");
        title.textContent = item.title || "Untitled";
        const body = document.createElement("p");
        body.textContent = formatter(item);
        card.appendChild(title);
        card.appendChild(body);
        container.appendChild(card);
    });
}

function loadReport() {
    const students = JPCS.list("jpcsUsers").filter(
        user => user.role === "student"
    );
    const apps = JPCS.list("jpcsApps");
    const posts = JPCS.list("jpcsAnnouncements").filter(
        item => item.published !== false
    );
    const events = JPCS.list("jpcsEvents").filter(
        item => item.published !== false
    );
    let calendar = null;

    try {
        calendar = JSON.parse(localStorage.getItem("jpcsMembershipCalendar"));
    } catch (error) {
        calendar = null;
    }

    const endDate = calendar ? calendar.membershipEndDate : "";
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = events.filter(item => item.date >= today);

    document.getElementById("studentCount").textContent = students.length;
    document.getElementById("totalApps").textContent = apps.length;
    document.getElementById("pendingCount").textContent = apps.filter(
        item => getCurrentStatus(item, endDate) === "Pending"
    ).length;
    document.getElementById("activeCount").textContent = apps.filter(
        item => getCurrentStatus(item, endDate) === "Active"
    ).length;
    document.getElementById("inactiveCount").textContent = apps.filter(
        item => getCurrentStatus(item, endDate) === "Inactive"
    ).length;
    document.getElementById("postsCount").textContent = posts.length;
    document.getElementById("eventsCount").textContent = upcoming.length;

    showPublished(posts, "postList", item => item.date + "\n" + item.content);
    showPublished(upcoming, "eventList", item =>
        item.date + " | " + item.location + "\n" + item.description
    );
}


// Click statistics and summaries to see their records.
function viewSummary(type) {
    JPCSRecords.showList(
        type,
        document.getElementById("statRecordsSection"),
        document.getElementById("statRecordsTitle"),
        document.getElementById("statRecordsTable"),
        document.getElementById("statRecordDetail")
    );
    document.getElementById("statRecordsSection").scrollIntoView();
}

document.querySelectorAll("[data-records]").forEach(function (card) {
    card.addEventListener("click", function () {
        viewSummary(card.dataset.records);
    });
});

document.getElementById("closeStatRecords").addEventListener(
    "click", function () {
        document.getElementById("statRecordsSection").hidden = true;
    }
);

document.getElementById("logoutBtn").addEventListener(
    "click", () => JPCS.logout()
);

if (canViewReports) loadReport();
