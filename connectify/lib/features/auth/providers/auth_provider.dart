import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectify/core/constants/storage_keys.dart';
import 'package:connectify/features/auth/repositories/auth_repository.dart';
import 'package:connectify/features/auth/services/firebase_auth_service.dart';
import 'package:connectify/features/auth/models/login_request_model.dart';
import 'package:connectify/features/auth/models/signup_request_model.dart';
import 'package:connectify/features/auth/models/user_model.dart';
class AuthProvider extends ChangeNotifier {
  final AuthRepository _repository = AuthRepository();
  final FirebaseAuthService _firebaseAuthService = FirebaseAuthService();

  UserModel? _currentUser;
  bool _isLoading = false;
  String? _error;

  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _currentUser != null;

  // ── Session check ────────────────────────────────────────────────────────

  Future<bool> checkLoginStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(StorageKeys.accessToken);
    final userJson = prefs.getString('user_data');

    if (token != null && token.isNotEmpty) {
      if (userJson != null && userJson.isNotEmpty) {
        try {
          _currentUser = UserModel.fromJson(json.decode(userJson));
        } catch (_) {
          // Gracefully ignore parsing issues and fall back to token-only auth
        }
      }
      notifyListeners();
      return true;
    }
    return false;
  }

  // ── Email / password login ───────────────────────────────────────────────

  Future<bool> login(LoginRequestModel request) async {
    _setLoading(true);
    _clearError();
    try {
      final result = await _repository.login(request);
      return await _handleAuthResult(result);
    } catch (e) {
      _setError(_friendlyError(e.toString()));
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // ── Email / password register ────────────────────────────────────────────

  Future<bool> register(SignupRequestModel request) async {
    _setLoading(true);
    _clearError();
    try {
      final result = await _repository.register(request);
      return await _handleAuthResult(result);
    } catch (e) {
      _setError(_friendlyError(e.toString()));
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // ── Google / Firebase login ──────────────────────────────────────────────

  /// Triggers the Google Sign-In flow, exchanges the Firebase ID token with
  /// the app backend, and persists the resulting session.
  Future<bool> loginWithGoogle() async {
    _setLoading(true);
    _clearError();
    try {
      // 1. Sign in with Google via Firebase
      final credential = await _firebaseAuthService.signInWithGoogle();

      // 2. Get the Firebase ID token
      final idToken = await credential.user?.getIdToken();
      if (idToken == null) {
        _setError('Failed to retrieve Firebase ID token.');
        return false;
      }

      // 3. Exchange with the backend for our own JWT tokens
      final result = await _repository.loginWithFirebase(idToken);
      return await _handleAuthResult(result);
    } on Exception catch (e) {
      final msg = e.toString();
      // Treat cancellation as silent no-op
      if (msg.contains('cancelled') ||
          msg.contains('canceled') ||
          msg.contains('sign_in_canceled')) {
        _clearError();
      } else {
        _setError(msg.replaceFirst('Exception: ', ''));
      }
      return false;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // ── Logout ───────────────────────────────────────────────────────────────

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(StorageKeys.accessToken);
    await prefs.remove(StorageKeys.refreshToken);
    await prefs.remove('user_data');

    // Sign out from Firebase / Google as well (best-effort)
    try {
      await _firebaseAuthService.signOut();
    } catch (_) {}

    _currentUser = null;
    notifyListeners();
  }

  // ── Internal helpers ─────────────────────────────────────────────────────

  Future<bool> _handleAuthResult(Map<String, dynamic> result) async {
    final token = result['token'] as String?;
    final user = result['user'] as UserModel?;

    if (token != null && user != null) {
      await _saveAuthData(
        token,
        result['refreshToken'] as String?,
        user,
      );
      return true;
    }

    _setError('Invalid response format from server.');
    return false;
  }

  Future<void> _saveAuthData(
    String token,
    String? refreshToken,
    UserModel user,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.accessToken, token);
    if (refreshToken != null) {
      await prefs.setString(StorageKeys.refreshToken, refreshToken);
    }
    await prefs.setString('user_data', json.encode(user.toJson()));
    _currentUser = user;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String message) {
    _error = message;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  /// Strips Dart exception prefixes like "Exception: " from error messages.
  String _friendlyError(String raw) {
    return raw
        .replaceFirst('Exception: ', '')
        .replaceFirst('DioException: ', '')
        .replaceFirst('Error: ', '');
  }
}
