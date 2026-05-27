import 'package:flutter/material.dart';
import 'package:connectify/features/feed/models/feed_item_model.dart';
import 'package:connectify/features/feed/services/feed_service.dart';

class FeedProvider extends ChangeNotifier {
  final FeedService _feedService = FeedService();

  List<FeedItemModel> _feedItems = [];
  bool _isLoading = false;
  bool _isFetchingMore = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;
  bool _usePersonalized = false;

  List<FeedItemModel> get feedItems => _feedItems;
  bool get isLoading => _isLoading;
  bool get isFetchingMore => _isFetchingMore;
  String? get error => _error;
  bool get hasMore => _hasMore;
  bool get usePersonalized => _usePersonalized;

  Future<void> loadFeed({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
    }

    if (_currentPage == 1) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    } else {
      _isFetchingMore = true;
      notifyListeners();
    }

    try {
      final posts = await _feedService.getFeed(
        personalized: _usePersonalized,
        page: _currentPage,
      );

      if (refresh) {
        _feedItems = posts;
      } else {
        _feedItems.addAll(posts);
      }

      if (posts.isEmpty || posts.length < 10) {
        _hasMore = false;
      } else {
        _currentPage++;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      _isFetchingMore = false;
      notifyListeners();
    }
  }

  void toggleFeedType() {
    _usePersonalized = !_usePersonalized;
    loadFeed(refresh: true);
  }

  void addNewPostLocally(FeedItemModel newPost) {
    _feedItems.insert(0, newPost);
    notifyListeners();
  }
}
