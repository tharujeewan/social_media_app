import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:connectify/core/constants/app_colors.dart';
import 'package:connectify/features/post/providers/create_post_provider.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _contentController = TextEditingController();

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CreatePostProvider>();
    final postData = provider.postData;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Post Type section
          const Text(
            'POST TYPE',
            style: TextStyle(
              color: AppColors.textHint,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildTypeChip('Tip', postData.postType, provider),
              const SizedBox(width: 12),
              _buildTypeChip('Note', postData.postType, provider),
              const SizedBox(width: 12),
              _buildTypeChip('Project', postData.postType, provider),
            ],
          ),
          const SizedBox(height: 28),

          // Title section
          const Text(
            'Title',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _titleController,
            onChanged: provider.setTitle,
            style: const TextStyle(color: AppColors.textPrimary),
            decoration: _inputDecoration('Post title...'),
          ),
          const SizedBox(height: 24),

          // Content section
          const Text(
            'Content',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _contentController,
            onChanged: provider.setContent,
            maxLines: 5,
            style: const TextStyle(color: AppColors.textPrimary),
            decoration: _inputDecoration('Write your content here.\nShare what you know...'),
          ),

          const SizedBox(height: 12),
          const Divider(color: AppColors.divider, height: 40),

          // Attach Media section
          const Text(
            'ATTACH MEDIA',
            style: TextStyle(
              color: AppColors.textHint,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildMediaButton(
                  icon: Icons.videocam,
                  label: 'Video',
                  iconBgColor: AppColors.primary,
                  onTap: () => provider.pickMedia(true),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildMediaButton(
                  icon: Icons.image,
                  label: 'Photo',
                  iconBgColor: AppColors.success,
                  onTap: () => provider.pickMedia(false),
                ),
              ),
            ],
          ),
          if (postData.mediaFile != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.check_circle, color: AppColors.success, size: 16),
                const SizedBox(width: 8),
                const Text(
                  'Media selected',
                  style: TextStyle(color: AppColors.success, fontSize: 12),
                ),
                const Spacer(),
                TextButton(
                  onPressed: provider.removeMedia,
                  child: const Text('Remove', style: TextStyle(color: AppColors.error)),
                )
              ],
            )
          ],

          const Divider(color: AppColors.divider, height: 40),

          // Tags section
          const Text(
            'TAGS',
            style: TextStyle(
              color: AppColors.textHint,
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ...postData.tags.map((tag) => _buildTagChip(tag, provider)),
              _buildAddTagButton(context, provider),
            ],
          ),
          const SizedBox(height: 40), // Bottom padding
        ],
      ),
    );
  }

  Widget _buildTypeChip(String label, String selectedType, CreatePostProvider provider) {
    final isSelected = label == selectedType;
    return GestureDetector(
      onTap: () => provider.setPostType(label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.inputBorder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.textSecondary,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hintText) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: const TextStyle(color: AppColors.textHint),
      filled: true,
      fillColor: AppColors.inputBackground,
      contentPadding: const EdgeInsets.all(16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.inputBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.inputBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primary),
      ),
    );
  }

  Widget _buildMediaButton({
    required IconData icon,
    required String label,
    required Color iconBgColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppColors.inputBorder,
            width: 1.5,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconBgColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: Colors.white, size: 28),
            ),
            const SizedBox(height: 12),
            Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTagChip(String tag, CreatePostProvider provider) {
    return Chip(
      label: Text(tag),
      labelStyle: const TextStyle(color: AppColors.primary),
      backgroundColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppColors.primary),
      ),
      deleteIcon: const Icon(Icons.close, size: 16, color: AppColors.primary),
      onDeleted: () => provider.removeTag(tag),
    );
  }

  Widget _buildAddTagButton(BuildContext context, CreatePostProvider provider) {
    return GestureDetector(
      onTap: () {
        showDialog(
          context: context,
          builder: (context) {
            String newTag = '';
            return AlertDialog(
              backgroundColor: AppColors.surface,
              title: const Text('Add Tag', style: TextStyle(color: AppColors.textPrimary)),
              content: TextField(
                autofocus: true,
                style: const TextStyle(color: AppColors.textPrimary),
                decoration: _inputDecoration('#tagname'),
                onChanged: (val) => newTag = val,
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: () {
                    if (newTag.isNotEmpty) {
                      if (!newTag.startsWith('#')) newTag = '#$newTag';
                      provider.addTag(newTag);
                    }
                    Navigator.pop(context);
                  },
                  child: const Text('Add'),
                ),
              ],
            );
          }
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.inputBorder),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.add, size: 16, color: AppColors.textSecondary),
            SizedBox(width: 4),
            Text(
              'Add',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
