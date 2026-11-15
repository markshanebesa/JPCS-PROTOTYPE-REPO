// Shared staff access helpers (classroom demonstration only)
const JPCS = {
    list(key) {
        try {
            const items = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(items) ? items : [];
        } catch (error) {
            return [];
        }
    },

    session() {
        try {
            return JSON.parse(localStorage.getItem("jpcsMe") || "null");
        } catch (error) {
            return null;
        }
    },

    staff() {
        const session = this.session();
        if (!session) return null;

        const account = this.list("jpcsStaffUsers").find(function (user) {
            return user.email === session.email &&
                user.role === session.role &&
                user.active !== false;
        });

        return account || null;
    },

    require(allowedRoles) {
        const account = this.staff();
        if (!account || !allowedRoles.includes(account.role)) {
            window.location.replace("login.html");
            return false;
        }
        return true;
    },

    log(action, details) {
        const account = this.staff();
        if (!account) return;

        const entries = this.list("jpcsActivityLogs");
        entries.push({
            date: new Date().toLocaleString("en-PH"),
            email: account.email,
            role: account.role,
            action: action,
            details: String(details || "")
        });
        localStorage.setItem(
            "jpcsActivityLogs",
            JSON.stringify(entries.slice(-200))
        );
    },

    logout() {
        localStorage.removeItem("jpcsMe");
        window.location.replace("login.html");
    }
};

// The same navigation is shown on every page a role can access.
function showOfficerNavigation() {
    const nav = document.getElementById("officerNav");
    if (!nav) return;

    const account = JPCS.staff();
    if (!account) return;

    const linksByRole = {
        "moderator": [
            ["Content Management", "moderator.html"],
            ["Announcements", "moderator.html#announcements"],
            ["Events", "moderator.html#events"]
        ],
        "co-admin": [
            ["Co-Admin Panel", "co-admin.html"],
            ["Applications", "applications.html"],
            ["Members", "members.html"]
        ],
        "main-admin": [
            ["Admin Panel", "admin.html"],
            ["Applications", "applications.html"],
            ["Members", "members.html"],
            ["Co-Admin", "co-admin.html"],
            ["Content", "moderator.html"],
            ["Staff Accounts", "staff-users.html"],
            ["Reports", "organization-head.html"]
        ],
        "organization-head": [
            ["Reports", "organization-head.html"],
            ["Announcements", "organization-head.html#announcements"],
            ["Upcoming Events", "organization-head.html#events"]
        ]
    };

    nav.innerHTML = "";
    const links = linksByRole[account.role] || [];

    links.forEach(function (item) {
        const link = document.createElement("a");
        link.href = item[1];
        link.textContent = item[0];
        nav.appendChild(link);
    });

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.id = "logoutBtn";
    logoutButton.textContent = "Logout";
    nav.appendChild(logoutButton);
}

// roles.js is loaded at the bottom of every officer page,
// before that page's own JavaScript.
showOfficerNavigation();
