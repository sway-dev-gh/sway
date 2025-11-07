import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

// TODO: Replace with your Firebase config from https://console.firebase.google.com/
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (error) {
    console.error('Google sign-in error:', error)
    throw error
  }
}
