// Shared student and application record viewer.
// This file does not change a student's information.
// Used by Co-Admin, Main Admin, and Organization Head.

const JPCSRecords = {
    students() {
        return JPCS.list("jpcsUsers").filter(function (user) {
            return user.role === "student";
        });
    },

    applications() {
        return JPCS.list("jpcsApps");
    },

    status(app) {
        if (!app) return "Not Applied";

        let calendar = null;
        try {
            calendar = JSON.parse(
                localStorage.getItem("jpcsMembershipCalendar")
            );
        } catch (error) {
            calendar = null;
        }

        const now = new Date();
        const today = now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, "0") + "-" +
            String(now.getDate()).padStart(2, "0");

        if (calendar && calendar.membershipEndDate &&
            today >= calendar.membershipEndDate) {
            return "Inactive";
        }

        return app.status || "Pending";
    },

    findStudent(app) {
        if (!app) return null;

        const email = String(
            app.accountEmail || app.email || ""
        ).toLowerCase();
        const id = String(
            app.accountStudentId || app.studentId ||
            app.formData?.studentNo || ""
        );

        return this.students().find(function (student) {
            const matchEmail = email &&
                student.email?.toLowerCase() === email;
            const matchId = id &&
                String(student.studentId) === id;
            return matchEmail || matchId;
        }) || null;
    },

    findApplication(student) {
        if (!student) return null;

        const email = String(student.email || "").toLowerCase();
        const id = String(student.studentId || "");

        return this.applications().find(function (app) {
            const appEmail = String(
                app.accountEmail || app.email || ""
            ).toLowerCase();
            const appId = String(
                app.accountStudentId || app.studentId ||
                app.formData?.studentNo || ""
            );
            return (email && email === appEmail) ||
                (id && id === appId);
        }) || null;
    },

    fullName(student, app) {
        const f = app?.formData || {};
        return student?.name || app?.fullName || [
            f.firstname, f.middleInitial, f.surname
        ].filter(Boolean).join(" ") || "-";
    },

    // Show all fields entered in registration/membership application.
    // Account passwords are deliberately never displayed.
    detailFields(student, app) {
        const form = app?.formData || {};
        const name = String(student?.name || app?.fullName || "");
        const words = name.trim().split(/\s+/).filter(Boolean);

        const surname = form.surname || student?.surname ||
            (words.length > 1 ? words[words.length - 1] : "");
        const given = form.firstname || student?.givenName ||
            (words.length > 1 ? words.slice(0, -1).join(" ") : name);
        const middle = form.middleInitial || student?.middleInitial || "";
        const studentId = form.studentNo || app?.studentId ||
            student?.studentId || "";
        const email = form.email || app?.email || student?.email || "";
        const course = form.program || app?.course || student?.course || "";

        let yearLevel = form.yearLevel || "";
        let section = form.section || "";
        const yearSection = app?.yearSection || student?.yearSection || "";

        if (!yearLevel && !section && yearSection) {
            const match = yearSection.match(/^(.*\bYEAR)\s+(.+)$/i);
            if (match) {
                yearLevel = match[1];
                section = match[2];
            }
        }

        return [
            ["Surname", surname],
            ["Given Name", given],
            ["Middle Initial", middle],
            ["Student ID", studentId],
            ["Institutional Email", email],
            ["Program / Course", course],
            ["Year Level", yearLevel],
            ["Section", section],
            ["Year and Section", yearSection],
            ["Contact Number", student?.contact || app?.contact],
            ["Date of Birth", form.birthDate || app?.birthDate ||
                student?.birthDate],
            ["Gender", form.gender || app?.gender || student?.gender],
            ["Student Classification", student?.classification ||
                app?.classification],
            ["Application Type", form.applicationType ||
                app?.applicationType],
            ["Receipt Number", form.receiptNo || app?.receiptNo],
            ["Applicant Signature (Typed)", form.signature ||
                app?.signature],
            ["Date Signed", form.signedDate || app?.signedDate],
            ["Date Submitted", app?.date],
            ["Application Status", this.status(app)]
        ];
    },

    showDetails(container, student, app) {
        container.innerHTML = "";

        const grid = document.createElement("div");
        grid.className = "record-detail-grid";

        this.detailFields(student, app).forEach(function (item) {
            const cell = document.createElement("div");
            const label = document.createElement("strong");
            const value = document.createElement("p");

            label.textContent = item[0];
            value.textContent = item[1] || "-";

            cell.appendChild(label);
            cell.appendChild(value);
            grid.appendChild(cell);
        });

        container.appendChild(grid);
        container.hidden = false;
    },

    // Build a list when a statistics card is clicked.
    // For moderators this lists content, not private student records.
    showList(type, section, title, container, details, search) {
        const students = this.students();
        const applications = this.applications();
        const query = String(search || "").trim().toLowerCase();
        const rows = [];
        const contentTypes = [
            "posts", "published-posts", "events",
            "published-events", "upcoming-events"
        ];
        const contentMode = contentTypes.includes(type);
        let name = "Records";

        if (type === "students") {
            name = "Registered Students";
            students.forEach(student => rows.push({
                student: student,
                app: this.findApplication(student)
            }));
        } else if (contentMode) {
            const isPosts = type.includes("posts");
            const all = JPCS.list(
                isPosts ? "jpcsAnnouncements" : "jpcsEvents"
            );
            const publishedOnly = type.startsWith("published-") ||
                type === "upcoming-events";
            name = isPosts ? "Announcements" : "Events";
            if (publishedOnly) name = "Published " + name;
            if (type === "upcoming-events") name = "Upcoming Events";

            const today = new Date().toISOString().slice(0, 10);
            all.forEach(function (item) {
                const isVisible = !publishedOnly || item.published !== false;
                const isUpcoming = type !== "upcoming-events" ||
                    item.date >= today;
                if (isVisible && isUpcoming) {
                    rows.push({ content: item });
                }
            });
        } else {
            name = type === "all" ? "All Applications" :
                type + " Membership Applications";

            applications.forEach(app => {
                if (type === "all" || this.status(app) === type) {
                    rows.push({
                        student: this.findStudent(app),
                        app: app
                    });
                }
            });
        }

        title.textContent = name;
        container.innerHTML = "";
        details.innerHTML = "";
        details.hidden = true;

        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const tbody = document.createElement("tbody");
        const headerRow = document.createElement("tr");
        const headings = contentMode ?
            ["Title", "Date", "Status", "Action"] :
            ["Student ID", "Name", "Email", "Status", "Action"];

        headings.forEach(function (label) {
            const th = document.createElement("th");
            th.textContent = label;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        let shown = 0;
        rows.forEach(row => {
            const item = row.content;
            const student = row.student;
            const app = row.app;

            const values = contentMode ? [
                item.title || "Untitled",
                item.date || "-",
                item.published === false ? "Draft" : "Published"
            ] : [
                student?.studentId || app?.studentId || "-",
                this.fullName(student, app),
                student?.email || app?.email || "-",
                this.status(app)
            ];

            if (!values.join(" ").toLowerCase().includes(query)) {
                return;
            }
            shown++;

            const tr = document.createElement("tr");
            values.forEach(function (value) {
                const td = document.createElement("td");
                td.textContent = value;
                tr.appendChild(td);
            });

            const actionCell = document.createElement("td");
            const button = document.createElement("button");
            button.type = "button";
            button.className = "record-view-btn";
            button.textContent = "View Details";
            button.addEventListener("click", () => {
                if (contentMode) {
                    details.innerHTML = "";
                    const fields = [
                        ["Title", item.title],
                        ["Date", item.date],
                        ["Description", item.content || item.description],
                        ["Location", item.location],
                        ["Status", item.published === false ?
                            "Draft" : "Published"]
                    ];
                    fields.forEach(function (field) {
                        if (!field[1]) return;
                        const p = document.createElement("p");
                        p.textContent = field[0] + ": " + field[1];
                        details.appendChild(p);
                    });
                    details.hidden = false;
                } else {
                    this.showDetails(details, student, app);
                }
                details.scrollIntoView({ behavior: "auto" });
            });
            actionCell.appendChild(button);
            tr.appendChild(actionCell);
            tbody.appendChild(tr);
        });

        if (!shown) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = headings.length;
            td.textContent = "No records found.";
            tr.appendChild(td);
            tbody.appendChild(tr);
        }

        table.appendChild(thead);
        table.appendChild(tbody);
        container.appendChild(table);
        section.hidden = false;
    }
};
