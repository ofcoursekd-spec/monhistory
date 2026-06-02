import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';

/// Cache hors ligne basique pour les chapitres déjà lus.
/// On stocke uniquement les métadonnées (les images sont déjà gérées par cached_network_image).
class OfflineCache {
  static Database? _db;

  static Future<Database> _open() async {
    if (_db != null) return _db!;
    final dir = await getApplicationDocumentsDirectory();
    final path = '${dir.path}${Platform.pathSeparator}monhistory.db';
    _db = await openDatabase(
      path,
      version: 1,
      onCreate: (db, _) async {
        await db.execute('''
          CREATE TABLE chapter_cache (
            chapter_id TEXT PRIMARY KEY,
            payload TEXT NOT NULL,
            updated_at INTEGER NOT NULL
          )
        ''');
      },
    );
    return _db!;
  }

  static Future<void> put(String chapterId, String payloadJson) async {
    final db = await _open();
    await db.insert(
      'chapter_cache',
      {
        'chapter_id': chapterId,
        'payload': payloadJson,
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  static Future<String?> get(String chapterId) async {
    final db = await _open();
    final rows = await db.query('chapter_cache', where: 'chapter_id = ?', whereArgs: [chapterId]);
    if (rows.isEmpty) return null;
    return rows.first['payload'] as String;
  }
}
