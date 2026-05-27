import 'package:flutter/material.dart';
import 'package:connectify/core/constants/app_colors.dart';
import 'package:connectify/features/feed/models/feed_item_model.dart';

class PostCard extends StatefulWidget {
  final FeedItemModel post;

  const PostCard({
    super.key,
    required this.post,
  });

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  bool _isLiked = false;
  int _likesCount = 0;

  @override
  void initState() {
    super.initState();
    _likesCount = widget.post.likesCount;
  }

  void _handleLike() {
    setState(() {
      _isLiked = !_isLiked;
      _likesCount = _isLiked ? _likesCount + 1 : _likesCount - 1;
    });
  }

  @override
  Widget build(BuildContext context) {
    final author = widget.post.author;
    final timeStr = _formatTime(widget.post.createdAt);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header (Avatar + Username + Time) ─────────────────────────
          Row(
            children: [
              _buildAvatar(author),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      author?.username ?? 'Anonymous',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      timeStr,
                      style: const TextStyle(
                        color: AppColors.textHint,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.more_horiz, color: AppColors.textSecondary),
                onPressed: () {},
              ),
            ],
          ),
          const SizedBox(height: 12),

          // ── Caption / Description ─────────────────────────────────────
          if (widget.post.caption != null && widget.post.caption!.isNotEmpty) ...[
            Text(
              widget.post.caption!,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 12),
          ],

          // ── Media Block (Image or Video) ──────────────────────────────
          if (widget.post.mediaUrl != null && widget.post.mediaUrl!.isNotEmpty) ...[
            _buildMedia(widget.post.mediaUrl!),
            const SizedBox(height: 16),
          ],

          // ── Bottom Action Row (Likes & Comments) ──────────────────────
          Row(
            children: [
              // Like Button
              GestureDetector(
                onTap: _handleLike,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: _isLiked 
                        ? AppColors.primary.withOpacity(0.15) 
                        : AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _isLiked ? Icons.favorite : Icons.favorite_border_rounded,
                        color: _isLiked ? AppColors.primary : AppColors.textSecondary,
                        size: 18,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '$_likesCount',
                        style: TextStyle(
                          color: _isLiked ? AppColors.primary : AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Comment Button
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.chat_bubble_outline_rounded,
                      color: AppColors.textSecondary,
                      size: 18,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${widget.post.commentsCount}',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar(FeedAuthor? author) {
    if (author?.avatarUrl != null && author!.avatarUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: 20,
        backgroundColor: AppColors.surfaceLight,
        backgroundImage: NetworkImage(author.avatarUrl!),
      );
    }

    final initials = author?.username.isNotEmpty == true 
        ? author!.username[0].toUpperCase() 
        : 'A';

    return CircleAvatar(
      radius: 20,
      backgroundColor: AppColors.primary.withOpacity(0.2),
      child: Text(
        initials,
        style: const TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.bold,
          fontSize: 16,
        ),
      ),
    );
  }

  Widget _buildMedia(String url) {
    final lowerUrl = url.toLowerCase();
    final isVideo = lowerUrl.contains('.mp4') || lowerUrl.contains('.mov') || lowerUrl.contains('.avi');

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: AppColors.surfaceLight,
      ),
      clipBehavior: Clip.antiAlias,
      child: isVideo
          ? AspectRatio(
              aspectRatio: 16 / 9,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    color: Colors.black26,
                    child: const Icon(Icons.video_library_outlined, size: 48, color: AppColors.textSecondary),
                  ),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(
                      color: Colors.black45,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.play_arrow_rounded, size: 36, color: Colors.white),
                  ),
                ],
              ),
            )
          : Image.network(
              url,
              fit: BoxFit.cover,
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Container(
                  height: 200,
                  alignment: Alignment.center,
                  child: CircularProgressIndicator(
                    value: loadingProgress.expectedTotalBytes != null
                        ? loadingProgress.cumulativeBytesLoaded /
                            loadingProgress.expectedTotalBytes!
                        : null,
                    strokeWidth: 2,
                    color: AppColors.primary,
                  ),
                );
              },
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  height: 120,
                  color: AppColors.surfaceLight,
                  alignment: Alignment.center,
                  child: const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.broken_image_outlined, color: AppColors.textHint),
                      SizedBox(height: 8),
                      Text('Failed to load image', style: TextStyle(color: AppColors.textHint, fontSize: 12)),
                    ],
                  ),
                );
              },
            ),
    );
  }

  String _formatTime(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inSeconds < 60) {
      return 'just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}
