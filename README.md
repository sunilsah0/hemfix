# HemFix: Home Services Marketplace

A free, Urban Company style marketplace for home services, built for Sweden and ready to grow across Europe. Customers book services, partners sell services and manage a team, and assigned workers share their live location. Everything runs on free tools, with no server to maintain.
##
 **Link** 
 https://sunilsah0.github.io/hemfix/


> **Status:** demo-ready. Payments (Swish, Klarna, card) are still simulated. See [Roadmap](#roadmap).

---

## 1. What it does

**Customer site (`index.html`)**
- Browse services without logging in. Login is only asked at checkout.
- 5 languages: English, Svenska, नेपाली, हिंदी, العربية (Arabic switches the layout right to left).
- Regions: Sweden (SEK) and Germany, France, Netherlands, UK, Spain (EUR). Price, fee and VAT change with the region.
- Search with autocomplete, category filters, service detail popup (inclusions, FAQ, reviews, photo).
- Cart with subtotal, platform fee, VAT, total, Premium (+20%) and weekly subscription (-10%) options, plus a Swedish RUT deduction toggle.
- Checkout with date, time slot, address, postal code validation and payment choice (Swish, Klarna, card). Payment is simulated.
- Live order tracker (Booking Confirmed, Partner Assigned, In Transit, Service In Progress, Completed), the assigned person's name, a live map, and a Rate button after completion.
- Partner profile pages with logo, about, average rating and reviews.

**Partner portal (`partner.html`)**
- Separate login and registration. New partners wait for your approval.
- Tabs: Jobs, Services, Team, Profile.
- Add services with name, category, price, duration, features and a photo.
- Add team members and give each an invite code. See who is online.
- Accept jobs in your region, assign a team member, follow their live location.

**Worker app (`worker.html`)**
- Separate login. The worker links their account with the partner's invite code.
- Go online or offline, accept assigned jobs, update job steps.
- Shares live GPS location only while online and on an accepted job that is in transit or in progress. The location is deleted when the job completes.

---

## 2. Tech stack (all free)

| Tool | What it is for |
|---|---|
| HTML, CSS, JavaScript | The website itself (no framework, no build step) |
| GitHub + GitHub Pages | Stores the code and hosts the site on the internet |
| Supabase (Free plan) | Database, login, photo storage, live updates |
| OpenStreetMap embed | Free map for live location |
| VS Code | Code editor (optional, but recommended) |

Note: a free Supabase project is paused after about a week without use. Open the Supabase dashboard and click Restore if that happens.

---

## 3. File structure

```
hemfix/
├── index.html        Customer site page
├── partner.html      Partner portal page
├── worker.html       Worker app page
├── style.css         All colors, layout, dark mode, mobile layout
├── ui.js             Shared helpers: pop-up messages, map
├── data.js           Translations (5 languages), regions, built-in services
├── supabase.js       Connects to YOUR Supabase project (edit this file)
├── app.js            Customer logic: cart, checkout, tracking, reviews, profiles
├── partner.js        Partner logic: services, team, jobs, photos, profile
├── worker.js         Worker logic: invite code, online status, location
├── schema.sql        Database part 1: users, orders
├── schema_v2.sql     Database part 2: partners, services, team
├── schema_v3.sql     Database part 3: photos, reviews, workers, location
└── README.md         This file
```

Script order matters. In each HTML file the Supabase library loads first, then `ui.js`, `data.js`, `supabase.js`, and finally the page's own script.

---

## 4. Build it from zero

### Step 1: Install tools
1. Install **VS Code** from code.visualstudio.com.
2. Use Chrome or Firefox.
3. Create a free account at **github.com** and another at **supabase.com**.

### Step 2: Get the code on your computer
1. Create a folder called `hemfix`.
2. Put all the files from the file structure above inside it.
3. Double-click `index.html`. You should see the customer site (without database features until Step 4).

### Step 3: Create the Supabase project
1. In Supabase click **New project**.
2. Name it `hemfix`, choose a database password and save it, pick a region near you (Stockholm or Frankfurt for EU), keep the **Free** plan.
3. Wait 2 to 3 minutes until it is ready.

### Step 4: Create the database (run the SQL files in this order)
1. In Supabase open **SQL Editor → New query**.
2. Paste all of `schema.sql`, click **Run**, and wait for "Success".
3. Do the same with `schema_v2.sql`.
4. Do the same with `schema_v3.sql`.
5. Run each file **once only**. If you run one twice you will see "already exists" errors. Fix this by starting with a fresh project, or by running only the parts that are missing.

### Step 5: Connect the website to Supabase
1. In Supabase go to **Project Settings → API** and copy the **Project URL**.
2. Go to the **API Keys** page and copy the **Publishable key** (starts with `sb_publishable_`).
3. Open `supabase.js` and replace the two placeholder values.
4. Never put a `secret` or `service_role` key in any website file. Anyone can read these files.

### Step 6: Set up login in Supabase
1. Go to **Authentication** and find the Email provider settings. For testing, turn **Confirm email** off. Menu names may differ slightly.
2. Go to **Authentication → URL Configuration** and set **Site URL** to `https://YOUR-USERNAME.github.io/hemfix`. This matters if you ever turn email confirmation on.

### Step 7: Put it on the internet (free)
1. On github.com click **+ → New repository**. Name it `hemfix`, choose **Public**, click **Create**.
2. Click **Add file → Upload files**, drag in all the project files (not the folder), click **Commit changes**.
3. Go to **Settings → Pages**. Set Branch to `main`, folder to `/ (root)`, click **Save**.
4. After 1 to 2 minutes your site is live:
   - Customers: `https://YOUR-USERNAME.github.io/hemfix/index.html`
   - Partners: `https://YOUR-USERNAME.github.io/hemfix/partner.html`
   - Workers: `https://YOUR-USERNAME.github.io/hemfix/worker.html`

### Step 8: Approve your first partner
New partners must be approved by you, which protects customers from fake partners.
1. Open `partner.html`, click **Register as partner**, and fill in the business form.
2. In Supabase open **SQL Editor** and run this with the business name you entered:
   ```sql
   update public.partners set approved = true where business_name = 'My Business';
   ```
   You can also open **Table Editor → partners** and tick `approved`.
3. Reload `partner.html`. The waiting banner disappears.

---

## 5. Test the full flow

1. **Partner:** in `partner.html` open **Profile** and upload a logo. Open **Services**, add a service with a photo. Open **Team**, add a person and copy the invite code.
2. **Customer:** open `index.html`. Your service appears with its photo, without any login. Add it, press Checkout, sign up with a **different email** and place an order with a valid postal code (Sweden example: `114 55`).
3. **Partner:** the job appears in **Jobs**. Press **Accept job**, then choose the person under **Assign person**.
4. **Worker (use a phone for GPS):** open `worker.html`, create an account with a third email, enter the invite code, tap **Go online**, accept the job, then **Start travel** and allow location permission.
5. **Watch live:** the customer and partner see the worker's name and a live map. Press **Start service**, then **Mark completed**.
6. **Review:** the customer taps **⭐ Rate**. Then open the partner's profile from the service detail and see the review.

---

## 6. How the pieces fit together

```
Customer browser ─┐
Partner browser  ─┼── Supabase (database + login + storage + live updates)
Worker phone     ─┘        │
                           └─ Row Level Security: each person sees only what they should
```

- **Row Level Security (RLS)** is the safety system. The publishable key is safe in public code only because every table has RLS rules.
- **Customers** can read and create only their own orders and reviews.
- **Partners** see only open jobs in their own region and their own jobs, services and team.
- **Workers** see only jobs assigned to them.
- **Locations** are visible only to the order's customer, the order's partner, and the sharing worker.
- Partners can change only status, assignment and acceptance on orders, not prices or addresses.

---

## 7. Changing things later

| I want to... | Edit |
|---|---|
| Change the brand color | `--pr` in `style.css` |
| Add a language | Copy a block in `T` inside `data.js` and translate it |
| Add a region or city | `R` in `data.js` (currency, VAT, fee, postal-code rule) |
| Change the platform fee or VAT | `R` in `data.js` |
| Add a built-in service | A new row in `SV` in `data.js` |
| Change the 15% partner commission | Search for `.85` in `app.js` and `partner.js` |

To publish a change: edit the file, then in GitHub open the repository, **Add file → Upload files**, replace the file, **Commit changes**. The site updates in about a minute.

---

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| Blank page | A file name is misspelled or a file is missing. Names are case sensitive. |
| No styling | `style.css` is not next to `index.html`. |
| Changes do not show | Save the file and hard refresh (Ctrl+Shift+R). |
| GitHub link shows 404 | Wait 2 minutes. Check the repo is Public and `index.html` is at the top level. |
| "Invalid API key" or alert about `supabase.js` | Paste your real URL and publishable key into `supabase.js`. |
| "supabase is not defined" | Wrong script order in the HTML file. |
| "email rate limit exceeded" or "Email not confirmed" | Turn **Confirm email** off (Step 6). |
| "new row violates row-level security" | A SQL file did not run completely. |
| Partner sees no jobs | The partner is not approved, or the order's region differs from the partner's region. |
| Worker link says invalid code | The code was already used, or it was mistyped. |
| No map or location | Use the live `https://` site on a phone, allow location, and be online with an accepted job in transit. |
| Photo upload fails | The image must be a picture under 2 MB. Check `schema_v3.sql` ran. |

Press **F12 → Console** in the browser to see the exact error message.

---

## 9. Known limits

- Payments are simulated. Orders are saved but nobody is charged.
- Service names are translated only for English and Swedish.
- Partner services appear for all regions, and prices are entered in SEK and converted to EUR.
- Service cards show a placeholder rating. Real ratings appear on partner profiles.
- Worker location is approximate on laptops and precise on phones with GPS.
- Free Supabase projects pause after about a week without use.

---

## 10. Roadmap

1. **Real payments** with Stripe, using a Supabase Edge Function to create checkout sessions. Test mode is free. Card and Klarna can be added, and Swish depends on Stripe's current availability for your business.
2. Partner payouts and commission reports.
3. Email or SMS notifications for new jobs and status changes.
4. Real ratings on service cards and partner ranking.
5. Admin dashboard for approving partners without SQL.
6. Move to React and Vite if the site grows larger.

---
