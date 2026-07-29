# AgriScan AI

Build a Professional AI Weed Detection & Herbicide Recommendation Web Application

Create a complete, modern, professional, responsive frontend web application for an AI-Powered Weed Detection and Herbicide Recommendation System.

IMPORTANT DEVELOPMENT RULES

Build the frontend UI only.

Do NOT create or modify any backend, database, API server, authentication server, or AI model.

Use mock data / dummy data wherever backend data is required.

Structure the frontend cleanly so that real APIs can be connected later.

Create reusable components and clean folder organization.

Do not break or remove any existing backend functionality if backend code already exists.

Use realistic loading states, empty states, error states, success messages, and confirmation dialogs.

The application must be fully responsive for:

Desktop

Tablet

Mobile

RECOMMENDED TECH STACK

Use:

React.js

Vite

TypeScript

Tailwind CSS

React Router

Lucide React icons

Recharts for charts

Framer Motion for smooth animations

Three.js / React Three Fiber for the 3D visualization and simulation interface

If the project already has a frontend technology stack, keep the existing stack instead of replacing it.

PROJECT PURPOSE

The system helps farmers and agricultural users detect weeds using AI computer vision and receive herbicide recommendations.

The overall user journey is:

User Registration / Login

Select English or Myanmar language

User Dashboard

Scan or Upload Weed Image

AI Weed Detection Result

Weed Density Analysis

Herbicide Recommendation

Dosage Calculation

3D Visualization

3D Spraying Simulation

Save Detection and Spraying Record

View History

1. AUTHENTICATION

Create a professional authentication experience.

Registration Page

Fields:

Full Name

Email

Password

Confirm Password

Preferred Language

Language options:

English

မြန်မာ

Include:

Create Account button

Link to Login

Password visibility toggle

Form validation

Loading state

Error state

Success notification

Login Page

Fields:

Email

Password

Include:

Login button

Remember Me checkbox

Forgot Password link

Link to Register

Language selector

Use a clean agricultural / AI technology visual style.

After successful login, navigate to:

/dashboard

2. GLOBAL NAVIGATION

Create a responsive navigation system.

Desktop:

Sidebar navigation

Top header

Mobile:

Bottom navigation or mobile sidebar

Navigation items:

Dashboard

Scan Weeds

Detection Results

Recommendations

History

Settings

Header should include:

Page title

Language selector

Notification icon

User profile menu

Logout

3. MULTI-LANGUAGE SUPPORT

Implement frontend language switching for:

English

Myanmar

The user should be able to change the language from:

Registration / Login

Header

Settings

Create a reusable translation structure so more languages can be added later.

Translate important UI elements including:

Navigation

Buttons

Forms

Dashboard labels

Detection results

Recommendations

History

Settings

Error messages

Success messages

4. USER DASHBOARD

Create a professional dashboard homepage.

Dashboard should display:

Welcome Section

Example:

"Welcome back, Ko Htet"

Subtitle:

"Monitor your crops and detect weeds with AI-powered technology."

Include a prominent CTA:

Scan Weeds

Secondary CTA:

View History

Summary Cards

Create modern statistic cards:

Total Scans

Example:

128

Weeds Detected

Example:

342

Herbicide Recommendations

Example:

87

Areas Analyzed

Example:

24.5 Acres

Use clean icons and subtle animations.

Recent Detection Activity

Display recent detection records.

Each record should show:

Date

Time

GPS location

Image thumbnail

Detected weed type

Weed density

Recommended herbicide

Status

Example:

July 28, 2026
Yangon, Myanmar

Detected Weed:
Barnyard Grass

Density:
High

Recommendation:
Herbicide Recommended

View Details


Location Information

Display a map-style card showing recent GPS locations.

Use mock GPS coordinates for now.

The map should visually show:

Detection locations

Recent scan points

User location

Use Leaflet or another frontend map library if appropriate.

Quick Action

Create a large attractive card:

"Have weeds in your field?"

Button:

Scan Weeds Now

5. WEED SCANNING PAGE

Route:

/scan

Create a professional image upload and camera interface.

The page should allow users to:

Option 1: Take Photo

Button:

Open Camera

Option 2: Upload Image

Button:

Upload from Gallery

Support:

Drag and drop

Image preview

File selection

Mobile camera capture

After selecting an image:

Display:

Large image preview

File name

Image size

Remove button

Retake button

Analyze Image button

Add a clear instruction:

"Take a clear photo of the weeds from a suitable distance for better detection accuracy."

6. AI DETECTION PROCESS

When the user clicks:

Analyze Image

Show a professional AI processing experience.

Create animated steps:

Uploading Image

Processing Image

Detecting Weeds

Analyzing Weed Density

Generating Recommendation

Display an animated progress indicator.

Use mock processing delay for demonstration.

After completion, navigate to:

/detection-result

7. AI DETECTION RESULT PAGE

Display the uploaded image with AI detection visualization.

The image should visually show detected weeds using:

Bounding boxes

Labels

Confidence scores

Example:

Barnyard Grass
Confidence: 94%

Detected Instances: 18


Show detection summary cards:

Weed Species

Number Detected

Confidence

Density

Estimated Coverage Area

Example:

Weed Type:
Barnyard Grass

Density:
High

Estimated Coverage:
68%

Detected Objects:
18


Add a density visualization:

Low

Medium

High

Use a professional chart or visual indicator.

Buttons:

View Recommendation

View 3D Simulation

Save Record

8. HERBICIDE RECOMMENDATION PAGE

Route:

/recommendation

Create a professional recommendation interface.

Show:

Detected Weed

Example:

Barnyard Grass

Weed Density

High

Recommended Herbicide

Example:

Herbicide Name

Show:

Herbicide name

Active ingredient

Recommended usage

Suitable crop

Target weed

Application method

Safety information

9. DOSAGE CALCULATOR

Create an interactive dosage calculation card.

Inputs:

Field Area

Area Unit

Water Volume

Herbicide Rate

Allow units such as:

Acre

Hectare

Square Meter

Show calculated results:

Field Area:
2 Acres

Water Required:
400 Liters

Herbicide Required:
X Liters

Mixing Ratio:
X ml per Liter


IMPORTANT:

Use mock calculation logic for frontend demonstration only.

Clearly label that actual herbicide application rates must be verified against the product label and local agricultural guidance.

Add:

Calculate Dosage

Show calculation result with a professional visual design.

10. 3D VISUALIZATION PAGE

Route:

/simulation

Create an interactive 3D visualization experience.

Display:

Uploaded 2D field image as a visual plane / surface

Detected weed locations

Weed density visualization

Field area representation

Use Three.js / React Three Fiber if appropriate.

Add interactive controls:

Rotate

Zoom

Pan

Reset View

Create a professional 3D agricultural visualization.

11. 3D SPRAYING SIMULATION

Create an animated spraying simulation.

The simulation should visually demonstrate:

Field area

Detected weed zones

Spray coverage

Spraying direction

Spray distribution

Completed treatment area

Show controls:

Play

Pause

Restart

Speed: 0.5x / 1x / 2x

Display information:

Field Area: 2 Acres
Weed Density: High
Estimated Spray Area: 1.4 Acres
Herbicide Volume: X Liters
Water Volume: X Liters


Use smooth animation and particle-like spray visualization.

The simulation is only a visual representation and should not claim to provide physically accurate spraying behavior.

12. SAVE RECORD / DATA LOGGING

After the user completes the detection and recommendation process, provide:

Save Detection Record

When clicked, show a success notification:

"Detection record saved successfully."

The saved record should contain mock data for:

User ID

Date

Time

GPS Location

Uploaded Image

Weed Type

Weed Density

Detection Confidence

Detected Quantity

Field Area

Recommended Herbicide

Dosage Information

Water Volume

Structure the frontend data model so it can later be connected to a real backend API.

13. HISTORY PAGE

Route:

/history

Create a professional history management page.

Display all previous detection records.

Each record should show:

Date

Time

GPS Location

Image

Weed Type

Density

Herbicide

Dosage

Status

Add:

Search

Filter by date

Filter by weed type

Filter by density

Sort by newest / oldest

Clicking a record should open:

/history/:id

14. HISTORY DETAIL PAGE

Show the complete record.

Sections:

Detection Information

Original Image

Weed Type

Confidence

Density

Number Detected

Location

GPS coordinates

Map

Recommendation

Herbicide

Active Ingredient

Dosage

Water Volume

3D Simulation

Show a button:

View 3D Simulation

Record Information

Date

Time

User

15. SETTINGS PAGE

Route:

/settings

Create settings sections:

Account

Name

Email

Profile image

Language

English

Myanmar

Notifications

Detection completed

Recommendation available

History saved

Appearance

Light Mode

Dark Mode

Security

Change Password

Logout

16. DESIGN SYSTEM

Create a professional AgriTech + AI visual identity.

Design goals:

Modern

Clean

Professional

Trustworthy

Technology-focused

Agriculture-focused

Use:

Soft rounded cards

Modern typography

Clear spacing

Professional dashboard layout

Subtle gradients

Glassmorphism only where appropriate

Smooth hover effects

Micro-interactions

Page transitions

Use an agriculture-inspired visual theme with natural green tones combined with modern AI/technology styling.

Avoid:

Overly colorful UI

Excessive animations

Cluttered layouts

Too many gradients

Amateur-looking icons

17. RESPONSIVE DESIGN

The entire application must work perfectly on:

Desktop

Use:

Sidebar

Multi-column dashboard

Large visualization area

Tablet

Use:

Collapsible sidebar

Responsive cards

Mobile

Use:

Bottom navigation or hamburger menu

Full-width cards

Mobile-friendly image capture

Large touch-friendly buttons

Responsive 3D simulation

18. MOCK DATA

Create realistic mock data for demonstration.

Example weed types:

Barnyard Grass

Crabgrass

Goosegrass

Broadleaf Weed

Nutgrass

Create at least 8-10 history records.

Create realistic:

GPS locations

Dates

Weed densities

Detection confidence scores

Herbicide recommendations

19. FRONTEND API ARCHITECTURE

Create a clean API service layer for future backend integration.

Example structure:

src/
├── components/
├── pages/
├── layouts/
├── services/
│   ├── authService.ts
│   ├── detectionService.ts
│   ├── recommendationService.ts
│   └── historyService.ts
├── hooks/
├── types/
├── data/
├── i18n/
├── utils/
└── routes/


For now, use mock services.

Make it easy to replace mock services with real API calls later.

20. FINAL USER FLOW

The final frontend user journey should be:

Registration
↓
Login
↓
Dashboard
↓
Scan Weeds
↓
Take Photo / Upload Image
↓
AI Processing Animation
↓
Detection Result
↓
Weed Density Analysis
↓
Herbicide Recommendation
↓
Dosage Calculation
↓
3D Visualization
↓
3D Spraying Simulation
↓
Save Record
↓
History
↓
History Detail

FINAL REQUIREMENT

Build the complete frontend with all pages, navigation, reusable components, responsive layouts, animations, mock data, loading states, error states, empty states, and frontend routing.

Make the application look like a real production-ready AI AgriTech SaaS platform, not a basic student project.

Prioritize excellent UI/UX, clean code, responsive design, accessibility, and realistic user interactions.

Do not implement the backend or database. Use mock data and mock API services only, while keeping the architecture ready for future FastAPI / Firebase integration.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0a8a5307-2557-4f12-8810-73f70dfccf31).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
