import 'package:connectify/features/feed/models/feed_item_model.dart';
import 'package:connectify/features/feed/repositories/feed_repository.dart';

class FeedService {
  final FeedRepository _repository = FeedRepository();

  Future<List<FeedItemModel>> getFeed({bool personalized = false, int page = 1}) async {
    if (personalized) {
      try {
        return await _repository.fetchPersonalizedFeed(page: page);
      } catch (_) {
        // Fallback to global feed if personalized feed fails/is empty
        return await _repository.fetchGlobalFeed(page: page);
      }
    } else {
      return await _repository.fetchGlobalFeed(page: page);
    }
  }
}
