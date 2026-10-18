# QA Playground · Authentication & Validation Rules Specification

## 1. Overview
This document specifies the user interface elements, internal constraints, validation rules, trigger timing, duplicate email prevention, and error-handling behaviors for Authentication (Login and Account Creation) in **QA Playground**.

---

## 2. UI Elements Specification

| Component | Element / Attribute | Behavior & State | `data-testid` |
|---|---|---|---|
| **Card Container** | `<div className="auth-card">` | Centered responsive card with theme-aware background | `login-card` |
| **Theme Toggle** | `<button className="theme-toggle-btn">` | Switches between dark and light themes | `theme-toggle` |
| **Full Name Field (Register)** | `<input type="text">` | Required in register mode; min 2 chars | `register-name` |
| **Email / Username Field** | `<input type="text">` (login) / `<input type="email">` (register) | Login accepts an email **or** a username; register requires an email. Spaces auto-trimmed. Hidden length limit of 254 chars. | `login-email` |
| **Email Inline Error** | `<span className="field-error-message">` | Rendered immediately under input when touched & invalid | `login-email-error` |
| **Password Field** | `<input type="password\|text">` | Masked by default, controlled by toggle button. Hidden limit 8–20 chars **in register mode only**; login accepts any non-empty password. | `login-password` |
| **Password Toggle** | `<button type="button">` | Switches input type between `password` and `text`, updates ARIA label | `login-password-toggle` |
| **Password Inline Error** | `<span className="field-error-message">` | Rendered immediately under input when touched & invalid | `login-password-error` |
| **General Error Area** | `<div className="alert alert-danger">` | Displays API errors, bad credentials, duplicate email (409), or lockout | `login-error` |
| **Submit Button** | `<button type="submit">` | Shows spinner and text ("Signing in..." / "Creating account...") when submitting; disabled while submitting | `login-submit` |
| **Create Account Link** | `<button className="auth-link-btn">` | Switches form into account registration mode | `create-account-link` |
| **Sign In Link (in Register)** | `<button className="auth-link-btn">` | Switches back to sign in mode | `switch-to-login` |
| **CAPTCHA Checkbox** | `<button className="captcha-card-widget">` | Anti-bot verification challenge | `login-captcha` |
| **Pre-configured Credentials** | Quick seed buttons | Quick-fills Admin or User test credentials in Login mode | `fill-admin-creds`, `fill-user-creds` |

---

## 3. Validation Rules Matrix

### Field 1: Email / Username
- **Required:** Yes. Cannot be empty or purely whitespace.
  - *Error message on empty:* `"Email or username is required"` (login) / `"Email is required"` (register)
- **Format Validation:**
  - `POST /api/auth/login` accepts an email address **or** a username (it matches on `LOWER(email)` or `LOWER(name)`), so the login form must accept both. Registration always creates an email-addressed account and therefore stays email-only.
  - **Login mode:** a value containing `@` is checked against the email pattern below. A value without `@` is treated as a username: min 2 chars, matching `/^[a-zA-Z0-9][a-zA-Z0-9 ._'-]*$/` (names may contain spaces, e.g. `Admin User`).
    - *Error message on invalid identifier:* `"Invalid email or username"`
  - **Register mode:** standard RFC 5322 regex pattern check: `/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/`
    - *Error message on invalid format:* `"Invalid email format"`
- **Whitespace Handling:**
  - Leading and trailing spaces are automatically trimmed (`email.trim()`) before validation and before the API payload is constructed.
- **Casing:**
  - Evaluated case-insensitively; the backend normalizes the identifier, so `ADMIN`, `admin` and `Admin User` all resolve to the same account. The register payload is normalized with `.toLowerCase()`; the login identifier is sent trimmed but with its original casing.
- **Maximum Length:**
  - Hard internal constraint via `maxLength="254"` on the input DOM element (RFC 5321 standard maximum for email addresses) and internal length verification. No visual clutter counter displayed.

### Field 2: Password
- **Required:** Yes. Cannot be empty. Applies in **both** modes.
  - *Error message on empty:* `"Password is required"`
- **Strength rules apply in register mode only.** Length and complexity describe how a password may be *chosen*; enforcing them at sign-in would lock out any account whose password predates the current policy (for example one created directly through the API, which accepts 6+ characters). Login therefore validates only that a password was entered and lets the backend decide.
- **Minimum Length (Register Mode):**
  - Minimum constraint: **8 characters**.
  - *Error message if < 8:* `"Password must be at least 8 characters"`
- **Maximum Length (Register Mode):**
  - Maximum constraint: **20 characters**.
  - Hard internal constraint via `maxLength="20"` on the DOM element and internal validation. No visual clutter counter displayed. In login mode `maxLength` is **not** set, so a longer existing password is not silently truncated.
  - *Error message if > 20:* `"Password cannot exceed 20 characters"`
- **Complexity (Register Mode):**
  - Requires uppercase letter, lowercase letter, number, and special character (`@$!%*?&#`).
  - *Error message:* `"Password must include uppercase, lowercase, number, and special character"`
- **Whitespace Handling:**
  - Spaces are **not** stripped, preserving passphrases.
- **Visibility:**
  - Masked (`type="password"`) by default.
  - Toggle button switches state between text and password without losing focus.

### Field 3: Full Name (Account Creation)
- **Required:** Yes.
  - *Error message on empty:* `"Name is required"`
  - *Minimum Length:* 2 characters (`"Name must be at least 2 characters"`)

---

## 4. Duplicate Account Prevention (Same Email Rule)

- **Database-Level Guard:** The backend database schema defines email uniqueness on the `users` table:
  `SELECT id FROM users WHERE email = ?` (using normalized `email.trim().toLowerCase()`).
- **Duplicate Detection (409 Conflict):**
  If a user attempts to create an account with an email that is already registered:
  1. Backend returns HTTP status `409 Conflict` with `errorCode: 'DUPLICATE_EMAIL'`.
  2. Frontend catches this response and sets:
     - General alert banner: `"Email already registered. Please sign in or use a different email."`
     - Inline email field error: `"Email already in use"`
     - Automatically returns keyboard focus to the email input field.
  3. No duplicate account is created; the database integrity is strictly maintained.

---

## 5. When Validation Runs (Progressive UX Strategy)

1. **Initial Typing (Pre-blur):**
   - **Silent.** No error message is shown while the user is actively typing for the very first time.
2. **On Blur (`onBlur`):**
   - Sets the field's `touched` state to `true`.
   - Runs validation and displays the inline error if the field is empty or fails format/length rules.
3. **Subsequent Typing (`onChange`):**
   - If the field is already `touched` (or currently has an error), validation re-runs on every keystroke.
   - Provides **immediate positive feedback**, clearing the error message as soon as the criteria are satisfied.
4. **On Submit (`onSubmit`):**
   - Marks all fields as `touched`.
   - Validates all fields simultaneously.
   - Prevents form dispatch if any error exists.
   - Shifts keyboard focus directly to the first invalid field.
