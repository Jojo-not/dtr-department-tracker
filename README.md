# DTR Department Tracker

A modern Daily Time Record web application built with React, Tailwind CSS, Firebase Authentication, and Cloud Firestore.

## Features

- Email/password registration and login
- Employee profile with Employee ID + Department
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

Registration uses a controlled Department dropdown with **BHROD-HRDD** and **OUHRODI**. For stricter production access, consider assigning department membership through an administrator or invitation code.

## Attendance integrity

The included Firestore rules prevent an employee from changing their original Time In timestamp and require Time In / Time Out timestamps to resolve to Firestore's server request time. For stricter production use, department membership can be assigned by an administrator or invitation code rather than relying only on the registration selection.


## Authentication enhancements

- Show/Hide Password controls are available on sign in and account registration.
- The **Forgot Password** link on the sign-in page sends a Firebase Authentication password reset email.
- Make sure Email/Password authentication is enabled in Firebase Console under **Authentication → Sign-in method**.
