import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
import '../../core/auth.dart';
import '../../core/theme.dart';

class _Plan {
  final String code;
  final String name;
  final int price;
  final int durationDays;
  _Plan({required this.code, required this.name, required this.price, required this.durationDays});
  factory _Plan.fromJson(Map<String, dynamic> j) => _Plan(
        code: j['code'],
        name: j['name'],
        price: j['price'],
        durationDays: j['durationDays'],
      );
}

final planProvider = FutureProvider<_Plan?>((ref) async {
  final r = await ref.read(apiClientProvider).get('/subscriptions/plans');
  final list = (r.data as List).map((j) => _Plan.fromJson(j)).toList();
  return list.isEmpty ? null : list.first;
});

class SubscriptionScreen extends ConsumerStatefulWidget {
  const SubscriptionScreen({super.key});
  @override
  ConsumerState<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends ConsumerState<SubscriptionScreen> {
  bool _busy = false;

  Future<void> _subscribe(_Plan plan) async {
    if (ref.read(authProvider).user == null) {
      if (mounted) context.push('/auth');
      return;
    }
    setState(() => _busy = true);
    try {
      final r = await ref.read(apiClientProvider).post(
        '/subscriptions',
        data: {
          'planCode': plan.code,
          'callbackUrl': 'monhistory://paiement/retour?type=subscription',
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
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final plan = ref.watch(planProvider);
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text(
            'Lis sans limite.',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(
            'Un seul prix, accès à tout. Annule quand tu veux.',
            style: TextStyle(color: Colors.grey.shade700),
          ),
          const SizedBox(height: 32),
          plan.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (_, __) => const Text('Impossible de charger le plan.'),
            data: (p) {
              if (p == null) return const Text('Aucun plan actif.');
              return _PlanCard(plan: p, busy: _busy, onSubscribe: () => _subscribe(p));
            },
          ),
        ],
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final _Plan plan;
  final bool busy;
  final VoidCallback onSubscribe;
  const _PlanCard({required this.plan, required this.busy, required this.onSubscribe});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.brand.withValues(alpha: 0.06),
            AppColors.accent.withValues(alpha: 0.06),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.brand, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            plan.name.toUpperCase(),
            style: const TextStyle(
              color: AppColors.brand,
              fontWeight: FontWeight.bold,
              letterSpacing: 2,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${plan.price}',
                style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w800),
              ),
              const SizedBox(width: 4),
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(
                  'FCFA / ${plan.durationDays == 30 ? "mois" : "${plan.durationDays}j"}',
                  style: TextStyle(color: Colors.grey.shade600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const _Feature(text: 'Tous les livres, tous les chapitres'),
          const _Feature(text: 'Mode hors ligne'),
          const _Feature(text: 'Aucune publicité'),
          const _Feature(text: 'Annulation à tout moment'),
          const _Feature(text: 'Paiement sécurisé Mobile Money'),
          const SizedBox(height: 24),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.brand,
              minimumSize: const Size.fromHeight(52),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
            ),
            onPressed: busy ? null : onSubscribe,
            child: Text(busy ? 'Redirection…' : 'Payer ${plan.price} FCFA'),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              '🔒 Paiement sécurisé via GeniusPay',
              style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
            ),
          ),
        ],
      ),
    );
  }
}

class _Feature extends StatelessWidget {
  final String text;
  const _Feature({required this.text});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          const Text(
            '✓ ',
            style: TextStyle(color: AppColors.brand, fontWeight: FontWeight.bold),
          ),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
