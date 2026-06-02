import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/models.dart';
import '../../core/theme.dart';

final chapterProvider = FutureProvider.family<ChapterDetail, String>((ref, id) async {
  final dio = ref.watch(apiClientProvider);
  final res = await dio.get('/chapters/$id');
  return ChapterDetail.fromJson(res.data);
});

/// Lecteur vertical style Webtoon. Sauvegarde la progression toutes les 800ms.
class ReaderScreen extends ConsumerStatefulWidget {
  final String chapterId;
  const ReaderScreen({super.key, required this.chapterId});

  @override
  ConsumerState<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends ConsumerState<ReaderScreen> {
  final _controller = ScrollController();
  Timer? _saveTimer;
  bool _dark = false;
  int _lastPage = 1;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_onScroll);
  }

  @override
  void dispose() {
    _saveTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onScroll() {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(milliseconds: 800), _saveProgress);
  }

  Future<void> _saveProgress() async {
    try {
      await ref.read(apiClientProvider).post(
        '/reading/progress',
        data: {'chapterId': widget.chapterId, 'lastPage': _lastPage},
      );
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final chapter = ref.watch(chapterProvider(widget.chapterId));
    final bg = _dark ? const Color(0xFF0A0A0A) : Colors.white;
    final fg = _dark ? Colors.white : AppColors.ink;
    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: bg,
        foregroundColor: fg,
        actions: [
          IconButton(
            onPressed: () => setState(() => _dark = !_dark),
            icon: Icon(_dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
          ),
        ],
      ),
      body: chapter.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e', style: TextStyle(color: fg))),
        data: (c) => Stack(
          children: [
            ListView.builder(
              controller: _controller,
              itemCount: c.pages.length + (c.preview ? 2 : 1),
              itemBuilder: (_, i) {
                if (i == 0) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: Column(
                      children: [
                        Text(
                          'CHAPITRE ${c.number}',
                          style: const TextStyle(
                            color: AppColors.brand,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          c.title,
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: fg,
                          ),
                        ),
                      ],
                    ),
                  );
                }
                if (c.preview && i == c.pages.length + 1) {
                  return _Paywall(
                    dark: _dark,
                    hidden: c.totalPages - c.pages.length,
                    bookSlug: c.bookSlug,
                  );
                }
                final p = c.pages[i - 1];
                _lastPage = p.order;

                // Précharge les 2 pages suivantes dès qu'on touche celle-ci.
                // cached_network_image les mettra en cache disque ; quand le
                // user scrollera, l'affichage sera instantané.
                for (var k = 1; k <= 2; k++) {
                  final nextIndex = i - 1 + k;
                  if (nextIndex < c.pages.length) {
                    final nextUrl = c.pages[nextIndex].imageUrl;
                    if (nextUrl.isNotEmpty) {
                      precacheImage(CachedNetworkImageProvider(nextUrl), context);
                    }
                  }
                }

                return Column(
                  children: [
                    CachedNetworkImage(
                      imageUrl: p.imageUrl,
                      fit: BoxFit.fitWidth,
                      width: double.infinity,
                      fadeInDuration: const Duration(milliseconds: 200),
                      placeholder: (_, __) => AspectRatio(
                        aspectRatio: 3 / 4,
                        child: Container(
                          color: _dark ? Colors.grey.shade900 : Colors.grey.shade200,
                        ),
                      ),
                      errorWidget: (_, __, ___) => AspectRatio(
                        aspectRatio: 3 / 4,
                        child: Container(
                          color: _dark ? Colors.grey.shade900 : Colors.grey.shade100,
                          child: Center(
                            child: Text(
                              'Page ${p.order} non disponible',
                              style: TextStyle(color: fg.withValues(alpha: 0.5)),
                            ),
                          ),
                        ),
                      ),
                    ),
                    if (p.description != null)
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(
                          p.description!,
                          style: TextStyle(color: fg.withValues(alpha: 0.7)),
                        ),
                      ),
                  ],
                );
              },
            ),
            Positioned(
              bottom: 24,
              left: 0,
              right: 0,
              child: Center(
                child: _ReactionsBar(chapterId: c.id, dark: _dark),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Paywall extends StatelessWidget {
  final bool dark;
  final int hidden;
  final String bookSlug;
  const _Paywall({required this.dark, required this.hidden, required this.bookSlug});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 24, 16, 80),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: dark
              ? [Colors.grey.shade900, Colors.grey.shade800]
              : [AppColors.brand.withValues(alpha: 0.1), AppColors.accent.withValues(alpha: 0.1)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          const Text(
            'APERÇU TERMINÉ',
            style: TextStyle(
              color: AppColors.brand,
              fontWeight: FontWeight.bold,
              letterSpacing: 2,
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Il reste $hidden page${hidden > 1 ? 's' : ''} à découvrir.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: dark ? Colors.white : AppColors.ink,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Passe en Premium pour continuer cette histoire.',
            textAlign: TextAlign.center,
            style: TextStyle(color: dark ? Colors.white70 : Colors.grey.shade700),
          ),
          const SizedBox(height: 20),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.brand,
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
            ),
            onPressed: () => GoRouter.of(context).push('/abonnement'),
            child: const Text('Voir les offres Premium'),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => GoRouter.of(context).push('/livre/$bookSlug'),
            child: const Text('Acheter ce livre'),
          ),
        ],
      ),
    );
  }
}

class _ReactionsBar extends ConsumerWidget {
  final String chapterId;
  final bool dark;
  const _ReactionsBar({required this.chapterId, required this.dark});

  Future<void> _toggle(WidgetRef ref, String type) async {
    try {
      await ref.read(apiClientProvider).post(
        '/reactions/chapter/$chapterId/toggle',
        data: {'type': type},
      );
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: dark ? Colors.grey.shade900 : Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 6))],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(onPressed: () => _toggle(ref, 'LIKE'), icon: const Text('❤️', style: TextStyle(fontSize: 20))),
          IconButton(onPressed: () => _toggle(ref, 'TOUCHING'), icon: const Text('😢', style: TextStyle(fontSize: 20))),
          IconButton(onPressed: () => _toggle(ref, 'SHOCKING'), icon: const Text('😡', style: TextStyle(fontSize: 20))),
        ],
      ),
    );
  }
}
