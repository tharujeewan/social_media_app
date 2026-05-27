import 'package:flutter/material.dart';
import 'package:connectify/core/constants/app_colors.dart';

class CreatorSuggestionTile extends StatefulWidget {
  final String username;
  final String handle;
  final String? avatarUrl;

  const CreatorSuggestionTile({
    super.key,
    required this.username,
    required this.handle,
    this.avatarUrl,
  });

  @override
  State<CreatorSuggestionTile> createState() => _CreatorSuggestionTileState();
}

class _CreatorSuggestionTileState extends State<CreatorSuggestionTile> {
  bool _isFollowing = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider.withOpacity(0.05)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Avatar
          _buildAvatar(),
          const SizedBox(height: 8),

          // Username
          Text(
            widget.username,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 2),

          // Handle
          Text(
            widget.handle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.textHint,
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 12),

          // Follow Button
          SizedBox(
            width: double.infinity,
            height: 30,
            child: ElevatedButton(
              onPressed: () => setState(() => _isFollowing = !_isFollowing),
              style: ElevatedButton.styleFrom(
                backgroundColor: _isFollowing 
                    ? AppColors.surfaceLight 
                    : AppColors.primary,
                foregroundColor: _isFollowing 
                    ? AppColors.textSecondary 
                    : Colors.white,
                elevation: 0,
                padding: EdgeInsets.zero,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
              ),
              child: Text(
                _isFollowing ? 'Following' : 'Follow',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar() {
    if (widget.avatarUrl != null && widget.avatarUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: 26,
        backgroundImage: NetworkImage(widget.avatarUrl!),
        backgroundColor: AppColors.surfaceLight,
      );
    }

    final initials = widget.username.isNotEmpty == true 
        ? widget.username[0].toUpperCase() 
        : 'U';

    return CircleAvatar(
      radius: 26,
      backgroundColor: AppColors.primary.withOpacity(0.15),
      child: Text(
        initials,
        style: const TextStyle(
          color: AppColors.primary,
          fontWeight: FontWeight.bold,
          fontSize: 20,
        ),
      ),
    );
  }
}
