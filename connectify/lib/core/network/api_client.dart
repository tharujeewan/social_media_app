import 'package:dio/dio.dart';
import 'package:connectify/core/constants/api_constants.dart';
import 'package:connectify/core/network/dio_interceptor.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  late final Dio _dio;

  factory ApiClient() => _instance;

  ApiClient._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 10),
    ));

    _dio.interceptors.add(DioInterceptor());
  }

  Dio get dio => _dio;
}
