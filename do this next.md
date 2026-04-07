# Washbuddy Features Execution Plan

*Resume from here tomorrow!*

## 1. Database Initialization (SQLite)
- [ ] Create a `.env` file in the root of the project containing: `DATABASE_URL="file:./dev.db"`
- [ ] Open a terminal and run `npx prisma db push --force-reset` to initialize the database with SQLite.
- [ ] Run `npx prisma generate` to refresh the Prisma Client.
- [ ] *Optional:* Update `src/lib/auth.ts` or the database to allow login with the `2026` admin password.

## 2. Job Creation & License Scanner
- [ ] Build a server action file (`src/app/actions/job.ts`) for securely creating jobs and parsing services.
- [ ] Create the Job Creation UI component and route with form inputs for:
  - Customer Name
  - Registration Number
  - Phone Number
  - Vehicle Type
  - Services & Extras (with auto-calculating total).
- [ ] Integrate `Tesseract.js`. Add an upload button to the form to capture an image of the SA license disk. Use client-side OCR to extract the registration number and auto-fill the field.

## 3. Active Job Tracking & Payments
- [ ] Build the active tracking board UI with four visual columns representing statuses: `IN_QUEUE`, `WASH_BAY`, `FINISHING_BAY`, and `COMPLETED`.
- [ ] Add a "Next Step" button to cards that fires a server action to advance the status.
- [ ] Build a dynamic Payment Modal. When a job enters `COMPLETED`, prompt the user to choose `CASH` or `CARD` and save this value to the database.

## 4. WhatsApp & Reports Integration
- [ ] Add a "Text Customer" button on completed cards that triggers WhatsApp Web:
  - `https://wa.me/<PhoneNumber>?text=Hi%20<CustomerName>,%20your%20vehicle%20(<RegNumber>)%20is%20ready.`
- [ ] Build a Reports Dashboard pulling data from the Prisma `QueueItem` schema.
  - Query jobs completed `today` for daily totals.
  - Query all jobs to show all-time cache/card/revenue totals.
