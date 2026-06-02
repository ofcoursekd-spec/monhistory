class BookSummary {
  final String id;
  final String slug;
  final String title;
  final String author;
  final String coverImageUrl;
  final String category;
  final int price;
  final int chaptersCount;

  BookSummary({
    required this.id,
    required this.slug,
    required this.title,
    required this.author,
    required this.coverImageUrl,
    required this.category,
    required this.price,
    required this.chaptersCount,
  });

  factory BookSummary.fromJson(Map<String, dynamic> j) => BookSummary(
        id: j['id'] as String,
        slug: j['slug'] as String,
        title: j['title'] as String,
        author: j['author'] as String,
        coverImageUrl: j['coverImageUrl'] as String,
        category: j['category'] as String,
        price: j['price'] as int,
        chaptersCount: j['chaptersCount'] as int,
      );
}

class ChapterListItem {
  final String id;
  final int number;
  final String title;
  final String? summary;
  ChapterListItem({required this.id, required this.number, required this.title, this.summary});
  factory ChapterListItem.fromJson(Map<String, dynamic> j) => ChapterListItem(
        id: j['id'],
        number: j['number'],
        title: j['title'],
        summary: j['summary'],
      );
}

class BookDetail extends BookSummary {
  final String description;
  final List<ChapterListItem> chapters;

  BookDetail({
    required super.id,
    required super.slug,
    required super.title,
    required super.author,
    required super.coverImageUrl,
    required super.category,
    required super.price,
    required super.chaptersCount,
    required this.description,
    required this.chapters,
  });

  factory BookDetail.fromJson(Map<String, dynamic> j) {
    final chapters = (j['chapters'] as List).map((c) => ChapterListItem.fromJson(c)).toList();
    return BookDetail(
      id: j['id'],
      slug: j['slug'],
      title: j['title'],
      author: j['author'],
      coverImageUrl: j['coverImageUrl'],
      category: j['category'],
      price: j['price'],
      chaptersCount: chapters.length,
      description: j['description'],
      chapters: chapters,
    );
  }
}

class PageItem {
  final String id;
  final int order;
  final String imageUrl;
  final String? description;
  PageItem({required this.id, required this.order, required this.imageUrl, this.description});
  factory PageItem.fromJson(Map<String, dynamic> j) => PageItem(
        id: j['id'],
        order: j['order'],
        imageUrl: j['imageUrl'],
        description: j['description'],
      );
}

class ChapterDetail {
  final String id;
  final int number;
  final String title;
  final bool preview;
  final int totalPages;
  final List<PageItem> pages;
  final String bookSlug;
  final String bookTitle;
  ChapterDetail({
    required this.id,
    required this.number,
    required this.title,
    required this.pages,
    required this.bookSlug,
    required this.bookTitle,
    required this.preview,
    required this.totalPages,
  });
  factory ChapterDetail.fromJson(Map<String, dynamic> j) {
    final pages = (j['pages'] as List).map((p) => PageItem.fromJson(p)).toList();
    return ChapterDetail(
      id: j['id'],
      number: j['number'],
      title: j['title'],
      bookSlug: j['book']['slug'],
      bookTitle: j['book']['title'],
      pages: pages,
      preview: j['preview'] as bool? ?? false,
      totalPages: j['totalPages'] as int? ?? pages.length,
    );
  }
}
