import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:connectify/features/post/models/post_model.dart';
import 'package:connectify/features/post/models/create_post_model.dart';
import 'package:connectify/core/constants/api_constants.dart';
import 'package:connectify/core/constants/storage_keys.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http_parser/http_parser.dart';

class PostRepository {
  final http.Client _client = http.Client();
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(StorageKeys.accessToken);
  }

  Future<PostModel> createPost(CreatePostModel post) async {
    final token = await _getToken();
    final uri = Uri.parse('${ApiConstants.baseUrl}/posts');
    
    var request = http.MultipartRequest('POST', uri);
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    // Format the caption using Title, Content, and Tags to match Backend schema
    final captionParts = [];
    if (post.title.isNotEmpty) captionParts.add(post.title);
    if (post.content.isNotEmpty) captionParts.add(post.content);
    if (post.tags.isNotEmpty) captionParts.add(post.tags.join(' '));
    final caption = captionParts.join('\n\n');

    request.fields['caption'] = caption;

    if (post.mediaFile != null) {
      final ext = post.mediaFile!.path.split('.').last.toLowerCase();
      String type = 'image';
      if (['mp4', 'mov', 'avi', 'mkv'].contains(ext)) {
        type = 'video';
      }
      
      request.files.add(
        await http.MultipartFile.fromPath(
          'media', 
          post.mediaFile!.path,
          contentType: MediaType(type, ext == 'jpg' ? 'jpeg' : ext),
        )
      );
    }

    final response = await request.send();
    final responseData = await response.stream.bytesToString();

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = json.decode(responseData);
      return PostModel.fromJson(data['data']);
    } else {
      throw Exception('Failed to create post: ${response.statusCode}');
    }
  }
}
