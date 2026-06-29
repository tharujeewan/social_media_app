class ApiConstants {
  ApiConstants._();

  // ── Base URL ──────────────────────────────────────────────────────────
  // Switch between local and production by commenting/uncommenting:

  static const String baseUrl = 'http://192.168.1.68:3000/api'; // Physical device (Wi-Fi)

  // static const String baseUrl = 'http://10.0.2.2:3000/api';     // Android emulator
  // static const String baseUrl = 'http://localhost:3000/api';     // iOS simulator
  // static const String baseUrl = 'https://social-media-app-78yx.onrender.com/api/v1'; // Production

  // ── Auth Endpoints ────────────────────────────────────────────────────
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refreshToken = '/auth/refresh-token';
  static const String logout = '/auth/logout';
  static const String firebaseLogin = '/auth/firebase';

  // ── User Endpoints ────────────────────────────────────────────────────
  static const String users = '/users';
  static const String profile = '/users/profile';

  // ── Post Endpoints ────────────────────────────────────────────────────
  static const String posts = '/posts';
  static const String comments = '/comments';
}
