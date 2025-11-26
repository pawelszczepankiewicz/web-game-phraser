# MMO RPG Game Server

Node.js multiplayer game server with Socket.io and Firebase.

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable **Authentication** > **Email/Password** provider
4. Enable **Firestore Database** in production mode
5. Go to **Project Settings** > **Service Accounts**
6. Click **Generate New Private Key**
7. Save the JSON file as `firebase-admin-sdk.json` in the `server/` directory

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set your Firebase project ID:
```
FIREBASE_PROJECT_ID=your-project-id-here
```

### 4. Firestore Security Rules

In Firebase Console, go to Firestore Database > Rules and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /characters/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `MAX_PLAYERS` - Maximum concurrent players (default: 100)
- `TICK_RATE` - Server tick rate in Hz (default: 60)
- `INTEREST_RANGE` - Distance for player interest management (default: 500)

## API Endpoints

- `GET /health` - Health check endpoint

## Socket.io Events

### Client → Server
- `authenticate` - Authenticate with Firebase ID token
- `player-move` - Update player position
- `player-attack` - Player attacks a monster
- `inventory-update` - Update inventory/equipment
- `quest-update` - Update quest status
- `change-map` - Change to different map

### Server → Client
- `auth-success` - Authentication successful
- `auth-failed` - Authentication failed
- `state-update` - Game state update (60 Hz)
- `player-joined` - Another player joined the map
- `player-left` - Another player left the map
- `player-moved` - Another player moved
- `monster-damaged` - Monster took damage
- `monster-died` - Monster was killed

## Architecture

```
server/
├── src/
│   ├── config/
│   │   └── firebase.js          # Firebase Admin SDK setup
│   ├── models/
│   │   └── Player.js            # Player model
│   ├── managers/
│   │   ├── PlayerManager.js     # Player lifecycle management
│   │   └── GameStateManager.js  # Game loop and state
│   ├── handlers/
│   │   └── socketHandlers.js    # Socket.io event handlers
│   └── index.js                 # Main server entry point
├── package.json
├── .env
└── firebase-admin-sdk.json      # (not in git)
```

## Deployment

### Google Cloud Run (Recommended for Firebase)

1. Install Google Cloud SDK
2. Build and deploy:

```bash
gcloud run deploy game-server \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=your-project-id
```

### Docker

```bash
docker build -t game-server .
docker run -p 3000:3000 \
  -e FIREBASE_PROJECT_ID=your-project-id \
  -v $(pwd)/firebase-admin-sdk.json:/app/firebase-admin-sdk.json \
  game-server
```

## Monitoring

Check server health:
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "players": 5,
  "uptime": 123.456
}
```
