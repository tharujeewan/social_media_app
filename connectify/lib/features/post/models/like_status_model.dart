class LikeStatusModel {
  final bool liked;
  final int likesCount;

  const LikeStatusModel({
    required this.liked,
    required this.likesCount,
  });

  factory LikeStatusModel.fromJson(Map<String, dynamic> json) {
    return LikeStatusModel(
      liked: json['liked'] as bool? ?? false,
      likesCount: json['likes_count'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'liked': liked,
        'likes_count': likesCount,
      };
}
