import 'package:flutter/material.dart';
import 'package:connectify/routes/app_routes.dart';
import 'package:connectify/features/splash/splash_screen.dart';
import 'package:connectify/features/auth/screens/login_screen.dart';
import 'package:connectify/features/auth/screens/signup_screen.dart';
import 'package:connectify/shared/widgets/app_scaffold.dart';

/// Route generator for the Connectify app.
class AppPages {
  AppPages._();

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.splash:
        return _fadeRoute(const SplashScreen(), settings);
      case AppRoutes.login:
        return _slideRoute(const LoginScreen(), settings);
      case AppRoutes.signup:
        return _slideRoute(const SignupScreen(), settings);
      case AppRoutes.home:
        return _fadeRoute(const AppScaffold(), settings);
      default:
        return MaterialPageRoute(
          builder: (_) => const Scaffold(
            body: Center(child: Text('Page not found')),
          ),
          settings: settings,
        );
    }
  }

  /// Fade transition for splash → next screen.
  static PageRouteBuilder _fadeRoute(Widget page, RouteSettings settings) {
    return PageRouteBuilder(
      settings: settings,
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, __, child) {
        return FadeTransition(opacity: animation, child: child);
      },
      transitionDuration: const Duration(milliseconds: 400),
    );
  }

  /// Slide-up transition for auth screens.
  static PageRouteBuilder _slideRoute(Widget page, RouteSettings settings) {
    return PageRouteBuilder(
      settings: settings,
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, __, child) {
        const begin = Offset(0.0, 0.05);
        const end = Offset.zero;
        final tween = Tween(begin: begin, end: end)
            .chain(CurveTween(curve: Curves.easeOutCubic));
        return SlideTransition(
          position: animation.drive(tween),
          child: FadeTransition(opacity: animation, child: child),
        );
      },
      transitionDuration: const Duration(milliseconds: 350),
    );
  }
}
