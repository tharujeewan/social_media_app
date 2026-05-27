import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:connectify/features/auth/providers/auth_provider.dart';
import 'package:connectify/features/post/providers/create_post_provider.dart';
import 'package:connectify/routes/app_routes.dart';
import 'package:connectify/core/constants/app_colors.dart';
import 'package:connectify/features/home/screens/home_screen.dart';
import 'package:connectify/features/post/screens/create_post_screen.dart';
import 'package:connectify/shared/widgets/bottom_navbar.dart';
import 'package:connectify/features/feed/providers/feed_provider.dart';

class AppScaffold extends StatefulWidget {
  const AppScaffold({super.key});

  @override
  State<AppScaffold> createState() => _AppScaffoldState();
}

class _AppScaffoldState extends State<AppScaffold> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const HomeScreen(),
    const Center(child: Text('Explore Screen', style: TextStyle(color: AppColors.textPrimary))),
    const CreatePostScreen(),
    const Center(child: Text('Notifications Screen', style: TextStyle(color: AppColors.textPrimary))),
    const Center(child: Text('Profile Screen', style: TextStyle(color: AppColors.textPrimary))),
  ];

  final List<String> _titles = [
    'Connectify',
    'Explore',
    'New post',
    'Notifications',
    'Profile',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(context),
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    if (_currentIndex == 2) {
      final provider = context.watch<CreatePostProvider>();
      return AppBar(
        key: const ValueKey('create_post_appbar'),
        backgroundColor: AppColors.background,
        elevation: 0,
        leadingWidth: 80,
        leading: TextButton(
          onPressed: () {
            setState(() {
              _currentIndex = 0;
            });
          },
          child: const Text(
            'Cancel',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
          ),
        ),
        title: Text(
          _titles[_currentIndex],
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
        actions: [
          Container(
            padding: const EdgeInsets.only(right: 16.0),
            alignment: Alignment.center,
            child: ElevatedButton(
              onPressed: provider.isLoading ? null : () async {
                final success = await provider.publishPost();
                if (success && context.mounted) {
                  // Trigger a feed refresh so the newly created post shows up instantly
                  context.read<FeedProvider>().loadFeed(refresh: true);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Post published successfully!')),
                  );
                  setState(() => _currentIndex = 0);
                } else if (provider.error != null && context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(provider.error!)),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size(80, 36),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              child: provider.isLoading 
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Publish', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ),
        ],
      );
    }

    return AppBar(
      title: Text(_titles[_currentIndex]),
      actions: [
        IconButton(
          icon: const Icon(Icons.logout),
          onPressed: () async {
            await context.read<AuthProvider>().logout();
            if (context.mounted) {
              Navigator.pushReplacementNamed(context, AppRoutes.login);
            }
          },
        ),
      ],
    );
  }
}
