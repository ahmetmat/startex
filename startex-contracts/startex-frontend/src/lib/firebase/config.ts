import { FirebaseApp, initializeApp, getApps } from 'firebase/app'

const firebaseConfig = {
  apiKey: "AIzaSyD4T6z2MvdI1CySKhnFgG6xbt2_9nhdEHw",
  authDomain: "startex-a1168.firebaseapp.com",
  projectId: "startex-a1168",
  storageBucket: "startex-a1168.firebasestorage.app",
  messagingSenderId: "498471788591",
  appId: "1:498471788591:web:76f460a64180428016a6da"
};

let app: FirebaseApp | undefined

export const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Missing Firebase configuration. Check environment variables.')
    }

    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  }

  return app
}
