import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth.dart';
import '../../core/theme.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: auth.user == null
            ? Center(
                child: FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: AppColors.brand),
                  onPressed: () => context.push('/auth'),
                  child: const Text('Se connecter / S’inscrire'),
                ),
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: AppColors.brand.withValues(alpha: 0.1),
                    child: Text(
                      auth.user!.name.characters.first.toUpperCase(),
                      style: const TextStyle(
                        color: AppColors.brand,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    auth.user!.name,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                  ),
                  Text(
                    auth.user!.email,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey.shade600),
                  ),
                  const Spacer(),
                  OutlinedButton(
                    onPressed: () async {
                      await ref.read(authProvider.notifier).logout();
                      if (context.mounted) context.go('/');
                    },
                    child: const Text('Se déconnecter'),
                  ),
                ],
              ),
      ),
    );
  }
}
