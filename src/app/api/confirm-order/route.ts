import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

/**
 * GET /api/confirm-order
 *
 * Called by the /payment/success page after Safepay redirects back.
 * Reads the HttpOnly pending-order cookie, writes the order to Supabase,
 * and clears the cookie.
 *
 * NOTE: Safepay appends the token as ?beacon=<token> on the redirect_url.
 * We accept both 'beacon' and 'tracker' so the route works regardless of
 * which name the client forwards.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Safepay uses 'beacon'; we also accept 'tracker' as a fallback
  const tracker = searchParams.get('beacon') ?? searchParams.get('tracker');

  console.log('=== CONFIRM ORDER ROUTE HIT ===');
  console.log('[confirm-order] Raw URL:', req.url);
  console.log('[confirm-order] Tracker received:', tracker);
  console.log('[confirm-order] All search params:', Object.fromEntries(searchParams.entries()));

  if (!tracker) {
    console.error('[confirm-order] ERROR: No tracker/beacon in URL params');
    return NextResponse.json({ error: 'Missing tracker.' }, { status: 400 });
  }

  // ── Read the pending order cookie ──────────────────────────────────────────
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  console.log('[confirm-order] All cookies present:', allCookies.map((c) => c.name));

  const raw = cookieStore.get('pehchan_pending_order')?.value;
  console.log('[confirm-order] Cookie "pehchan_pending_order" found:', !!raw);
  if (raw) {
    console.log('[confirm-order] Cookie length (bytes):', raw.length);
  }

  if (!raw) {
    console.error('[confirm-order] ERROR: Cookie missing — browser may have dropped it during Safepay redirect');
    return NextResponse.json(
      { error: 'Session expired. Please contact support with tracker: ' + tracker },
      { status: 410 }
    );
  }

  // ── Parse cookie ───────────────────────────────────────────────────────────
  let pending: {
    tracker: string;
    shipping: {
      customerName: string; customerEmail: string; customerPhone: string;
      addressLine1: string; city: string; province: string;
    };
    verifiedItems: {
      product_id: string; variant_id: string; product_title: string;
      product_image_url: string | null; quantity: number;
      unit_price_pkr: number; pod_customization: Record<string, unknown> | null;
      is_pod: boolean;
    }[];
    subtotal: number;
    totalAmount: number;
    shippingPkr: number;
    createdAt: number;
  };

  try {
    pending = JSON.parse(raw);
    console.log('[confirm-order] Cookie parsed OK. Stored tracker:', pending.tracker);
    console.log('[confirm-order] Customer email:', pending.shipping?.customerEmail);
    console.log('[confirm-order] Total amount:', pending.totalAmount);
    console.log('[confirm-order] Item count:', pending.verifiedItems?.length);
  } catch (parseErr) {
    console.error('[confirm-order] ERROR: Failed to parse cookie JSON:', parseErr);
    return NextResponse.json({ error: 'Corrupted session data.' }, { status: 400 });
  }

  // ── Tracker match check ────────────────────────────────────────────────────
  console.log('[confirm-order] Tracker match check — URL:', tracker, ' | Cookie:', pending.tracker);
  if (pending.tracker !== tracker) {
    console.error('[confirm-order] ERROR: Tracker mismatch!');
    return NextResponse.json({ error: 'Tracker mismatch. Possible tampering detected.' }, { status: 403 });
  }

  // ── Idempotency guard ──────────────────────────────────────────────────────
  console.log('[confirm-order] Checking for existing order with tracker:', tracker);
  const { data: existingOrder, error: existingErr } = await supabaseAdmin
    .from('orders')
    .select('id, total_pkr, status')
    .eq('gateway_txn_ref', tracker)
    .maybeSingle();

  if (existingErr) {
    console.error('[confirm-order] Supabase idempotency check error:', existingErr);
  }

  if (existingOrder) {
    console.log('[confirm-order] Order already recorded (idempotent return):', existingOrder.id);
    const response = NextResponse.json({ success: true, order: existingOrder, alreadyRecorded: true });
    response.cookies.delete('pehchan_pending_order');
    return response;
  }

  // ── Write order to Supabase ────────────────────────────────────────────────
  const { shipping, verifiedItems, subtotal, totalAmount, shippingPkr } = pending;

  console.log('[confirm-order] Inserting order into Supabase...');
  console.log('[confirm-order] Order payload:', {
    customer_name:   shipping.customerName,
    customer_email:  shipping.customerEmail,
    city:            shipping.city,
    province:        shipping.province,
    gateway_txn_ref: tracker,
    subtotal_pkr:    subtotal,
    shipping_pkr:    shippingPkr,
    total_pkr:       totalAmount,
    status:          'payment_received',
  });

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_name:   shipping.customerName,
      customer_email:  shipping.customerEmail,
      customer_phone:  shipping.customerPhone,
      address_line1:   shipping.addressLine1,
      city:            shipping.city,
      province:        shipping.province,
      gateway:         'safepay',
      gateway_txn_ref: tracker,
      subtotal_pkr:    subtotal,
      shipping_pkr:    shippingPkr,
      total_pkr:       totalAmount,
      status:          'payment_received',
    })
    .select('id, total_pkr, status, created_at')
    .single();

  if (orderError || !order) {
    console.error('[confirm-order] SUPABASE INSERT ERROR:', JSON.stringify(orderError, null, 2));
    return NextResponse.json(
      { error: 'Failed to record order. Please contact support with your tracker: ' + tracker },
      { status: 500 }
    );
  }

  console.log('[confirm-order] SUPABASE INSERT SUCCESS — Order ID:', order.id);

  // ── Insert order items ─────────────────────────────────────────────────────
  console.log('[confirm-order] Inserting', verifiedItems.length, 'order item(s)...');

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(verifiedItems.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    console.error('[confirm-order] ORDER ITEMS INSERT ERROR:', JSON.stringify(itemsError, null, 2));
    await supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    return NextResponse.json({ error: 'Failed to record order items.' }, { status: 500 });
  }

  console.log('[confirm-order] Order items inserted successfully');
  console.log('=== CONFIRM ORDER COMPLETE ===');

  // ── Clear cookie and return ────────────────────────────────────────────────
  const response = NextResponse.json({ success: true, order });
  response.cookies.delete('pehchan_pending_order');
  return response;
}
