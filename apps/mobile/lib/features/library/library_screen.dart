import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/models.dart';

final continueReadingProvider = FutureProvider<List<dynamic>>((ref) async {
  final res = await ref.watch(apiClientProvider).get('/reading/continue');
  return res.data as List;
});

final purchasesProvider = FutureProvider<List<BookSummary>>((ref) async {
  final res = await ref.watch(apiClientProvider).get('/purchases');
  return (res.data as List).map((j) => BookSummary.fromJson(j['book'])).toList();
});

final favoritesProvider = FutureProvider<List<BookSummary>>((ref) async {
  final res = await ref.watch(apiClientProvider).get('/favorites');
  return (res.data as List).map((j) => BookSummary.fromJson(j['book'])).toList();
});

class LibraryScreen extends ConsumerWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Ma bibliothèque',
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
          const SizedBox(height: 24),
          _Section(
            title: 'Continuer la lecture',
            child: ref.watch(continueReadingProvider).when(
                  loading: () => const SizedBox(height: 160, child: Center(child: CircularProgressIndicator())),
                  error: (_, __) => const Text('Erreur'),
                  data: (items) => _HContinueList(items: items),
                ),
          ),
          _Section(
            title: 'Livres achetés',
            child: ref.watch(purchasesProvider).when(
                  loading: () => const SizedBox(height: 240),
                  error: (_, __) => const Text('Erreur'),
                  data: (items) => _HBookList(items: items),
                ),
          ),
          _Section(
            title: 'Favoris',
            child: ref.watch(favoritesProvider).when(
                  loading: () => const SizedBox(height: 240),
                  error: (_, __) => const Text('Erreur'),
                  data: (items) => _HBookList(items: items),
                ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final Widget child;
  const _Section({required this.title, required this.child});
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        child,
        const SizedBox(height: 24),
      ],
    );
  }
}

class _HBookList extends StatelessWidget {
  final List<BookSummary> items;
  const _HBookList({required this.items});
  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Text('Rien pour l’instant.', style: TextStyle(color: Colors.grey.shade600));
    }
    return SizedBox(
      height: 240,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final b = items[i];
          return GestureDetector(
            onTap: () => context.push('/livre/${b.slug}'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedNetworkImage(
                    imageUrl: b.coverImageUrl,
                    width: 130,
                    height: 195,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(height: 6),
                SizedBox(
                  width: 130,
                  child: Text(b.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _HContinueList extends StatelessWidget {
  final List<dynamic> items;
  const _HContinueList({required this.items});
  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Text('Aucun chapitre en cours.', style: TextStyle(color: Colors.grey.shade600));
    }
    return SizedBox(
      height: 240,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final p = items[i];
          final book = p['chapter']['book'];
          return GestureDetector(
            onTap: () => context.push('/lire/${p['chapter']['id']}'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: CachedNetworkImage(
                    imageUrl: book['coverImageUrl'],
                    width: 130,
                    height: 195,
                    fit: BoxFit.cover,
                  ),
                ),
                const SizedBox(height: 6),
                SizedBox(
                  width: 130,
                  child: Text(
                    'Ch. ${p['chapter']['number']} · p.${p['lastPage']}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF7C1D3F),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                SizedBox(
                  width: 130,
                  child: Text(book['title'], maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
