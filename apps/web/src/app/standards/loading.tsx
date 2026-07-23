import { StandardListSkeleton } from '@/components/states/States';

export default function Loading() {
  return (
    <div className="mx-auto max-w-content px-104 pt-80">
      <div className="h-[205px]" />
      <StandardListSkeleton />
    </div>
  );
}
