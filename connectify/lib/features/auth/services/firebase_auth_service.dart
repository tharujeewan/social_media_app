import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

/// Handles Firebase authentication flows (Google Sign-In, etc.).
class FirebaseAuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Web Client ID from Firebase Console → Authentication → Sign-in method → Google
  // → Web SDK configuration → Web client ID.
  // Replace the placeholder below with your actual value.
  static const String _webClientId =
      '126803614927-REPLACE_WITH_WEB_CLIENT_ID.apps.googleusercontent.com';

  late final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: _webClientId,
  );

  /// Trigger the Google Sign-In flow and return the Firebase [UserCredential].
  Future<UserCredential> signInWithGoogle() async {
    final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

    if (googleUser == null) {
      throw Exception('Google Sign-In was cancelled by the user.');
    }

    final GoogleSignInAuthentication googleAuth =
        await googleUser.authentication;

    if (googleAuth.idToken == null) {
      throw Exception(
        'Google Sign-In failed: no ID token returned. '
        'Make sure Google Sign-In is enabled in Firebase Console '
        'and google-services.json has oauth_client populated.',
      );
    }

    final OAuthCredential credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    return _auth.signInWithCredential(credential);
  }

  /// Get the current user's Firebase ID token.
  Future<String?> getIdToken({bool forceRefresh = false}) async {
    return _auth.currentUser?.getIdToken(forceRefresh);
  }

  /// Sign out from Firebase and Google.
  Future<void> signOut() async {
    await Future.wait([
      _auth.signOut(),
      _googleSignIn.signOut(),
    ]);
  }
}
