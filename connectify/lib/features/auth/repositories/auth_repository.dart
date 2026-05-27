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
      
      // Standard response formatting expected from backend
      return {
        'token': response.data['token'] ?? response.data['data']?['accessToken'] ?? response.data['data']?['token'],
        'user': UserModel.fromJson(
          Map<String, dynamic>.from(response.data['user'] ?? response.data['data']?['user'] ?? <String, dynamic>{})
        ),
      };
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Map<String, dynamic>> register(SignupRequestModel data) async {
    try {
      final response = await _dio.post(ApiConstants.register, data: data.toJson());
      
      return {
        'token': response.data['token'] ?? response.data['data']?['accessToken'] ?? response.data['data']?['token'],
        'user': UserModel.fromJson(
          Map<String, dynamic>.from(response.data['user'] ?? response.data['data']?['user'] ?? <String, dynamic>{})
        ),
      };
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException e) {
    if (e.response != null && e.response?.data != null) {
      final responseData = e.response?.data;
      if (responseData is Map) {
        final message = responseData['message'];
        final error = responseData['error'];

        if (message is String) return message;
        if (error is String) return error;
        
        if (error is Map && error['message'] != null) {
          return error['message'].toString();
        }
        
        return 'Authentication failed: ${e.response?.statusCode}';
      } else if (responseData is String) {
        return responseData;
      }
    }
    return 'An unexpected network error occurred. Please try again.';
  }
}
