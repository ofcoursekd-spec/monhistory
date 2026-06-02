import { Reader } from './Reader';

export default async function ReadPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  return <Reader chapterId={chapterId} />;
}
