# AFG Part Procurement Request App

A simple Next.js web app that lets a technician fill out and submit a parts
request form. On submission it generates a PDF and emails it to a configured
list of recipients.

---

## Quick Start (local development)

```bash
# 1. Install dependencies
npm install

# 2. Copy the example environment file and fill in your values
cp .env.example .env.local

# 3. Start the development server
npm run dev
# Open http://localhost:3000
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and set the following:

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes | API key from [resend.com](https://resend.com) |
| `EMAIL_FROM` | Yes | Sender address (must be verified in Resend) |
| `EMAIL_RECIPIENTS` | Yes | Comma-separated list of recipient emails |

Example:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=parts@yourdomain.com
EMAIL_RECIPIENTS=manager@yourdomain.com,ops@yourdomain.com
```

> **Tip:** If you prefer Nodemailer / SMTP instead of Resend, replace the
> email-sending logic in `pages/api/submit.js` (the `resend.emails.send()`
> call) with `nodemailer.createTransport(...).sendMail(...)`.

---

## Customising the Form

### Dropdown values

All dropdown options are defined as arrays near the top of `pages/index.js`:

```js
const TRAINING_CENTERS = ['DFW2', 'ATL1', ...];
const SIMULATORS = ['Select Simulator', 'SIM-01', ...];
const PRIORITIES = ['D - General Item', 'A - Aircraft On Ground (AOG)', ...];
```

Edit these arrays to add, remove, or rename options.

### Email recipients

Recipients can be configured two ways:

1. **Environment variable (recommended):**
   ```
   EMAIL_RECIPIENTS=alice@example.com,bob@example.com
   ```

2. **Hard-coded fallback:** Edit the `HARDCODED_RECIPIENTS` array in
   `pages/api/submit.js`.

### PDF layout

The PDF is generated in `lib/generatePdf.js` using
[pdf-lib](https://pdf-lib.js.org/). Edit that file to change the layout,
add a logo, or change fonts/colours.

---

## Deploying to Vercel

1. Push this repository to GitHub (or connect the existing repo).
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add environment variables in **Settings → Environment Variables**.
4. Deploy — Vercel auto-detects Next.js.

> The `vercel.json` file in the project root already sets `"framework": "nextjs"`.

---

## Project Structure

```
/
├── lib/
│   └── generatePdf.js      # PDF generation (pdf-lib)
├── pages/
│   ├── _app.js             # Next.js App wrapper
│   ├── index.js            # Parts request form (UI)
│   └── api/
│       └── submit.js       # API route: parse → PDF → email
├── styles/
│   ├── globals.css         # Global CSS reset
│   └── form.module.css     # Form styles
├── .env.example            # Environment variable template
├── next.config.js
├── package.json
└── vercel.json
```

---

## Tech Stack

| Purpose | Library |
|---|---|
| Framework | [Next.js](https://nextjs.org) 15 |
| PDF generation | [pdf-lib](https://pdf-lib.js.org/) |
| Email | [Resend](https://resend.com) |
| File upload parsing | [formidable](https://github.com/node-formidable/formidable) |
