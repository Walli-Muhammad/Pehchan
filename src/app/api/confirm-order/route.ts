import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

/**
 * GET /api/confirm-order?beacon=<tracker>
 *
 * Called by /payment/success after Safepay redirects back.
 *
 * Architecture (Database-First):
 * - No cookie reading. The order row was already inserted by /api/checkout.
 * - We simply UPDATE the order's status from 'pending' → 'payment_received'
 *   by matching gateway_txn_ref = beacon.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Safepay sends the token as ?beacon=; we also accept ?tracker= as fallback
  const beacon = searchParams.get('beacon') ?? searchParams.get('tracker');

  console.log('=== CONFIRM ORDER ROUTE HIT ===');
  console.log('[confirm-order] Raw URL:', req.url);
  console.log('[confirm-order] Beacon received:', beacon);

  if (!beacon) {
    console.error('[confirm-order] ERROR: No beacon/tracker in URL');
    return NextResponse.json({ error: 'Missing payment reference.' }, { status: 400 });
  }

  // ── Look up the pending order by tracker ──────────────────────────────────
  console.log('[confirm-order] Looking up order with gateway_txn_ref:', beacon);

  const { data: existingOrder, error: lookupError } = await supabaseAdmin
    .from('orders')
    .select('id, total_pkr, status, created_at')
    .eq('gateway_txn_ref', beacon)
    .maybeSingle();

  if (lookupError) {
    console.error('[confirm-order] SUPABASE LOOKUP ERROR:', JSON.stringify(lookupError, null, 2));
    return NextResponse.json({ error: 'Database error during order lookup.' }, { status: 500 });
  }

  if (!existingOrder) {
    console.error('[confirm-order] No order found for beacon:', beacon);
    return NextResponse.json(
      { error: 'Order not found for this payment reference. Contact support with code: ' + beacon },
      { status: 404 }
    );
  }

  console.log('[confirm-order] Found order:', existingOrder.id, '| Current status:', existingOrder.status);

  // ── Idempotency: already confirmed → return early ─────────────────────────
  if (existingOrder.status === 'payment_received' || existingOrder.status === 'processing'
    || existingOrder.status === 'shipped' || existingOrder.status === 'delivered') {
    console.log('[confirm-order] Order already confirmed (idempotent). Returning existing row.');
    return NextResponse.json({ success: true, order: existingOrder, alreadyRecorded: true });
  }

  // ── UPDATE status to 'payment_received' ───────────────────────────────────
  console.log('[confirm-order] Updating order status to payment_received...');

  const { data: updatedOrder, error: updateError } = await supabaseAdmin
    .from('orders')
    .update({ status: 'payment_received' })
    .eq('id', existingOrder.id)
    .select('id, total_pkr, status, created_at')
    .single();

  if (updateError || !updatedOrder) {
    console.error('[confirm-order] SUPABASE UPDATE ERROR:', JSON.stringify(updateError, null, 2));
    return NextResponse.json(
      { error: 'Failed to confirm order. Contact support with code: ' + beacon },
      { status: 500 }
    );
  }

  console.log('[confirm-order] SUPABASE UPDATE SUCCESS — Order:', updatedOrder.id, '| Status:', updatedOrder.status);
  console.log('=== CONFIRM ORDER COMPLETE ===');

  return NextResponse.json({ success: true, order: updatedOrder });
}
