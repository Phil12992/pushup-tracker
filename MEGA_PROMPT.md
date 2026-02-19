# MEGA PROMPT - Push-Up Pro App

## MISSION
Build a professional Push-Up Tracker web app.

## CORE FEATURES

### 1. Authentication
- Login/Register with username + password
- Per-user data isolation (each user has own data in localStorage)
- `pushup_pro_db` = { "username": { data } }

### 2. Training System
- Day 1 = 1 push-up, Day 2 = 2 push-ups, etc.
- Click "Erledigt!" to complete today's workout
- Streak tracking with "Streak on Ice" (🧊) when missing a day
- Progress chart (14 days)

### 3. Stats Display
- Total days trained
- Total push-ups ever
- Today's target
- Record (max in one day)
- Current streak

### 4. AI Coach System
- 5 AI Trainers with unique personalities:
  - Arnold 🏋️ - "Weiche nie!" (Muskelaufbau)
  - Rocky 🥊 - "Es geht nicht darum wie hart..." (Ausdauer)
  - Mike 💪 - "Erst denken, dann trainieren" (Technik)
  - Camille 🧘 - "Balance ist der Schlüssel" (Balance)
  - Godzilla 🦖 - "BREATH FIRE!" (Kraft)
- User selects ONE coach
- Coach appears in stats header next to streak

### 5. Privacy
- Photos: Only the user who takes a photo can see/delete it
- Data stored locally in browser (localStorage)
- No backend required

## OPTIONAL FEATURES (Nice to Have)
- Body measurements (weight, waist, arms, chest)
- Friends list with assigned AI coaches
- Photo gallery for progress pics

## DESIGN REQUIREMENTS
- Dark theme (#050505 background)
- Orange accent color (#ff6b35)
- Professional,
- Smooth animations clean look
- Mobile responsive
- German language throughout

## TECHNICAL REQUIREMENTS
- Single HTML file with inline CSS + JS
- Or split: index.html + app.js
- No external dependencies except Google Fonts
- localStorage for persistence
- No syntax errors - test with `node --check`

## FILE STRUCTURE
```
pushup-tracker/
├── index.html    # Complete HTML with CSS
├── app.js        # All JavaScript logic
└── MEGA_PROMPT.md # This file
```

## LOCALSTORAGE SCHEMA
```json
{
  "pushup_pro_db": {
    "Max": {
      "password": "hash",
      "createdAt": "2026-02-19T...",
      "day": 5,
      "streak": 12,
      "streakOnIce": false,
      "history": [
        { "date": "2026-02-19T...", "count": 5, "day": 5 }
      ],
      "completedToday": false,
      "ai": "arnold",
      "bodyStats": [...],
      "photos": [...],
      "friends": [...]
    }
  }
}
```

## OUTPUT
Edit EXISTING files - do NOT delete repo.
Use proper Git workflow: git add . && git commit -m "message" && git push
