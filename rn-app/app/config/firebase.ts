// app/config/firebase.ts
// Firebase configuration for React Native Android app
// Firebase is auto-initialized from google-services.json

import firebase from '@react-native-firebase/app'

// For React Native Firebase, the app is auto-initialized from google-services.json
// No manual configuration needed - just ensure google-services.json is in android/app/

let app: any = null

console.log('Attempting to initialize Firebase for Android...')
try {
  // Get the default Firebase app
  app = firebase.app()
  console.log('Firebase initialized successfully for Android')
} catch (error) {
  console.error('Firebase initialization error:', error)
  console.log('Make sure google-services.json is in android/app/ directory')
}

export { app as firebaseApp }
export default app