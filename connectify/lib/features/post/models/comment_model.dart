class CommentAuthor {
  final String id;
  final String username;
  final String? avatarUrl;

  const CommentAuthor({
    required this.id,
    required this.username,
    this.avatarUrl,
  });

  factory CommentAuthor.fromJson(Map<String, dynamic> json) {
    return CommentAuthor(
      id: json['id'] as String? ?? '',
      username: json['username'] as String? ?? '',
      avatarUrl: json['avatar_url'] as String?,
    );
  }
}

class CommentModel {
  final String id;
  final String body;
  final String? parentId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final CommentAuthor? user;

  const CommentModel({
    required this.id,
    required this.body,
    this.parentId,
    required this.createdAt,
    required this.updatedAt,
    this.user,
  });

  factory CommentModel.fromJson(Map<String, dynamic> json) {
    return CommentModel(
      id: json['id'] as String? ?? '',
      body: json['body'] as String? ?? '',
      parentId: json['parent_id'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : DateTime.now(),
      user: json['user'] != null
          ? CommentAuthor.fromJson(json['user'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'body': body,
        'parent_id': parentId,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
        'user': user != null
            ? {
                'id': user!.id,
                'username': user!.username,
                'avatar_url': user!.avatarUrl,
              }
            : null,
      };

  CommentModel copyWith({String? body}) {
    return CommentModel(
      id: id,
      body: body ?? this.body,
      parentId: parentId,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
      user: user,
    );
  }
}
