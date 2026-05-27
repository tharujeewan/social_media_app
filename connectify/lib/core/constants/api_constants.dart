/// API endpoint and base URL constants.
class ApiConstants {
  ApiConstants._();

  static const String baseUrl = 'http://10.0.2.2:3000/api'; // Android emulator
  // static const String baseUrl = 'http://localhost:3000/api'; // iOS simulator

  // ── Auth Endpoints ────────────────────────────────────────────────────
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refreshToken = '/auth/refresh';
  static const String logout = '/auth/logout';

  // ── User Endpoints ────────────────────────────────────────────────────
  static const String users = '/users';
  static const String profile = '/users/profile';

  // ── Post Endpoints ────────────────────────────────────────────────────
  static const String posts = '/posts';
  static const String comments = '/comments';
}
