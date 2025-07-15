# Family Tasks App

A beautiful, production-ready family task management app built with Expo, React Native, and Firebase Firestore.

## Features

- **Multi-role Authentication**: Separate interfaces for parents and children
- **Real-time Task Management**: Create, assign, and track tasks with live updates
- **Gamification**: Points, levels, and rewards system to motivate children
- **Beautiful UI**: Modern, polished interface with smooth animations
- **Offline Support**: Works offline with automatic sync when reconnected
- **Analytics**: Track family progress and individual performance

## Tech Stack

- **Frontend**: Expo (React Native), TypeScript
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **State Management**: React Context + Custom Hooks
- **Icons**: Lucide React Native
- **Fonts**: Inter (Google Fonts)

## Getting Started

### Prerequisites

- Node.js 18+ 
- Expo CLI
- Firebase project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd family-tasks-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Authentication with Email/Password
   - Copy your Firebase config

4. Configure environment variables:
```bash
cp .env.example .env
```
Fill in your Firebase configuration in the `.env` file.

5. Start the development server:
```bash
npm run dev
```

### Firebase Setup

1. **Firestore Database**:
   - Create a new Firestore database
   - Start in test mode (we'll add security rules later)

2. **Authentication**:
   - Enable Email/Password authentication
   - Optionally enable other providers

3. **Security Rules** (add to Firestore):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Family documents
    match /families/{familyId} {
      allow read, write: if request.auth != null && 
        (resource.data.parentId == request.auth.uid || 
         exists(/databases/$(database)/documents/children/$(request.auth.uid)));
    }
    
    // Children documents
    match /children/{childId} {
      allow read, write: if request.auth != null && 
        (get(/databases/$(database)/documents/families/$(resource.data.familyId)).data.parentId == request.auth.uid ||
         request.auth.uid == childId);
    }
    
    // Tasks documents
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
        (get(/databases/$(database)/documents/families/$(resource.data.familyId)).data.parentId == request.auth.uid ||
         resource.data.assignedTo == request.auth.uid);
    }
    
    // Rewards documents
    match /rewards/{rewardId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/families/$(resource.data.familyId)).data.parentId == request.auth.uid;
    }
  }
}
```

## Project Structure

```
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   ├── auth.tsx           # Authentication screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
├── lib/                   # Firebase configuration and services
├── types/                 # TypeScript type definitions
└── data/                  # Mock data (for development)
```

## Key Features

### Authentication System
- Firebase Auth integration
- Role-based access (parent/child)
- Secure user management

### Real-time Data
- Live updates using Firestore listeners
- Offline support with automatic sync
- Optimistic updates for better UX

### Task Management
- Create and assign tasks to children
- Set due dates, priorities, and categories
- Track completion and award points
- Recurring task support

### Gamification
- Points system for completed tasks
- Level progression based on points
- Rewards store for redeeming points
- Achievement tracking

### Analytics
- Family performance overview
- Individual child progress
- Task completion trends
- Points and level statistics

## Development

### Adding New Features

1. **Database Schema**: Update Firestore collections in `lib/firestore.ts`
2. **Types**: Add TypeScript types in `types/index.ts`
3. **Services**: Create service functions in `lib/firestore.ts`
4. **Hooks**: Add custom hooks in `hooks/useFirestore.ts`
5. **UI**: Create components and screens

### Testing

The app includes comprehensive error handling and loading states. Test with:
- Network connectivity issues
- Authentication failures
- Firestore permission errors
- Offline scenarios

## Deployment

### Web Deployment
```bash
npm run build:web
```

### Mobile App Store
1. Configure app.json for production
2. Build with EAS Build
3. Submit to app stores

## Environment Variables

Required environment variables:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.