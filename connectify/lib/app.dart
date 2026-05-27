import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:connectify/core/theme/app_theme.dart';
import 'package:connectify/routes/app_pages.dart';
import 'package:connectify/routes/app_routes.dart';
import 'package:connectify/features/auth/providers/auth_provider.dart';
import 'package:connectify/features/post/providers/create_post_provider.dart';
import 'package:connectify/features/post/repositories/post_repository.dart';
import 'package:connectify/features/feed/providers/feed_provider.dart';

/// Root widget for the Connectify application.
class ConnectifyApp extends StatelessWidget {
  const ConnectifyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CreatePostProvider(PostRepository())),
        ChangeNotifierProvider(create: (_) => FeedProvider()),
      ],
      child: MaterialApp(
        title: 'Connectify',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        initialRoute: AppRoutes.splash,
        onGenerateRoute: AppPages.onGenerateRoute,
      ),
    );
  }
}
