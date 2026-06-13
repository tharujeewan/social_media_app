import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:connectify/core/constants/app_colors.dart';
import 'package:connectify/core/constants/app_sizes.dart';
import 'package:connectify/core/constants/app_strings.dart';
import 'package:connectify/features/auth/providers/auth_provider.dart';
import 'package:connectify/routes/app_routes.dart';

/// Social login buttons section (Google Sign-In via Firebase).
class SocialLoginForm extends StatelessWidget {
  const SocialLoginForm({super.key});

  Future<void> _handleGoogleSignIn(BuildContext context) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    final success = await authProvider.loginWithGoogle();

    if (!context.mounted) return;

    if (success) {
      Navigator.pushReplacementNamed(context, AppRoutes.home);
    } else if (authProvider.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.error!),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        return SizedBox(
          width: double.infinity,
          height: AppSizes.buttonHeight,
          child: OutlinedButton.icon(
            onPressed: auth.isLoading ? null : () => _handleGoogleSignIn(context),
            icon: Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: AppColors.surfaceLight,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.divider, width: 1),
              ),
              child: const Center(
                child: Text(
                  'G',
                  style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
            label: auth.isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.textPrimary,
                    ),
                  )
                : const Text(
                    AppStrings.continueWithGoogle,
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                  ),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.textPrimary,
              side: const BorderSide(color: AppColors.inputBorder),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppSizes.radiusLg),
              ),
              backgroundColor: AppColors.googleButton,
            ),
          ),
        );
      },
    );
  }
}
