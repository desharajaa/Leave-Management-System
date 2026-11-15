# LeaveFlow – Leave Management System

A beginner-friendly full-stack leave management application using React, Node.js, Express and MongoDB.

## Features

### Employee
- Register and sign in through the Employee portal.
- Apply for Casual Leave and Medical Leave.
- View total, used and available leave days.
- View request status: Pending, Approved or Rejected.
- Read the manager's comment/rejection reason.

### Manager
- Separate Manager sign-in.
- View all employee leave requests.
- Filter requests by status.
- Approve requests or reject them with a mandatory reason.
- View previous decisions and comments.

## Folder structure

```text
LeaveManagementSystem/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── main.jsx
│       ├── styles.css
│       └── components/
│           ├── AuthPage.jsx
│           ├── EmployeeDashboard.jsx
│           └── ManagerDashboard.jsx
├── server/
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── models/
│   │   ├── Leave.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── leaveRoutes.js
│   ├── scripts/seedManager.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── .gitignore
├── package.json
└── README.md
```

## Requirements

Install:
1. Node.js LTS (includes npm).
2. MongoDB Community Server running locally, OR a MongoDB Atlas connection string.
3. Visual Studio Code.

## Run in VS Code – step by step

### Step 1: Extract and open
1. Extract `LeaveManagementSystem.zip`.
2. Open VS Code.
3. Select **File → Open Folder**.
4. Select the extracted `LeaveManagementSystem` folder.

### Step 2: Configure MongoDB and backend
1. Open the `server` folder.
2. Copy `.env.example` and rename the copy to `.env`.
3. Open `server/.env` and set your MongoDB connection string.

For local MongoDB, use:
```env
MONGO_URI=mongodb://127.0.0.1:27017/leave_management
```

For MongoDB Atlas, replace it with your own Atlas connection string. Add your database username/password and database name. Do not share your `.env` file or commit it to GitHub.

Set a long random JWT secret. Example development-only values are already shown in `.env.example`; change them before real use.

### Step 3: Install packages
Open VS Code terminal (**Terminal → New Terminal**) at the project root and run:

```bash
npm install
npm run install-all
```

### Step 4: Create the manager account
Open a terminal in the project root and run:

```bash
npm run seed:manager --prefix server
```

Default development manager credentials:
- Email: `manager@example.com`
- Password: `Manager@123`

You can change these in `server/.env` before running the seed command. Run the seed command again after changing them. Keep the manager credentials private.

### Step 5: Start backend and frontend
From the project root:

```bash
npm run dev
```

This starts:
- Backend API: `http://localhost:5000`
- React frontend: `http://localhost:5173`

Open `http://localhost:5173` in Chrome.

If you prefer separate terminals:
- Terminal 1: `cd server` then `npm run dev`
- Terminal 2: `cd client` then `npm run dev`

### Step 6: Test the application
1. Open the website.
2. Choose **Create an account** and register an employee.
3. Sign out.
4. Choose **Manager** on the login page and sign in using the manager credentials above.
5. Approve or reject the employee's leave request. A rejection reason is required.
6. Sign out and log back in as the employee to see the updated status and manager comment.

## Leave balance rules in this starter project

- Default annual quota: 12 Casual Leave days and 10 Medical Leave days per employee.
- Only Approved requests count as used leave.
- Pending and Rejected requests do not reduce the available balance.
- Requests are counted in calendar days (weekends included).
- Leave requests cannot start in the past or overlap an existing Pending/Approved request.
- The quotas are starter defaults. Change `casualLeaveQuota` and `medicalLeaveQuota` in `server/models/User.js` to match your organization's policy.

## Common problems

- **MongoDB connection error:** Make sure MongoDB Community Server is running, or verify the Atlas URI, database user/password and network access list.
- **Port 5000 already in use:** Stop the other server using that port, or change `PORT` in `server/.env`.
- **Frontend cannot connect:** Start the backend first and check `http://localhost:5000/api/health`.
- **Manager login fails:** Run `npm run seed:manager --prefix server` after setting `server/.env`.
- **Packages missing:** Run `npm run install-all` from the project root.

## Important

This is a learning/starter application. Before production use, add HTTPS, stronger password policy, rate limiting, audit logs, organization-specific holiday/weekend rules, and deployment secrets management.
