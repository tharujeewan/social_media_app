import 'dart:io';
import 'package:flutter/material.dart';
import 'package:connectify/features/post/models/create_post_model.dart';
import 'package:connectify/features/post/repositories/post_repository.dart';
import 'package:image_picker/image_picker.dart';

class CreatePostProvider extends ChangeNotifier {
  final PostRepository _postRepository;

  CreatePostProvider(this._postRepository);

  CreatePostModel _postData = CreatePostModel();
  CreatePostModel get postData => _postData;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _error;
  String? get error => _error;

  void setPostType(String type) {
    _postData = _postData.copyWith(postType: type);
    notifyListeners();
  }

  void setTitle(String title) {
    _postData = _postData.copyWith(title: title);
    notifyListeners();
  }

  void setContent(String content) {
    _postData = _postData.copyWith(content: content);
    notifyListeners();
  }

  Future<void> pickMedia(bool isVideo) async {
    final picker = ImagePicker();
    final XFile? pickedFile;
    
    if (isVideo) {
      pickedFile = await picker.pickVideo(source: ImageSource.gallery);
    } else {
      pickedFile = await picker.pickImage(source: ImageSource.gallery);
    }

    if (pickedFile != null) {
      _postData = _postData.copyWith(mediaFile: File(pickedFile.path));
      notifyListeners();
    }
  }

  void removeMedia() {
    _postData.mediaFile = null;
    notifyListeners();
  }

  void addTag(String tag) {
    if (!_postData.tags.contains(tag)) {
      final updatedTags = List<String>.from(_postData.tags)..add(tag);
      _postData = _postData.copyWith(tags: updatedTags);
      notifyListeners();
    }
  }

  void removeTag(String tag) {
    final updatedTags = List<String>.from(_postData.tags)..remove(tag);
    _postData = _postData.copyWith(tags: updatedTags);
    notifyListeners();
  }

  Future<bool> publishPost() async {
    if (_postData.title.isEmpty && _postData.content.isEmpty && _postData.mediaFile == null) {
      _error = 'Post cannot be empty';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _postRepository.createPost(_postData);
      _isLoading = false;
      // Reset form on success
      _postData = CreatePostModel();
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
