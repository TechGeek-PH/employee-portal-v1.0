# TechGeekPH Employee Portal Build

Generated on 2026-07-02 from the provided `employee/` folder.

## Active Pages

- `index.html` - employee login page
- `dashboard.html` - employee dashboard
- `application_form.html` - application form
- `clients.html` - clients
- `tickets.html` - tickets
- `nap-checker.html` - NAP checker
- `daily_time_record.html` - my time record
- `my_expense_request.html` - my expense request
- `payslip_generator.html` - payslip generator
- `consumable_stock.html` - consumable stock
- `404.html` - fallback page

## Sidebar Standard

The same employee sidebar block is used on all content pages.

Sidebar links:

- Dashboard
- Application Form
- Clients
- Tickets
- NAP Checker
- My Time Record
- My Expense Request
- Payslip Generator
- Consumable Stock

Admin-only links removed from the employee sidebar and dashboard actions:

- Statement of Account
- Admin Time Records
- Expense Approval
- Company Assets
- Investor pages

## Notes

- The pages use the existing `BACKEND_URL` from the source files.
- Employee login now stores `techgeekph_session`.
- `techgeekph_employee_session` is kept as an employee fallback key for older local sessions.
- Shared employee sidebar support files are in `assets/employee-shell.css` and `assets/employee-shell.js`.
