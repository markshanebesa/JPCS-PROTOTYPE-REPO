JPCS-PTC: FIVE USER ROLES
========================

User Role             Landing Page             Permissions
---------------------------------------------------------------
Student               dashboard.html           Apply, edit own profile, view content
Moderator             moderator.html           Publish/edit announcements and events
Co-Admin              co-admin.html            Applications, member records, approval
Main Admin            admin.html               Full admin, schedule, accounts, content
Organization Head     organization-head.html   Read-only statistics and reports

OFFICER DEMO LOGIN (AUTOMATIC)
Four demo officer accounts are created when login.html is opened for the
first time in your browser. There is NO separate installer step.
Email/password reference is supplied outside the JPCS-PTC website folder.
These default credentials are for classroom testing only.

FILES ADDED OR UPDATED
- login.html and js/login.js auto-create demo officer logins on first open.
- login.html fixes JPCS logo path for Live Server subfolders.
- admin.html and js/admin.js are Main Admin only.
- applications.html/js/applications.js and members.html/js/members.js
  allow Co-Admin and Main Admin.
- moderator.html/js/moderator.js: announcements and events.
- co-admin.html/js/co-admin.js: membership management, student editing.
- organization-head.html/js/organization-head.js: read-only reports.
- staff-users.html/js/staff-users.js: Main Admin account management/logs.
- js/roles.js and css/staff.css support the simple officer pages.
- announcements.html/js/announcements.js show published posts/events.
- membership.html reminds the student to bring a COR and printed form.

CAUTION
This uses browser localStorage, not an actual server/database.
Users on different browsers/devices do not share changes.
It is not safe to use for actual student personal information.
Use backend authentication, password hashing and server-side role checks
before deploying to real students.
