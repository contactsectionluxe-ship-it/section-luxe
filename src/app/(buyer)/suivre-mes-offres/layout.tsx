import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suivre mes offres',
  description: 'Suivez vos propositions de vente et les réponses des vendeurs professionnels.',
};

export default function SuivreMesOffresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
