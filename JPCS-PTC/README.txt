JPCS - PTC WEBSITE PROTOTYPE
===========================

Run index.html or login.html with VS Code Live Server.
Students register using signup.html and their institutional email.

FIVE ROLES
Student, Moderator, Co-Admin, Main Admin, Organization Head.
Please read ROLE-SETUP-README.txt for the role access guide.

OFFICER ACCOUNTS
A separate PRIVATE package contains all four staff accounts and the
one-time account installer. These details are NOT included in the
public website folder. Follow the private START-HERE.txt first.

CHANGES IN THIS VERSION
- Login now routes accounts by role.
- Main Admin: admin.html and staff-users.html.
- Moderator: moderator.html.
- Co-Admin: co-admin.html, applications.html, members.html.
- Organization Head: organization-head.html, viewing only.
- Student: dashboard.html, membership.html and other student pages.
- Student membership page reminds students to bring their Certificate
  of Registration and printed form to the organization.

IMPORTANT
This is a localStorage classroom prototype, not a production website.
Records do not synchronize across different browsers or devices.
Real student records require a secure backend, access controls,
password hashing and a database.
