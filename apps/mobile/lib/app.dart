import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'core/router.dart';
import 'core/theme.dart';

class MonHistoryApp extends StatelessWidget {
  const MonHistoryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'MonHistory',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.brand,
          primary: AppColors.brand,
          secondary: AppColors.accent,
        ),
        scaffoldBackgroundColor: Colors.white,
        textTheme: GoogleFonts.interTextTheme(),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: AppColors.ink,
          elevation: 0,
          centerTitle: false,
        ),
      ),
      routerConfig: appRouter,
    );
  }
}
