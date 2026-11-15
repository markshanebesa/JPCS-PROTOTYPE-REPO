// Moderator: announcements and events.
const canModerate = JPCS.require(["moderator", "main-admin"]);
let editingPostId = null;
let editingEventId = null;

function saveItems(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        return false;
    }
}

function makeButton(label, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", action);
    return button;
}

// Build a simple text-based entry without unsafe HTML injection.
function addEntry(container, title, lines) {
    const card = document.createElement("div");
    card.className = "entry";
    const heading = document.createElement("h3");
    heading.textContent = title;
    card.appendChild(heading);

    lines.forEach(function (line) {
        const p = document.createElement("p");
        p.textContent = line;
        card.appendChild(p);
    });

    container.appendChild(card);
    return card;
}

function loadPosts() {
    const list = document.getElementById("postList");
    list.innerHTML = "";
    const posts = JPCS.list("jpcsAnnouncements");
    updateContentCounts();

    if (!posts.length) {
        list.textContent = "No announcements yet.";
        return;
    }

    posts.slice().reverse().forEach(function (post) {
        const card = addEntry(list, post.title, [
            post.date + " | " + (post.published === false ? "Draft" : "Published"),
            post.content || ""
        ]);

        if (post.image) {
            const image = document.createElement("img");
            image.src = post.image;
            image.alt = post.title;
            card.appendChild(image);
        }

        const buttons = document.createElement("div");
        buttons.className = "actions";
        buttons.appendChild(makeButton("Edit", function () {
            editingPostId = post.id;
            document.getElementById("postTitle").value = post.title;
            document.getElementById("postContent").value = post.content;
            document.getElementById("postPublished").checked =
                post.published !== false;
            document.getElementById("postMessage").textContent =
                "Editing: " + post.title;
            window.scrollTo(0, 0);
        }));
        buttons.appendChild(makeButton("Delete", function () {
            if (!confirm("Delete this announcement?")) return;
            const updated = JPCS.list("jpcsAnnouncements").filter(
                item => item.id !== post.id
            );
            if (saveItems("jpcsAnnouncements", updated)) {
                JPCS.log("Announcement deleted", post.title);
                loadPosts();
            }
        }));
        card.appendChild(buttons);
    });
}

function savePost(title, content, imageData, published) {
    const posts = JPCS.list("jpcsAnnouncements");
    const oldPost = posts.find(post => post.id === editingPostId);

    if (oldPost) {
        oldPost.title = title;
        oldPost.content = content;
        oldPost.published = published;
        if (imageData) oldPost.image = imageData;
    } else {
        posts.push({
            id: "ANN-" + Date.now(),
            title: title,
            content: content,
            published: published,
            image: imageData || "",
            date: new Date().toISOString().slice(0, 10)
        });
    }

    if (!saveItems("jpcsAnnouncements", posts)) {
        document.getElementById("postMessage").textContent =
            "Could not save announcement. Try a smaller image.";
        return;
    }

    JPCS.log("Announcement saved", title);
    editingPostId = null;
    document.getElementById("announcementForm").reset();
    document.getElementById("postMessage").textContent = "Announcement saved.";
    loadPosts();
}

document.getElementById("announcementForm").addEventListener(
    "submit",
    function (event) {
        event.preventDefault();
        const title = document.getElementById("postTitle").value.trim();
        const content = document.getElementById("postContent").value.trim();
        const imageFile = document.getElementById("postImage").files[0];
        const published = document.getElementById("postPublished").checked;

        if (!title || !content) return;

        if (!imageFile) {
            savePost(title, content, "", published);
            return;
        }

        if (!imageFile.type.startsWith("image/") || imageFile.size > 500000) {
            document.getElementById("postMessage").textContent =
                "Choose an image under 500 KB.";
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            savePost(title, content, reader.result, published);
        };
        reader.onerror = function () {
            document.getElementById("postMessage").textContent =
                "Could not read the image.";
        };
        reader.readAsDataURL(imageFile);
    }
);

document.getElementById("postCancel").addEventListener("click", function () {
    editingPostId = null;
    document.getElementById("announcementForm").reset();
    document.getElementById("postMessage").textContent = "";
});

function loadEvents() {
    const list = document.getElementById("eventList");
    const events = JPCS.list("jpcsEvents");
    list.innerHTML = "";
    updateContentCounts();

    if (!events.length) {
        list.textContent = "No events yet.";
        return;
    }

    events.slice().reverse().forEach(function (item) {
        const card = addEntry(list, item.title, [
            item.date + " | " + item.location,
            item.description,
            item.published === false ? "Draft" : "Published"
        ]);
        const buttons = document.createElement("div");
        buttons.className = "actions";
        buttons.appendChild(makeButton("Edit", function () {
            editingEventId = item.id;
            document.getElementById("eventTitle").value = item.title;
            document.getElementById("eventDate").value = item.date;
            document.getElementById("eventLocation").value = item.location;
            document.getElementById("eventDescription").value =
                item.description;
            document.getElementById("eventPublished").checked =
                item.published !== false;
            document.getElementById("eventMessage").textContent =
                "Editing: " + item.title;
        }));
        buttons.appendChild(makeButton("Delete", function () {
            if (!confirm("Delete this event?")) return;
            const updated = JPCS.list("jpcsEvents").filter(
                event => event.id !== item.id
            );
            if (saveItems("jpcsEvents", updated)) {
                JPCS.log("Event deleted", item.title);
                loadEvents();
            }
        }));
        card.appendChild(buttons);
    });
}

document.getElementById("eventForm").addEventListener(
    "submit",
    function (event) {
        event.preventDefault();
        const title = document.getElementById("eventTitle").value.trim();
        const date = document.getElementById("eventDate").value;
        const location = document.getElementById("eventLocation").value.trim();
        const description = document.getElementById("eventDescription").value.trim();
        const published = document.getElementById("eventPublished").checked;

        if (!title || !date || !location || !description) return;

        const events = JPCS.list("jpcsEvents");
        const existing = events.find(item => item.id === editingEventId);

        if (existing) {
            existing.title = title;
            existing.date = date;
            existing.location = location;
            existing.description = description;
            existing.published = published;
        } else {
            events.push({
                id: "EV-" + Date.now(),
                title: title,
                date: date,
                location: location,
                description: description,
                published: published
            });
        }

        if (!saveItems("jpcsEvents", events)) {
            document.getElementById("eventMessage").textContent =
                "Could not save event.";
            return;
        }

        JPCS.log("Event saved", title);
        editingEventId = null;
        document.getElementById("eventForm").reset();
        document.getElementById("eventMessage").textContent = "Event saved.";
        loadEvents();
    }
);

document.getElementById("eventCancel").addEventListener("click", function () {
    editingEventId = null;
    document.getElementById("eventForm").reset();
    document.getElementById("eventMessage").textContent = "";
});


// Moderator statistics show content only, not student records.
function updateContentCounts() {
    const posts = JPCS.list("jpcsAnnouncements");
    const events = JPCS.list("jpcsEvents");
    document.getElementById("postTotal").textContent = posts.length;
    document.getElementById("publishedPostCount").textContent =
        posts.filter(item => item.published !== false).length;
    document.getElementById("eventTotal").textContent = events.length;
    document.getElementById("publishedEventCount").textContent =
        events.filter(item => item.published !== false).length;
}

function showContentRecords(type) {
    JPCSRecords.showList(
        type,
        document.getElementById("statRecordsSection"),
        document.getElementById("statRecordsTitle"),
        document.getElementById("statRecordsTable"),
        document.getElementById("statRecordDetail")
    );
    document.getElementById("statRecordsSection").scrollIntoView();
}

document.querySelectorAll(".stat[data-records]").forEach(function (card) {
    card.addEventListener("click", function () {
        showContentRecords(card.dataset.records);
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

if (canModerate) {
    loadPosts();
    loadEvents();
    updateContentCounts();
}
