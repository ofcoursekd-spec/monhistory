import 'dart:io';

import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

/// Enregistre le device token côté backend après autorisation FCM.
Future<void> registerPushToken(Dio dio) async {
  final messaging = FirebaseMessaging.instance;
  final settings = await messaging.requestPermission();
  if (settings.authorizationStatus == AuthorizationStatus.denied) return;
  final token = await messaging.getToken();
  if (token == null) return;
  await dio.post(
    '/notifications/devices',
    data: {'token': token, 'platform': Platform.isIOS ? 'ios' : 'android'},
  );
}
