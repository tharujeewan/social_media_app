import 'package:dio/dio.dart';
import 'package:connectify/core/network/api_client.dart';
import 'package:connectify/core/constants/api_constants.dart';
import 'package:connectify/features/auth/models/login_request_model.dart';
import 'package:connectify/features/auth/models/signup_request_model.dart';
import 'package:connectify/features/auth/models/user_model.dart';

class AuthRepository {
  final Dio _dio = ApiClient().dio;

  Future<Map<String, dynamic>> login(LoginRequestModel data) async {
    try {
      final response = await _dio.post(ApiConstants.login, data: data.toJson());
      return _parseAuthResponse(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> register(SignupRequestModel data) async {
    try {
      final response =
          await _dio.post(ApiConstants.register, data: data.toJson());
      return _parseAuthResponse(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Exchange a Firebase ID token for the app's own JWT tokens.
  Future<Map<String, dynamic>> loginWithFirebase(String idToken) async {
    try {
      final response = await _dio.post(
        ApiConstants.firebaseLogin,
        data: {'id_token': idToken},
      );
      return _parseAuthResponse(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /// Parses the backend response envelope:
  /// { success: true, message: "...", data: { user: {...}, accessToken: "...", refreshToken: "..." } }
  Map<String, dynamic> _parseAuthResponse(dynamic responseData) {
    if (responseData == null) {
      throw 'Empty response from server.';
    }

    // Unwrap the data envelope
    final data = responseData['data'];
    if (data == null) {
      throw 'Invalid response format from server.';
    }

    final token = data['accessToken'] as String?;
    final refreshToken = data['refreshToken'] as String?;
    final userJson = data['user'];

    if (token == null || token.isEmpty) {
      throw 'Authentication token missing from response.';
    }

    if (userJson == null) {
      throw 'User data missing from response.';
    }

    final user = UserModel.fromJson(Map<String, dynamic>.from(userJson));

    return {
      'token': token,
      'refreshToken': refreshToken,
      'user': user,
    };
  }

  String _handleError(DioException e) {
    if (e.response != null && e.response?.data != null) {
      final responseData = e.response?.data;
      if (responseData is Map) {
        // Backend error format: { success: false, error: { message: "..." } }
        final errorObj = responseData['error'];
        if (errorObj is Map && errorObj['message'] != null) {
          return errorObj['message'].toString();
        }

        final message = responseData['message'];
        if (message is String) return message;

        return 'Request failed (${e.response?.statusCode})';
      } else if (responseData is String && responseData.isNotEmpty) {
        return responseData;
      }
    }

    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout) {
      return 'Connection timed out. Please check your network and try again.';
    }

    if (e.type == DioExceptionType.connectionError) {
      return 'Unable to connect to the server. Make sure the backend is running.';
    }

    return 'An unexpected error occurred. Please try again.';
  }
}
