import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import WardrobeDashboard from './WardrobeDashboard';

export const metadata = {
  title: 'My Wardrobe | Pehchan',
};

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Server-side guard: redirect to login if not authenticated
  if (!user) {
    redirect('/login');
  }

  // Fetch saved designs
  const { data: savedDesigns } = await supabase
    .from('saved_designs')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch orders by customer email
  const { data: orders } = await supabase
    .from('orders')
    .select('id, created_at, total_pkr, status, customer_name')
    .eq('customer_email', user.email!)
    .order('created_at', { ascending: false });

  return (
    <WardrobeDashboard
      user={{ email: user.email!, name: user.user_metadata?.full_name ?? null }}
      savedDesigns={savedDesigns ?? []}
      orders={orders ?? []}
    />
  );
}
