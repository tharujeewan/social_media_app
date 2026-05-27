import 'dart:io';

class CreatePostModel {
  String postType;
  String title;
  String content;
  File? mediaFile;
  List<String> tags;

  CreatePostModel({
    this.postType = 'Tip',
    this.title = '',
    this.content = '',
    this.mediaFile,
    this.tags = const ['#Flutter', '#NodeJS'],
  });

  CreatePostModel copyWith({
    String? postType,
    String? title,
    String? content,
    File? mediaFile,
    List<String>? tags,
  }) {
    return CreatePostModel(
      postType: postType ?? this.postType,
      title: title ?? this.title,
      content: content ?? this.content,
      mediaFile: mediaFile ?? this.mediaFile,
      tags: tags ?? this.tags,
    );
  }
}
