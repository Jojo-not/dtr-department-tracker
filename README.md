# DTR Department Tracker

A modern Daily Time Record web application built with React, Tailwind CSS, Firebase Authentication, and Cloud Firestore.

## Features

- Email/password registration and login
- Employee profile with Employee ID + Position + Department
- One-click Time In and Time Out
- Realtime department-wide attendance board
- Everyone can see Time In / Time Out status for members of the same department
- Personal DTR history with date filtering
- Department attendance board with historical date filtering
- Responsive professional dashboard
- Firestore security rules scoped by department

## Firebase setup

1. Create a Firebase project in the Firebase Console.
2. Add a Web App to the project.
3. In Authentication, enable **Email/Password** sign-in.
4. Create a **Cloud Firestore** database.
5. Copy `.env.example` to `.env` and paste your Firebase web config values.
6. Replace your Firestore rules with the contents of `firestore.rules` and publish them.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

The generated `dist` folder can be deployed to Vercel, Firebase Hosting, Netlify, or another static host.

## Firestore data model

### users/{uid}

```js
{
  name,
  email,
  employeeId,
  position,
  department,
  role: "employee",
  createdAt
}
```

### attendance/{uid_YYYY-MM-DD}

```js
{
  uid,
  name,
  email,
  employeeId,
  department,
  dateKey: "YYYY-MM-DD",
  timeIn,
  timeOut,
  status: "IN" | "OUT",
  updatedAt
}
```

## Important production note

Registration includes a required **Position** field and uses a controlled Department dropdown with **BHROD-HRDD** and **OUHRODI**. For stricter production access, consider assigning department membership through an administrator or invitation code.

## Attendance integrity

The included Firestore rules prevent an employee from changing their original Time In timestamp and require Time In / Time Out timestamps to resolve to Firestore's server request time. For stricter production use, department membership can be assigned by an administrator or invitation code rather than relying only on the registration selection.


## Authentication enhancements

- Show/Hide Password controls are available on sign in and account registration.
- The **Forgot Password** link on the sign-in page sends a Firebase Authentication password reset email.
- Make sure Email/Password authentication is enabled in Firebase Console under **Authentication → Sign-in method**.

## Two-session DTR flow

Each employee can now record four attendance checkpoints per day in this exact order:

1. **AM Time In** – start of the morning work session.
2. **Lunch Time Out** – start of the lunch break.
3. **PM Time In** – return from lunch / start of the afternoon work session.
4. **Final Time Out** – end of the workday.

The dashboard and DTR logs calculate total worked time as **morning session + afternoon session**, so the lunch break is not included. Department members can see all four timestamps on the shared department board.

After updating the project, publish the included `firestore.rules` again because the attendance security rules now allow the four sequential checkpoints.

## Firestore permission fix (v1.1)

The first AM Time In no longer starts with a Firestore transaction read. The old flow tried to read today's attendance document before it existed, which produced a `BatchGetDocuments: permission-denied` error under the secure Firestore rules. The app now:

- creates the first AM Time In directly with `setDoc()`;
- advances Lunch Out, PM In, and Final Out with `updateDoc()`;
- relies on `firestore.rules` to enforce the correct checkpoint order;
- shows Firestore permission errors as a red error notice.

After replacing the project, publish the included rules once:

```bash
firebase deploy --only firestore:rules
```

## Accomplishment Report module

The application now includes a personal **Accomplishment Report** page with full CRUD functionality:

- Create a daily accomplishment with date, accomplishment/output, and optional remarks.
- View accomplishments grouped by a selected month.
- Edit existing entries.
- Delete entries after confirmation.
- Generate a clean **Monthly Accomplishment Report** with employee name, position, department/office, dates, DTR time logs, accomplishments, remarks, and signature areas.
- Use **Download Word Report** to create a Microsoft Word (`.docx`) file for the selected month.

### accomplishments/{documentId}

```js
{
  uid,
  name,
  email,
  employeeId,
  department,
  dateKey: "YYYY-MM-DD",
  accomplishment,
  accomplishmentHtml, // rich formatting for new/edited records
  remarks,
  createdAt,
  updatedAt
}
```

Accomplishment records are private to the employee who created them. Publish the updated `firestore.rules` before using the module:

```bash
firebase deploy --only firestore:rules
```

### DTR time log in Accomplishment Reports

The Accomplishment Report now automatically matches each accomplishment date with the employee's attendance record for the same day. The monthly list and downloadable Word report show **AM Time In, Lunch Time Out, PM Time In, Final Time Out, and total worked time**. These values are read from the existing `attendance` collection, so employees do not type their attendance times manually.

## Formal Accomplishment Report Word layout
The downloaded Microsoft Word report follows the provided formal Individual Daily Log and Accomplishment Report reference:
- A4 portrait layout using Times New Roman
- centered `INDIVIDUAL DAILY LOG AND ACCOMPLISHMENT REPORT (WORK FROM HOME)` heading
- Name, Position, Office, and automatically calculated Date/s Covered
- two-column table: `Date and Actual Time logs` and `Actual Accomplishments`
- automatic AM time-in, lunch time-out, PM time-in, and final time-out from DTR records
- accomplishment formatting preserved from the Word-style editor, including bullets, numbering, emphasis, headings, and alignment
- Submitted by and Attested by signature areas
- entries are ordered oldest-to-newest for the selected month

New accounts now save a required `position` value in the employee profile, and the formal Word template uses `profile.position` automatically. Existing profiles created before this update may still display a dash for Position until their profile data is updated. The template also supports `profile.office`, `profile.supervisorName`, and `profile.supervisorPosition` when those fields are available.

## Word-style Accomplishment editor and Microsoft Word download

The Accomplishment Report module now uses a Word-style rich-text editor instead of a plain textarea. Employees can format their daily accomplishment with:

- bold, italic, and underline;
- bullets and numbered lists;
- left, center, right, and justified alignment;
- paragraph/title/heading styles;
- undo, redo, and clear formatting.

The plain-text version is still stored in `accomplishment` for backward compatibility and list/search use. New and edited records also store sanitized rich text in `accomplishmentHtml`. Existing accomplishment records that do not have `accomplishmentHtml` continue to work and are automatically converted to simple paragraphs when edited or exported.

The previous browser print action is replaced by **Download Word Report**. The app generates a `.docx` file directly in the browser using the `docx` package. The Word report keeps the formal Individual Daily Log and Accomplishment Report layout, including employee name, position, office/department, Date/s Covered, DTR time logs, formatted accomplishments, remarks, and Submitted by / Attested by signature areas.

After installing this update, install the new dependency and republish Firestore rules:

```bash
npm install
firebase deploy --only firestore:rules
```

The updated Firestore rules allow the optional `accomplishmentHtml` field and increase the plain accomplishment limit to 5,000 characters while preserving ownership restrictions.

## On Leave / On Travel daily status

The dashboard now includes **On Leave** and **On Travel** actions. These statuses are intended for a whole day and can only be selected **before the employee records the first AM Time In**.

When selected:

- today's attendance record is saved with `status: "LEAVE"` or `status: "TRAVEL"`;
- AM Time In, Lunch Time Out, PM Time In, and Final Time Out are disabled for that day;
- the shared Department Board immediately shows **On Leave** or **On Travel**;
- My DTR Logs keeps the status as part of the employee's attendance history;
- the Accomplishment Word report displays **ON LEAVE** or **ON TRAVEL** instead of empty time punches when that date is included.

Publish the latest rules after installing this update:

```bash
firebase deploy --only firestore:rules
```

### Professional Leave / Travel confirmation
The dashboard uses a custom responsive confirmation modal for **On Leave** and **On Travel** instead of the browser's native `window.confirm()` dialog. The modal supports cancel/close, Escape-key dismissal, outside-click dismissal, and a saving/loading state.
