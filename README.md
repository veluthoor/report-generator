# 🎉 AI Report Builder

Generate fun, engaging customer reports automatically from your business data.

## Features

- 📊 Upload CSV or Excel files
- 🤖 AI-powered column mapping
- ✨ Fun, shareable customer reports (not boring corporate summaries!)
- 🎯 Creative data storytelling with percentiles and comparisons
- 📧 Email distribution (coming soon)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Then add your Groq API key to `.env.local`:

```
GROQ_API_KEY=gsk_your_key_here
```

Get a free Groq API key at: https://console.groq.com

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

### Step 1: Upload
- Enter your business name and type
- Upload a CSV or Excel file with customer data

### Step 2: Map Columns
- Review AI's column mapping suggestions
- Adjust if needed (name, email, phone, transaction data, etc.)

### Step 3: Preview
- See a sample report for the first customer
- If it looks good, generate all reports!

## Data Format

Your file can have any columns, but should include:
- Customer name
- Contact info (email and/or phone)
- Transaction data (dates, amounts, services - optional but makes reports more fun!)

Example CSV:
```csv
Name,Email,Phone,Service,Date,Amount
Rajesh Kumar,rajesh@example.com,9876543210,Gym Membership,2024-11-01,500
Priya Sharma,priya@example.com,,Facial,2024-11-05,1500
```

## Tech Stack

- **Frontend**: Next.js 15 + React + TypeScript
- **Styling**: Tailwind CSS
- **AI**: Groq (Llama 3.3 70B)
- **File Processing**: Papa Parse (CSV) + SheetJS (Excel)
- **Deployment**: Vercel (recommended)

## Roadmap

- [x] File upload (CSV/Excel)
- [x] AI column mapping
- [x] Sample report preview
- [ ] Bulk report generation
- [ ] Email sending
- [ ] WhatsApp integration
- [ ] PDF export
- [ ] Scheduled reports

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/report-builder)

Remember to add your `GROQ_API_KEY` in Vercel environment variables!

## License

MIT
