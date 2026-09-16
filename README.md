# DTR Department Tracker

A modern Daily Time Record web application built with React, Tailwind CSS, Firebase Authentication, and Cloud Firestore.

## Features

- Email/password registration and login
- Employee profile with Employee ID + Department
- One-click Time In and Time Out
- Realtime department-wide attendance board
- Everyone can see Time In / Time Out status for members of the same department
- Personal DTR history
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

The basic version uses a typed department name during registration. For a production organization, use controlled department IDs or invitation codes so users cannot join an arbitrary department by typing its name.

## Attendance integrity

The included Firestore rules prevent an employee from changing their original Time In timestamp and require Time In / Time Out timestamps to resolve to Firestore's server request time. For stricter production use, department membership should be assigned by an administrator or invitation code rather than typed freely at registration.
