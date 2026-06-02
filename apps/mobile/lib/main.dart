import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    // Nécessite google-services.json (Android) / GoogleService-Info.plist (iOS).
    // Si Firebase n'est pas encore configuré, on ignore — push.dart vérifiera lui-même.
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase init skipped: $e');
  }
  runApp(const ProviderScope(child: MonHistoryApp()));
}
