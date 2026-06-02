import { BookStatus, Category, PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Plan unique 1999 FCFA / 30 jours — source de vérité du prix.
  await prisma.plan.upsert({
    where: { code: 'STANDARD' },
    update: {
      priceFcfa: 1999,
      durationDays: 30,
      active: true,
      name: 'Premium',
    },
    create: {
      code: 'STANDARD',
      name: 'Premium',
      priceFcfa: 1999,
      durationDays: 30,
      active: true,
    },
  });

  const adminPassword = await argon2.hash('admin1234');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@monhistory.app' },
    update: {},
    create: {
      email: 'admin@monhistory.app',
      name: 'Admin MonHistory',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  const readerPassword = await argon2.hash('reader1234');
  await prisma.user.upsert({
    where: { email: 'reader@monhistory.app' },
    update: {},
    create: {
      email: 'reader@monhistory.app',
      name: 'Lectrice Demo',
      passwordHash: readerPassword,
    },
  });

  const book = await prisma.book.upsert({
    where: { slug: 'lamour-au-temps-des-doutes' },
    update: {},
    create: {
      slug: 'lamour-au-temps-des-doutes',
      title: "L'amour au temps des doutes",
      description: "Une histoire de cœur, de trahison et de rédemption à Abidjan.",
      author: 'Awa Koné',
      coverImageUrl:
        'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&q=80&auto=format&fit=crop',
      category: Category.AMOUR,
      price: 1500,
      status: BookStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  for (let n = 1; n <= 5; n++) {
    const chapter = await prisma.chapter.upsert({
      where: { bookId_number: { bookId: book.id, number: n } },
      update: {},
      create: {
        bookId: book.id,
        number: n,
        title: `Chapitre ${n}`,
        summary: `Résumé du chapitre ${n}`,
      },
    });
    for (let p = 1; p <= 6; p++) {
      await prisma.page.upsert({
        where: { chapterId_order: { chapterId: chapter.id, order: p } },
        update: {},
        create: {
          chapterId: chapter.id,
          order: p,
          imageKey: `books/${book.slug}/c${n}/p${p}.webp`,
        },
      });
    }
  }

  console.log('Seed terminé. Admin:', admin.email, '/ mdp: admin1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
