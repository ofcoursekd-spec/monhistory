import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _baseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://10.0.2.2:3000/api/v1', // 10.0.2.2 = host depuis l'émulateur Android
);

final secureStorageProvider = Provider((_) => const FlutterSecureStorage());

final apiClientProvider = Provider<Dio>((ref) {
  final storage = ref.read(secureStorageProvider);
  final dio = Dio(BaseOptions(
    baseUrl: _baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 15),
  ));

  // Dio dédié au refresh (sans intercepteur — évite la boucle).
  final refreshDio = Dio(BaseOptions(baseUrl: _baseUrl));

  Future<String?> tryRefresh() async {
    final refresh = await storage.read(key: 'refresh_token');
    if (refresh == null) return null;
    try {
      final r = await refreshDio.post('/auth/refresh', data: {'refreshToken': refresh});
      final access = r.data['accessToken'] as String;
      final newRefresh = r.data['refreshToken'] as String;
      await storage.write(key: 'access_token', value: access);
      await storage.write(key: 'refresh_token', value: newRefresh);
      return access;
    } catch (_) {
      await storage.deleteAll();
      return null;
    }
  }

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final token = await storage.read(key: 'access_token');
      if (token != null) options.headers['Authorization'] = 'Bearer $token';
      handler.next(options);
    },
    onError: (err, handler) async {
      if (err.response?.statusCode == 401 && err.requestOptions.extra['retried'] != true) {
        final newToken = await tryRefresh();
        if (newToken != null) {
          final retry = err.requestOptions
            ..headers['Authorization'] = 'Bearer $newToken'
            ..extra['retried'] = true;
          try {
            final response = await dio.fetch(retry);
            return handler.resolve(response);
          } catch (e) {
            return handler.next(e is DioException ? e : err);
          }
        }
      }
      handler.next(err);
    },
  ));
  return dio;
});
