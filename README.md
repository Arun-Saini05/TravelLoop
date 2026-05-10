# Traveloop 🌍✈️

**Traveloop** is a personalized, multi-city travel planning web application. It lets users dream, design, and organize trips end-to-end — from picking cities and activities, to tracking budgets, packing checklists, sharing itineraries, and writing trip journals.

---

## 🚀 Key Features

*   **Interactive Itinerary Builder:** Plan your trips day by day, city by city.
*   **Dynamic Packing Checklist:** Stay organized with a fully interactive packing checklist linked directly to your active trips.
*   **Profile Management:** Update your details and instantly preview your locally-saved profile photo avatars.
*   **Budgeting:** Track travel expenses across different categories (flights, meals, activities).
*   **Community:** Share your best trip moments and engage with others' experiences.

---

## 🛠 Tech Stack

*   **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Custom CSS Modules (for highly tailored, dynamic themes)
*   **Database:** PostgreSQL via Supabase
*   **ORM:** Prisma
*   **Authentication:** better-auth
*   **Integrations:** Google Places API (for cities & activities)

---

## 💻 Getting Started

To get a local copy up and running, follow these simple steps:

### Prerequisites

Ensure you have Node.js and npm installed on your machine.
You will also need a Supabase PostgreSQL instance for your database.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Arun-Saini05/TravelLoop.git
   cd TravelLoop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add your environment variables based on the project requirements:
   ```env
   DATABASE_URL="your-supabase-db-url"
   DIRECT_URL="your-supabase-direct-url"
   BETTER_AUTH_SECRET="your-secret"
   BETTER_AUTH_URL="http://localhost:3000"
   GOOGLE_PLACES_API_KEY="your-google-api-key"
   # ...other required keys
   ```

4. **Initialize Database**
   Run the Prisma setup to sync your schema with the database.
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app running!

---

## 🎨 Recent Updates

*   **Packing Checklist:** Converted from static UI to a dynamic React state-driven page. It now fetches live trips from the database and allows real-time packing progress tracking.
*   **Profile Features:** Added a native local file picker for profile avatars and created a functional "Edit Details" modal (connected to Prisma server actions) for updating names and email addresses instantly.
*   **Sign Up Flow:** Introduced an instant local-preview avatar upload to the registration screen.
