import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'api_client.dart';

class AuthUser {
  final String id;
  final String email;
  final String name;
  final String role;
  AuthUser({required this.id, required this.email, required this.name, required this.role});
  factory AuthUser.fromJson(Map<String, dynamic> j) => AuthUser(
        id: j['id'],
        email: j['email'],
        name: j['name'],
        role: j['role'],
      );
}

class AuthState {
  final AuthUser? user;
  final bool loading;
  const AuthState({this.user, this.loading = false});
  AuthState copyWith({AuthUser? user, bool? loading, bool clearUser = false}) =>
      AuthState(user: clearUser ? null : (user ?? this.user), loading: loading ?? this.loading);
}

class AuthNotifier extends StateNotifier<AuthState> {
  final Dio _dio;
  final FlutterSecureStorage _storage;
  AuthNotifier(this._dio, this._storage) : super(const AuthState()) {
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final token = await _storage.read(key: 'access_token');
    if (token == null) return;
    await _loadMe();
  }

  Future<void> _saveTokens(String access, String refresh) async {
    await _storage.write(key: 'access_token', value: access);
    await _storage.write(key: 'refresh_token', value: refresh);
  }

  Future<void> _loadMe() async {
    try {
      final r = await _dio.get('/users/me');
      state = state.copyWith(user: AuthUser.fromJson(r.data));
    } catch (_) {
      await logout();
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(loading: true);
    try {
      final r = await _dio.post('/auth/login', data: {'email': email, 'password': password});
      await _saveTokens(r.data['accessToken'], r.data['refreshToken']);
      await _loadMe();
    } finally {
      state = state.copyWith(loading: false);
    }
  }

  Future<void> register(String email, String name, String password) async {
    state = state.copyWith(loading: true);
    try {
      final r = await _dio.post(
        '/auth/register',
        data: {'email': email, 'name': name, 'password': password},
      );
      await _saveTokens(r.data['accessToken'], r.data['refreshToken']);
      await _loadMe();
    } finally {
      state = state.copyWith(loading: false);
    }
  }

  Future<void> oauth(String provider, String idToken) async {
    final r = await _dio.post('/auth/oauth', data: {'provider': provider, 'idToken': idToken});
    await _saveTokens(r.data['accessToken'], r.data['refreshToken']);
    await _loadMe();
  }

  Future<void> logout() async {
    final refresh = await _storage.read(key: 'refresh_token');
    if (refresh != null) {
      try {
        await _dio.post('/auth/logout', data: {'refreshToken': refresh});
      } catch (_) {}
    }
    await _storage.deleteAll();
    state = state.copyWith(clearUser: true);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(apiClientProvider), ref.watch(secureStorageProvider));
});
