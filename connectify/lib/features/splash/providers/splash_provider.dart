import 'package:flutter/material.dart';

/// Provider that manages splash screen state and initial app routing.
///
/// Determines whether to navigate to login or home based on stored auth state.
class SplashProvider extends ChangeNotifier {
  bool _isInitialized = false;
  bool _isLoggedIn = false;

  bool get isInitialized => _isInitialized;
  bool get isLoggedIn => _isLoggedIn;

  /// Initialises the app — checks for stored tokens, etc.
  /// Call this from the splash screen's [initState].
  Future<void> initialize() async {
    // Simulate checking for stored auth tokens / onboarding status
    await Future.delayed(const Duration(milliseconds: 2500));

    // TODO: Replace with actual token check from secure storage
    // final token = await SecureStorage.read(StorageKeys.accessToken);
    // _isLoggedIn = token != null && token.isNotEmpty;

    _isLoggedIn = false; // Default: not logged in
    _isInitialized = true;
    notifyListeners();
  }
}
