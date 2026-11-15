JPCS-PTC OFFICER LOGIN AND LOGO FIX (NOV 14, 2026)
================================================
1. Open the JPCS-PTC folder in VS Code and start Live Server.
2. Open login.html (do not open the old ZIP/project copy).
3. Four officer demo accounts are automatically prepared on first open.
4. Log in with email/password from the SEPARATE private credentials file.
5. JPCS login logo now uses assets/jpcs_logo_transparent.png (relative path).
6. No changes were made to your membership application and printing functions.

If you use another URL or port (e.g., 127.0.0.1:5500 vs :5501),
localStorage is separate. Login still auto-creates the demo accounts.
If the test browser previously changed an officer password, it is preserved
on later logins. To reinitialize demo accounts on THIS origin only,
run localStorage.removeItem("jpcsDemoOfficersReadyV2") then refresh login.html.

WARNING: The four passwords are intentionally present in the client-side
JavaScript to make the classroom demo self-contained. Not secure for real
student information. Use a backend server with password hashing and
server-side role permissions for production.
