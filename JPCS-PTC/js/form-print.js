// JPCS–PTC official membership form viewer / printer.
// The image is the original form, and every field is positioned relative
// to that exact image (928 x 1200). No other website code is changed.
(function () {
    "use strict";

    // Resolve relative to THIS script, not the blank popup window.
    const scriptURL = document.currentScript && document.currentScript.src;
    const imageURL = new URL("../assets/jpcs-membership-form-official.png", scriptURL || location.href).href;

    function stored(key, fallback) {
        try {
            const result = JSON.parse(localStorage.getItem(key));
            return result == null ? fallback : result;
        } catch (error) { return fallback; }
    }

    function findApplication() {
        const user = stored("jpcsMe", null);
        const apps = stored("jpcsApps", []);
        if (!user || !Array.isArray(apps)) return null;
        const email = String(user.email || "").trim().toLowerCase();
        const studentId = String(user.studentId || "").trim();
        return apps.find(app =>
            (email && email === String(app.accountEmail || app.email || "").trim().toLowerCase()) ||
            (studentId && studentId === String(app.accountStudentId || app.studentId || "").trim())
        ) || null;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, c => ({
            "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
        })[c]);
    }

    function openForm(mode) {
        const app = findApplication();
        if (!app) { alert("No submitted membership application found."); return; }
        const d = app.formData || {};
        const get = (key, fallback="") => d[key] || app[key] || fallback;
        const user = stored("jpcsMe", {});
        const fullname = String(app.fullName || user.name || "").trim();
        const nameParts = fullname.split(/\s+/);
        const surname = get("surname", user.surname || "");
        const firstname = get("firstname", user.givenName || "");
        const middle = get("middleInitial", user.middleInitial || "");
        const studentNo = get("studentNo", app.studentId || user.studentId || "");
        const email = get("email", app.email || app.accountEmail || user.email || "");
        const yearSection = String(app.yearSection || user.yearSection || "").trim();
        const yearLevel = get("yearLevel", yearSection.split(/\s+/)[0] || "");
        const section = get("section", yearSection.split(/\s+/).slice(1).join(" "));

        // Exact percentage coordinates of the BLANK spaces on the uploaded image.
        // Image width 928 px, height 1200 px. Labels stay visible above the entries.
        const fields = [
            [surname,       14.5, 46.3, 22.0],
            [firstname,     38.6, 46.3, 23.5],
            [middle,        63.6, 46.3, 22.5],
            [get("program", app.course || user.course || "BSIT"), 14.5, 51.8, 22.0],
            [yearLevel,     38.6, 51.8, 23.5],
            [section,       63.6, 51.8, 22.5],
            [email,         14.5, 56.8, 47.0, "email"],
            [studentNo,     63.6, 56.8, 22.5],
            [get("birthDate", user.birthDate || ""), 14.5, 62.3, 22.0],
            [get("receiptNo"), 63.6, 62.3, 22.5],
            [get("signature", fullname), 14.5, 73.6, 33.5],
            [get("signedDate"), 51.2, 73.6, 34.0]
        ];
        const fieldHTML = fields.map(([value,x,y,w,kind]) =>
            `<div class="entry ${kind || ""}" style="left:${x}%;top:${y}%;width:${w}%">${escapeHTML(value).toUpperCase()}</div>`
        ).join("");
        const gender = String(get("gender", user.gender || "")).trim().toLowerCase();
        const checkHTML = gender === "male"
            ? '<span class="check" style="left:39.2%;top:60.8%">✓</span>'
            : gender === "female"
                ? '<span class="check" style="left:39.2%;top:62.3%">✓</span>'
                : "";

        const popup = window.open("", "_blank");
        if (!popup) { alert("Please allow pop-ups for this website."); return; }
        popup.document.open();
        popup.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>JPCS–PTC Membership Application</title><style>
*{box-sizing:border-box}
body{margin:0;background:#e8e8e8;font-family:Arial,sans-serif}
.toolbar{padding:12px;text-align:center;background:#064e35}
.toolbar button{background:#f5e729;color:#064e35;border:0;border-radius:5px;padding:11px 20px;font-weight:bold;cursor:pointer}
.toolbar p{margin:7px 0 0;color:#fff;font-size:12px}
.page{position:relative;width:min(928px,100%);aspect-ratio:928 / 1200;margin:15px auto;background:white;container-type:inline-size}
.template{display:block;width:100%;height:100%}
.entry{position:absolute;font-size:clamp(7px,1.25cqw,12px);font-weight:600;line-height:1.15;color:#111;overflow-wrap:anywhere;word-break:normal}
.entry.email{font-size:clamp(6px,1.05cqw,10px)}
.check{position:absolute;font-size:clamp(10px,1.5cqw,15px);font-weight:bold;line-height:1}
.error{display:none;text-align:center;color:#a00000;background:#fff2f2;padding:15px}
@page{size:letter portrait;margin:0}
@media print{
 body{background:#fff}
 .toolbar,.error{display:none!important}
 .page{width:100%;margin:0;break-inside:avoid}
 .entry{font-size:1.25cqw}
 .entry.email{font-size:1.05cqw}
}
</style></head><body>
<div class="toolbar"><button type="button" onclick="window.print()">Print / Save as PDF</button><p>For PDF, choose “Save as PDF” in the print dialog.</p></div>
<div class="error" id="formError">The official form image could not be loaded. Check assets/jpcs-membership-form-official.png.</div>
<div class="page"><img id="template" class="template" src="${escapeHTML(imageURL)}" alt="Official JPCS membership application form">${fieldHTML}${checkHTML}</div>
</body></html>`);
        popup.document.close();
        const image = popup.document.getElementById("template");
        const ready = () => {
            if (mode !== "view") {
                popup.focus();
                popup.print();
            }
        };
        const failed = () => { popup.document.getElementById("formError").style.display = "block"; };
        if (image.complete) image.naturalWidth ? ready() : failed();
        else {
            image.addEventListener("load", ready, {once:true});
            image.addEventListener("error", failed, {once:true});
        }
    }

    // Capture existing buttons BEFORE the older table-based membership.js handlers.
    document.addEventListener("click", function (event) {
        const button = event.target.closest("button");
        if (!button) return;
        const mode = {viewBtn:"view", printBtn:"print", pdfBtn:"pdf"}[button.id];
        if (!mode) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        openForm(mode);
    }, true);
})();
