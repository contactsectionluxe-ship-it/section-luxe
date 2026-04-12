import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mes propositions',
  description: 'Vos propositions de mise en vente et les réponses des vendeurs professionnels.',
};

export default function SuivreMesOffresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
