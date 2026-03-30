import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sourcing',
  description:
    'Propositions de particuliers qui vous ont sélectionné : estimation, notes et messagerie.',
};

export default function SourcingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
