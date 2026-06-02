import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'reader_screen.dart' show chapterProvider;

/// Mode "TikTok" : une page = un écran plein, swipe vertical entre les pages.
/// Pour lecteurs qui préfèrent l'immersion plutôt que le scroll continu.
class TikTokReaderScreen extends ConsumerWidget {
  final String chapterId;
  const TikTokReaderScreen({super.key, required this.chapterId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chapter = ref.watch(chapterProvider(chapterId));
    return Scaffold(
      backgroundColor: Colors.black,
      body: chapter.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Colors.white)),
        error: (e, _) => Center(child: Text('Erreur : $e', style: const TextStyle(color: Colors.white))),
        data: (c) => PageView.builder(
          scrollDirection: Axis.vertical,
          itemCount: c.pages.length,
          // Garde 2 pages avant/après en RAM pour des transitions instantanées.
          allowImplicitScrolling: true,
          itemBuilder: (_, i) {
            final p = c.pages[i];
            // Précharge les 2 pages suivantes en cache disque.
            for (var k = 1; k <= 2; k++) {
              if (i + k < c.pages.length) {
                final url = c.pages[i + k].imageUrl;
                if (url.isNotEmpty) {
                  precacheImage(CachedNetworkImageProvider(url), context);
                }
              }
            }
            return Stack(
              fit: StackFit.expand,
              children: [
                CachedNetworkImage(
                  imageUrl: p.imageUrl,
                  fit: BoxFit.cover,
                  fadeInDuration: const Duration(milliseconds: 150),
                  placeholder: (_, __) => Container(color: Colors.grey.shade900),
                ),
                Positioned(
                  top: 40,
                  left: 16,
                  child: SafeArea(
                    child: Row(children: [
                      IconButton(
                        onPressed: () => Navigator.maybePop(context),
                        icon: const Icon(Icons.close, color: Colors.white),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${c.title} · ${i + 1}/${c.pages.length}',
                        style: const TextStyle(color: Colors.white),
                      ),
                    ]),
                  ),
                ),
                if (p.description != null)
                  Positioned(
                    bottom: 80,
                    left: 16,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(p.description!, style: const TextStyle(color: Colors.white)),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    );
  }
}
