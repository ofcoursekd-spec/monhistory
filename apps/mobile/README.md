# MonHistory — Mobile (Flutter)

App Flutter (Android + iOS) connectée au backend NestJS.

## Démarrage

```bash
cd apps/mobile
flutter pub get
# émulateur Android (host = 10.0.2.2)
flutter run
# iOS sim ou device réel : passer l'URL via --dart-define
flutter run --dart-define=API_URL=http://192.168.1.10:3000/api/v1
```

## Architecture

```
lib/
├── main.dart
├── app.dart                   # MaterialApp.router + thème (couleurs MonHistory)
├── core/
│   ├── api_client.dart        # Dio + intercepteur Bearer + secure storage
│   ├── models.dart            # Book / Chapter / Page
│   ├── router.dart            # go_router, ShellRoute pour la bottom nav
│   └── theme.dart             # AppColors (#7C1D3F wine + #D97706 amber)
└── features/
    ├── shell/main_shell.dart       # bottom navigation
    ├── home/home_screen.dart       # hero + grille nouveautés
    ├── book/book_screen.dart       # fiche livre + liste chapitres
    ├── reader/reader_screen.dart   # lecteur vertical Webtoon
    ├── library/library_screen.dart # placeholder
    ├── subscription/subscription_screen.dart
    └── profile/profile_screen.dart
```

## Stack

- **Riverpod 2** pour l'état (providers, FutureProvider.family).
- **go_router** avec ShellRoute pour la bottom navigation.
- **Dio** + `flutter_secure_storage` pour persister les tokens.
- **cached_network_image** + **shimmer** pour les couvertures.
- **google_fonts** (Inter).

## TODO

- Écrans auth (login/register/OAuth) + bootstrap du token au démarrage.
- Mode hors ligne : cache des pages déjà lues (sqflite ou hive).
- Mode **TikTok** : `PageView` vertical plein écran avec swipe entre pages.
- Notifications FCM (`firebase_messaging`) + token enregistré côté backend.
- Achat de livre : flow webview vers GeniusPay puis polling `/purchases`.
- Tests : widget tests sur ReaderScreen + golden tests sur HomeScreen.
