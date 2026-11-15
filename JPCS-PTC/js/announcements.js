// JPCS student announcements and events.
let currentUser = null;

try {
    currentUser = JSON.parse(localStorage.getItem("jpcsMe") || "null");
} catch (error) {
    currentUser = null;
}

if (!currentUser || currentUser.role !== "student") {
    window.location.replace("login.html");
}

function loadItems(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(value) ? value : [];
    } catch (error) {
        return [];
    }
}

function renderList(items, id, type) {
    const container = document.getElementById(id);
    container.innerHTML = "";

    const published = items.filter(item => item.published !== false);
    if (!published.length) {
        const message = document.createElement("p");
        message.textContent = "No " + type + " available yet.";
        container.appendChild(message);
        return;
    }

    published.slice().reverse().forEach(function (item) {
        const box = document.createElement("div");
        box.className = "content-item";

        const title = document.createElement("h3");
        title.textContent = item.title || "Untitled";

        const date = document.createElement("small");
        date.textContent = item.date || "";

        const content = document.createElement("p");
        content.textContent = type === "events"
            ? item.location + "\n" + item.description
            : item.content || "";

        box.appendChild(title);
        box.appendChild(date);
        box.appendChild(content);

        if (type === "announcements" && item.image) {
            const image = document.createElement("img");
            image.src = item.image;
            image.alt = item.title || "Announcement image";
            box.appendChild(image);
        }

        container.appendChild(box);
    });
}

if (currentUser && currentUser.role === "student") {
    renderList(loadItems("jpcsAnnouncements"),
        "announcementList", "announcements");
    renderList(loadItems("jpcsEvents"),
        "eventList", "events");
}

document.getElementById("logoutBtn").addEventListener(
    "click", function () {
        localStorage.removeItem("jpcsMe");
        window.location.replace("login.html");
    }
);
