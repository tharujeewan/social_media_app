import 'package:flutter/material.dart';

/// Centralized color palette for the Connectify app.
/// Dark-themed social media design with indigo accent colors.
class AppColors {
  AppColors._();

  // ── Primary Brand Colors ──────────────────────────────────────────────
  static const Color primary = Color(0xFF6C63FF);
  static const Color primaryLight = Color(0xFF8F88FF);
  static const Color primaryDark = Color(0xFF5048CC);

  // ── Background Colors ─────────────────────────────────────────────────
  static const Color background = Color(0xFF0F0E17);
  static const Color surface = Color(0xFF1C1B2E);
  static const Color surfaceLight = Color(0xFF2A2846);
  static const Color card = Color(0xFF1C1B2E);

  // ── Text Colors ───────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFFEEEDFE);
  static const Color textSecondary = Color(0xFF9B97C4);
  static const Color textHint = Color(0xFF6C6A8A);
  static const Color textLink = Color(0xFF6C63FF);

  // ── Input Field Colors ────────────────────────────────────────────────
  static const Color inputBackground = Color(0xFF1C1B2E);
  static const Color inputBorder = Color(0xFF3E3C5E);
  static const Color inputBorderFocused = Color(0xFF6C63FF);

  // ── Status / Feedback Colors ──────────────────────────────────────────
  static const Color error = Color(0xFFFF6B6B); // Kept default for consistency
  static const Color success = Color(0xFF1D9E75);
  static const Color warning = Color(0xFFEF9F27);
  static const Color info = Color(0xFF74C0FC); // Kept default for consistency

  // ── Icon Colors ───────────────────────────────────────────────────────
  static const Color iconPrimary = Color(0xFFEEEDFE);
  static const Color iconSecondary = Color(0xFF9B97C4);

  // ── Divider / Separator ───────────────────────────────────────────────
  static const Color divider = Color(0xFF3E3C5E);

  // ── Social Login ──────────────────────────────────────────────────────
  static const Color googleButton = Color(0xFF1C1B2E);
  static const Color googleButtonBorder = Color(0xFF3E3C5E);

  // ── Gradient ──────────────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF6C63FF), Color(0xFF8F88FF)],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  static const LinearGradient backgroundGradient = LinearGradient(
    colors: [Color(0xFF0F0E17), Color(0xFF1C1B2E)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient splashGradient = LinearGradient(
    colors: [Color(0xFF0F0E17), Color(0xFF151424), Color(0xFF0F0E17)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
