import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:connectify/app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Force light status bar icons on the dark background
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      statusBarBrightness: Brightness.dark,
    ),
  );

  runApp(const ConnectifyApp());
}
