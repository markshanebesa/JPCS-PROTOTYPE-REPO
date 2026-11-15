JPCS–PTC RECORDS AND CLICKABLE STATISTICS UPDATE

This package preserves the earlier five-role JPCS–PTC website.
The design and existing site pages remain in place.

CLICKABLE CARDS
- Main Admin (admin.html): Registered Students, Total Applications,
  Pending, Active, Inactive. Click a card, then View Details.
- Co-Admin (co-admin.html): Students, Pending, Active, Inactive.
  Click a card, then View Details.
- Organization Head (organization-head.html): Registered Students,
  Pending, Active, Inactive, plus application / announcement / event
  summary buttons. This role is view-only.
- Moderator (moderator.html): Announcements, Published, Events,
  Published Events. Content only, NOT private student records.
- Applications (applications.html) and Members (members.html):
  Statistics cards filter the list. Click a row's View button to
  display its complete submitted membership information.

FULL RECORD FIELDS
Surname, Given Name, Middle Initial, Student ID, Institutional Email,
Course, Year Level, Section, Year and Section, Contact, Birth Date,
Gender, Student Classification, Application Type, Receipt No,
Typed Signature, Date Signed, Date Submitted and Membership Status.
If a student has not submitted a membership application, fields
specific to a submitted application show a dash (-).
No account passwords are shown in the record viewer.

EDITING
- Co-Admin can view and edit registered student information and,
  where an application exists, its saved membership form fields.
- Main Admin can also open detailed records on the Admin dashboard,
  Applications and Members pages, and Staff Accounts.
- Organization Head cannot edit or approve.
- Moderator cannot view personal membership records.

NEW FILES
- js/record-details.js: shared basic record display functions.
- css/record-details.css: basic styling for cards and record details.

IMPORTANT
This is a classroom localStorage prototype. Students and officers
must use the same browser + site origin to share saved records.
Role checks in browser JavaScript are not secure access control for
real student data. A production system needs server-side permissions,
a database and secure authentication.

TO INSTALL
1. Extract the ZIP and open JPCS-PTC in VS Code.
2. Open login.html using Live Server.
3. Log in using the officer account matching the page you wish to test.
4. Click a statistics card and View Details.
5. Reload with Ctrl+F5 if the previous JavaScript is cached.

No old student records should be cleared or reset as part of this update.
