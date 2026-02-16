/**
 * Supprime un compte utilisateur par email (à lancer une fois en local).
 * Usage: node scripts/delete-user-by-email.mjs test@gmail.com
 * Nécessite .env.local avec NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { pathToFileURL } from 'url';
import path from 'path';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/delete-user-by-email.mjs <email>');
  process.exit(1);
}

// Charger .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (!existsSync(envPath)) {
  console.error('Fichier .env.local introuvable.');
  process.exit(1);
}
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => /^\s*[A-Z_]+\s*=/.test(l))
    .map((l) => {
      const i = l.indexOf('=');
      const key = l.slice(0, i).trim();
      let val = l.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      return [key, val];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  // Récupérer l'utilisateur par email (listUsers puis filtre)
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    console.error('Erreur listUsers:', listErr.message);
    process.exit(1);
  }
  const user = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error('Aucun utilisateur trouvé avec l’email:', email);
    process.exit(1);
  }

  const uid = user.id;
  console.log('Utilisateur trouvé:', user.email, '(id:', uid, ')');

  // 1. Supprimer les annonces
  const { error: delListings } = await supabase.from('listings').delete().eq('seller_id', uid);
  if (delListings) console.warn('listings:', delListings.message);
  else console.log('Annonces supprimées.');

  // 2. Anonymiser le vendeur
  await supabase
    .from('sellers')
    .update({
      company_name: 'Compte supprimé',
      email: `deleted-${uid}@deleted.local`,
      address: '',
      city: '',
      postcode: '',
      phone: '',
      description: '',
      avatar_url: null,
      id_card_front_url: null,
      id_card_back_url: null,
      kbis_url: null,
    })
    .eq('id', uid);
  console.log('Fiche vendeur anonymisée.');

  // 3. Supprimer la ligne users
  const { error: delUsers } = await supabase.from('users').delete().eq('id', uid);
  if (delUsers) console.warn('users:', delUsers.message);
  else console.log('Profil users supprimé.');

  // 4. Supprimer le compte Auth
  const { error: delAuth } = await supabase.auth.admin.deleteUser(uid);
  if (delAuth) {
    console.error('Auth delete:', delAuth.message);
    process.exit(1);
  }
  console.log('Compte Auth supprimé.');
  console.log('Compte', email, 'supprimé avec succès.');
}

main();
