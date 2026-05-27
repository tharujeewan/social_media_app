import 'package:flutter/material.dart';
import 'package:connectify/core/constants/app_colors.dart';
import 'package:connectify/core/constants/app_sizes.dart';
import 'package:connectify/core/constants/app_strings.dart';

/// Social login buttons section (Google, etc.).
class SocialLoginForm extends StatelessWidget {
  const SocialLoginForm({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: AppSizes.buttonHeight,
      child: OutlinedButton.icon(
        onPressed: () {
          // TODO: Implement Google Sign-In
        },
        icon: Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: AppColors.surfaceLight,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.divider, width: 1),
          ),
          child: const Center(
            child: Text('G',
                style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w700)),
          ),
        ),
        label: const Text(AppStrings.continueWithGoogle,
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimary,
          side: const BorderSide(color: AppColors.inputBorder),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppSizes.radiusLg)),
          backgroundColor: AppColors.googleButton,
        ),
      ),
    );
  }
}
