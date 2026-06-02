import 'package:go_router/go_router.dart';

import '../features/auth/auth_screen.dart';
import '../features/home/home_screen.dart';
import '../features/library/library_screen.dart';
import '../features/book/book_screen.dart';
import '../features/reader/reader_screen.dart';
import '../features/reader/tiktok_reader_screen.dart';
import '../features/subscription/subscription_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/shell/main_shell.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    ShellRoute(
      builder: (context, state, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
        GoRoute(path: '/bibliotheque', builder: (_, __) => const LibraryScreen()),
        GoRoute(path: '/abonnement', builder: (_, __) => const SubscriptionScreen()),
        GoRoute(path: '/profil', builder: (_, __) => const ProfileScreen()),
      ],
    ),
    GoRoute(
      path: '/livre/:slug',
      builder: (_, state) => BookScreen(slug: state.pathParameters['slug']!),
    ),
    GoRoute(
      path: '/lire/:chapterId',
      builder: (_, state) => ReaderScreen(chapterId: state.pathParameters['chapterId']!),
    ),
    GoRoute(
      path: '/tiktok/:chapterId',
      builder: (_, state) => TikTokReaderScreen(chapterId: state.pathParameters['chapterId']!),
    ),
    GoRoute(path: '/auth', builder: (_, __) => const AuthScreen()),
  ],
);
