import type { LucideIcon } from 'lucide-react';
import { Search, Store, ShoppingBag } from 'lucide-react';

const STEPS: readonly { Icon: LucideIcon; label: string }[] = [
  { Icon: Search, label: 'Trouvez' },
  { Icon: Store, label: 'Essayez' },
  { Icon: ShoppingBag, label: 'Choisissez' },
];

/** Étapes sous le sous-titre du hero (icônes + libellés). */
export function HeroNumberedSteps() {
  return (
    <ol
      className="hero-numbered-steps"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 11,
        rowGap: 6,
        margin: 0,
        marginBottom: 24,
        padding: 0,
        listStyle: 'none',
        fontSize: 16,
        lineHeight: 1.5,
        color: '#6e6e73',
      }}
    >
      {STEPS.map(({ Icon, label }) => (
        <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon className="hero-step-icon" size={16} strokeWidth={1.75} color="#6e6e73" aria-hidden />
          <span style={{ fontSize: 16, fontWeight: 400, color: '#6e6e73', lineHeight: 1.5 }}>{label}</span>
        </li>
      ))}
    </ol>
  );
}
