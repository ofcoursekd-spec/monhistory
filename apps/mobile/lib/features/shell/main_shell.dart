import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  static const _tabs = [
    ('/', Icons.home_outlined, Icons.home, 'Accueil'),
    ('/bibliotheque', Icons.bookmark_border, Icons.bookmark, 'Bibliothèque'),
    ('/abonnement', Icons.star_border, Icons.star, 'Premium'),
    ('/profil', Icons.person_outline, Icons.person, 'Profil'),
  ];

  int _indexFor(String location) {
    for (var i = 0; i < _tabs.length; i++) {
      if (location == _tabs[i].$1) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final index = _indexFor(location);
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => context.go(_tabs[i].$1),
        indicatorColor: AppColors.brand.withValues(alpha: 0.12),
        destinations: [
          for (final t in _tabs)
            NavigationDestination(
              icon: Icon(t.$2),
              selectedIcon: Icon(t.$3, color: AppColors.brand),
              label: t.$4,
            ),
        ],
      ),
    );
  }
}
