import 'package:flutter/material.dart';
import 'package:connectify/core/constants/app_colors.dart';
import 'package:connectify/core/constants/app_sizes.dart';
import 'package:connectify/core/constants/app_strings.dart';
import 'package:connectify/features/auth/widgets/signup_form.dart';
import 'package:connectify/features/auth/widgets/social_login_form.dart';
import 'package:connectify/routes/app_routes.dart';

/// Signup screen matching the "Welcome back" design but for registration.
///
/// Features:
/// - App logo at top
/// - Full name, username, email + password fields with validation
/// - "Sign up" primary button
/// - "or continue with" divider
/// - Google social login
/// - "Already have an account? Sign in" footer
class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeIn;
  late final Animation<Offset> _slideUp;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeIn = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _slideUp = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: AppColors.backgroundGradient,
        ),
        child: SafeArea(
          child: SlideTransition(
            position: _slideUp,
            child: FadeTransition(
              opacity: _fadeIn,
              child: SingleChildScrollView(
                padding:
                    const EdgeInsets.symmetric(horizontal: AppSizes.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),

                    // ── Logo ──────────────────────────────────────────
                    _buildAppLogo(),
                    const SizedBox(height: AppSizes.xl),

                    // ── Welcome Text ──────────────────────────────────
                    Text(
                      AppStrings.createAccount,
                      style: Theme.of(context)
                          .textTheme
                          .headlineMedium
                          ?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                    ),
                    const SizedBox(height: AppSizes.sm),
                    Text(
                      AppStrings.joinCommunity,
                      style:
                          Theme.of(context).textTheme.bodyLarge?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                    ),
                    const SizedBox(height: AppSizes.xl),

                    // ── Signup Form ───────────────────────────────────
                    const SignupForm(),
                    const SizedBox(height: AppSizes.lg),

                    // ── Divider ───────────────────────────────────────
                    _buildDividerWithText(context),
                    const SizedBox(height: AppSizes.lg),

                    // ── Social Login ──────────────────────────────────
                    const SocialLoginForm(),
                    const SizedBox(height: AppSizes.xl),

                    // ── Login Link ────────────────────────────────────
                    _buildLoginLink(context),
                    const SizedBox(height: AppSizes.lg),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAppLogo() {
    return Container(
      width: AppSizes.logoSize,
      height: AppSizes.logoSize,
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(AppSizes.logoRadius),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.35),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: const Icon(
        Icons.chat_bubble_rounded,
        color: AppColors.iconPrimary,
        size: 28,
      ),
    );
  }

  Widget _buildDividerWithText(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: AppColors.divider)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSizes.md),
          child: Text(
            AppStrings.orContinueWith,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textHint,
                ),
          ),
        ),
        const Expanded(child: Divider(color: AppColors.divider)),
      ],
    );
  }

  Widget _buildLoginLink(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          AppStrings.alreadyHaveAccountSignIn,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
        GestureDetector(
          onTap: () {
            Navigator.pushReplacementNamed(context, AppRoutes.login);
          },
          child: Text(
            AppStrings.signIn,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.primaryLight,
                  fontWeight: FontWeight.w700,
                  decoration: TextDecoration.underline,
                  decorationColor: AppColors.primaryLight,
                ),
          ),
        ),
      ],
    );
  }
}
