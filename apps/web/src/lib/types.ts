export type Category =
  | 'AMOUR' | 'TRAHISON' | 'CONFIANCE' | 'DEPRESSION'
  | 'MOTIVATION' | 'MARIAGE' | 'VIE_CHRETIENNE' | 'HISTOIRES_VRAIES';

export interface BookSummary {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverImageUrl: string;
  category: Category;
  price: number;
  chaptersCount: number;
}

export interface BookDetail extends BookSummary {
  description: string;
  chapters: { id: string; number: number; title: string; summary?: string | null }[];
}

export interface ChapterPage {
  id: string;
  order: number;
  imageUrl: string;
  description?: string | null;
}

export interface ChapterDetail {
  id: string;
  number: number;
  title: string;
  summary: string | null;
  book: { id: string; title: string; slug: string };
  pages: ChapterPage[];
  preview: boolean;
  totalPages: number;
}
