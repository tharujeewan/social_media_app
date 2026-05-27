import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectify/core/constants/storage_keys.dart';
import 'package:connectify/features/auth/repositories/auth_repository.dart';
import 'package:connectify/features/auth/models/login_request_model.dart';
import 'package:connectify/features/auth/models/signup_request_model.dart';
import 'package:connectify/features/auth/models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  final AuthRepository _repository = AuthRepository();
  UserModel? _currentUser;
  bool _isLoading = false;
  String? _error;

  UserModel? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _currentUser != null;

  Future<bool> checkLoginStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(StorageKeys.accessToken);
    final userJson = prefs.getString('user_data');
    
    if (token != null && token.isNotEmpty) {
      if (userJson != null && userJson.isNotEmpty) {
        try {
          _currentUser = UserModel.fromJson(json.decode(userJson));
        } catch (e) {
          // Gracefully ignore parsing issues and fall back
        }
      }
      notifyListeners();
      return true;
    }
    return false;
  }

  Future<bool> login(LoginRequestModel request) async {
    _setLoading(true);
    _clearError();
    try {
      final result = await _repository.login(request);
      
      if (result['token'] != null && result['user'] != null) {
        await _saveAuthData(result['token'], result['user']);
        return true;
      } else {
        _setError("Invalid response format from server.");
        return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> register(SignupRequestModel request) async {
    _setLoading(true);
    _clearError();
    try {
      final result = await _repository.register(request);
      
      if (result['token'] != null && result['user'] != null) {
        await _saveAuthData(result['token'], result['user']);
        return true;
      } else {
         _setError("Invalid response format from server.");
         return false;
      }
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> _saveAuthData(String token, UserModel user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(StorageKeys.accessToken, token);
    await prefs.setString('user_data', json.encode(user.toJson()));
    _currentUser = user;
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(StorageKeys.accessToken);
    await prefs.remove('user_data');
    _currentUser = null;
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
}
