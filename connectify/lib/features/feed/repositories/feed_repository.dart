import 'package:dio/dio.dart';
import 'package:connectify/core/network/api_client.dart';
import 'package:connectify/core/constants/api_constants.dart';
import 'package:connectify/features/feed/models/feed_item_model.dart';

class FeedRepository {
  final Dio _dio = ApiClient().dio;

  Future<List<FeedItemModel>> fetchGlobalFeed({int page = 1, int limit = 10}) async {
    try {
      final response = await _dio.get(
        ApiConstants.posts,
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );

      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((item) => FeedItemModel.fromJson(item)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<List<FeedItemModel>> fetchPersonalizedFeed({int page = 1, int limit = 10}) async {
    try {
      final response = await _dio.get(
        '${ApiConstants.posts}/feed',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );

      final List<dynamic> data = response.data['data'] ?? [];
      return data.map((item) => FeedItemModel.fromJson(item)).toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  String _handleError(DioException e) {
    if (e.response != null && e.response?.data != null) {
      final responseData = e.response?.data;
      if (responseData is Map && responseData['message'] != null) {
        return responseData['message'].toString();
      }
    }
    return 'An error occurred while fetching the feed.';
  }
}
