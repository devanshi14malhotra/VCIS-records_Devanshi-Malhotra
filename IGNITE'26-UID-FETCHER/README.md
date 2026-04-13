# Ignite 2026 UID Tracker

This folder contains an isolated UID tracking tool for Ignite 2026.

## Files

- `index.php` - UI for searching participant details and tracking status.
- `tracker.css` - Styling that matches existing Synergy branding.
- `tracker.js` - Frontend logic for fetch and status update calls.
- `api.php` - Backend API (GET fetch and PUT update) for `2026_Participants`.
- `schema.sql` - SQL migration to add tracking columns.

## API Behavior

- `GET api.php?uid=<UID_or_EnrollmentNo>`
  - Returns participant details and current values of:
    - `Undertaking`
    - `CertificateIssued`
    - `Attendance`
    - `PrizeMoneySent`

- `PUT api.php`
  - JSON body:
    - `UID` (UID or EnrollmentNo)
    - `Undertaking` (0/1)
    - `CertificateIssued` (0/1)
    - `Attendance` (0/1)
    - `PrizeMoneySent` (0/1)

## Database Configuration

The API checks for database credentials in this order:

1. `synergy/config.php` constants: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`
2. Environment variables with the same names

## Setup

1. Run SQL migration in `schema.sql` once.
2. Ensure DB credentials are available from `synergy/config.php` or env vars.
3. Open `ignite_2026_uid_fetcher/index.php` in your PHP-hosted environment.

## Notes

- This tool is isolated and does not modify existing registration pages.
- The UI supports both UID and Enrollment Number based lookup.
