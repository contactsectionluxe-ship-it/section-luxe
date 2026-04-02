import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sourcing',
  description: 'Gérez vos propositions reçues.',
};

export default function SourcingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
