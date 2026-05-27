import 'package:flutter/material.dart';
import 'package:connectify/core/constants/app_colors.dart';
import 'package:connectify/features/feed/widgets/creator_suggestion_tile.dart';

class SuggestedCreatorsCard extends StatelessWidget {
  const SuggestedCreatorsCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 4.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Suggested Creators',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'See all',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 155,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: const [
                CreatorSuggestionTile(
                  username: 'Alex Rivera',
                  handle: '@alexr_dev',
                ),
                CreatorSuggestionTile(
                  username: 'Jane Doe',
                  handle: '@janedoe',
                ),
                CreatorSuggestionTile(
                  username: 'Sarah Jenkins',
                  handle: '@sarah_design',
                ),
                CreatorSuggestionTile(
                  username: 'Michael Scott',
                  handle: '@mscott',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
