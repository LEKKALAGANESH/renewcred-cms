import { redirect } from 'next/navigation';

// The design has no separate home screen; the standards index is the entry point.
export default function HomePage() {
  redirect('/standards');
}
