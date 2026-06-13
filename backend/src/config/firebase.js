const admin = require('firebase-admin');

/**
 * Initialize Firebase Admin SDK using environment variables.
 *
 * Required env vars:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (the key with \n newlines)
 *
 * Alternatively, set GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON path.
 */
function initFirebase() {
  if (admin.apps.length > 0) {
    return admin; // Already initialised
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env;

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines that may come from .env files
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Fallback: use application default credentials (GOOGLE_APPLICATION_CREDENTIALS)
    admin.initializeApp();
  }

  return admin;
}

const firebaseAdmin = initFirebase();

module.exports = { firebaseAdmin };
