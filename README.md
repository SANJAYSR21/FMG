# Freight Contract Lifecycle Management System (Frontend Demo)

This is a static, responsive frontend demo built with HTML, Bootstrap, and jQuery. It contains multiple pages and dummy data — no backend.

Files:
- `index.html` — Login page
- `dashboard.html` — Dashboard and navigation
- `contract_management.html` — Contracts table with Create/Edit/View modals
- `approval_workflow.html` — Approvals list with Approve/Reject
- `compliance_audit.html` — Compliance logs and CSV report generation
- `renewal_alerts.html` — Upcoming renewals list
- `user_profile.html` — View/update profile
- `assets/css/style.css` — Small custom styles
- `assets/js/app.js` — jQuery logic and dummy data

How to use:
1. Open `index.html` in a browser (double-click or use a local static server).
2. Login using one of the demo accounts below (username / password / role). The application only accepts these demo credentials:

- `admin` / `admin123` / `Admin`
- `legal` / `legal123` / `Legal`
- `ops` / `ops123` / `Operations`
- `user` / `user123` / `User`

3. After login, you'll be redirected based on role.
3. Explore pages via the navigation bar. All actions are client-side and use dummy data.

Notes:
- Built using Bootstrap 5 and jQuery 3 from CDN.
- No backend or persistence beyond `localStorage` for demo profile info.
