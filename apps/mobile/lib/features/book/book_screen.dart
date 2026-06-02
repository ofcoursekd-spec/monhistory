import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
import '../../core/auth.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

final bookProvider = FutureProvider.family<BookDetail, String>((ref, slug) async {
  final dio = ref.watch(apiClientProvider);
  final res = await dio.get('/books/$slug');
  return BookDetail.fromJson(res.data);
});

final favoriteStateProvider = StateProvider.family<bool, String>((ref, bookId) => false);

class BookScreen extends ConsumerStatefulWidget {
  final String slug;
  const BookScreen({super.key, required this.slug});
  @override
  ConsumerState<BookScreen> createState() => _BookScreenState();
}

class _BookScreenState extends ConsumerState<BookScreen> {
  bool _busyBuy = false;

  Future<void> _checkFavorite(String bookId) async {
    try {
      final r = await ref.read(apiClientProvider).get('/favorites');
      final favs = (r.data as List).map((j) => j['bookId'] as String).toSet();
      if (mounted) {
        ref.read(favoriteStateProvider(bookId).notifier).state = favs.contains(bookId);
      }
    } catch (_) {}
  }

  Future<void> _toggleFavorite(String bookId) async {
    if (ref.read(authProvider).user == null) {
      if (mounted) context.push('/auth');
      return;
    }
    final dio = ref.read(apiClientProvider);
    final notifier = ref.read(favoriteStateProvider(bookId).notifier);
    final wasActive = notifier.state;
    notifier.state = !wasActive;
    try {
      if (wasActive) {
        await dio.delete('/favorites/$bookId');
      } else {
        await dio.post('/favorites/$bookId');
      }
    } catch (_) {
      notifier.state = wasActive;
    }
  }

  Future<void> _buy(String bookId) async {
    if (ref.read(authProvider).user == null) {
      if (mounted) context.push('/auth');
      return;
    }
    setState(() => _busyBuy = true);
    try {
      final r = await ref.read(apiClientProvider).post(
        '/purchases',
        data: {
          'bookId': bookId,
          'callbackUrl': 'monhistory://paiement/retour?type=purchase',
        },
      );
      await launchUrl(
        Uri.parse(r.data['checkoutUrl'] as String),
        mode: LaunchMode.externalApplication,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur : ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _busyBuy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final book = ref.watch(bookProvider(widget.slug));
    return Scaffold(
      appBar: AppBar(),
      body: book.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (b) {
          // Lance la vérification du statut favori une seule fois.
          WidgetsBinding.instance.addPostFrameCallback((_) => _checkFavorite(b.id));
          final isFav = ref.watch(favoriteStateProvider(b.id));
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Center(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: CachedNetworkImage(
                    imageUrl: b.coverImageUrl,
                    width: 200,
                    height: 300,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      b.category.replaceAll('_', ' '),
                      style: const TextStyle(
                        color: AppColors.brand,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => _toggleFavorite(b.id),
                    icon: Icon(
                      isFav ? Icons.favorite : Icons.favorite_border,
                      color: AppColors.brand,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(b.title, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
              Text('par ${b.author}', style: TextStyle(color: Colors.grey.shade600)),
              const SizedBox(height: 16),
              Text(b.description, style: const TextStyle(height: 1.5)),
              const SizedBox(height: 20),
              if (b.chapters.isNotEmpty) ...[
                FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.brand,
                    minimumSize: const Size.fromHeight(52),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  ),
                  onPressed: () => context.push('/lire/${b.chapters.first.id}'),
                  child: const Text('Commencer à lire'),
                ),
                const SizedBox(height: 8),
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                  ),
                  onPressed: () => context.push('/tiktok/${b.chapters.first.id}'),
                  child: const Text('Mode immersif (swipe)'),
                ),
                if (b.price > 0) ...[
                  const SizedBox(height: 8),
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(48),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                    ),
                    onPressed: _busyBuy ? null : () => _buy(b.id),
                    child: Text('Acheter — ${b.price} FCFA'),
                  ),
                ],
              ],
              const SizedBox(height: 24),
              const Text('Chapitres', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 8),
              for (final c in b.chapters)
                Card(
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  child: ListTile(
                    onTap: () => context.push('/lire/${c.id}'),
                    title: Text(c.title),
                    subtitle: Text('Chapitre ${c.number}'),
                    trailing: c.number == 1
                        ? const Chip(label: Text('Aperçu gratuit'), backgroundColor: Color(0xFFE7F8E9))
                        : const Chip(label: Text('Premium'), backgroundColor: Color(0xFFFFFBEB)),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
