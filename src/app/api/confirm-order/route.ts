import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

/**
 * GET /api/confirm-order
 *
 * Called server-side by the /payment/success page after Safepay redirects back.
 * Reads the HttpOnly pending-order cookie, writes the order to Supabase,
 * and clears the cookie.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tracker = searchParams.get('tracker');

  if (!tracker) {
    return NextResponse.json({ error: 'Missing tracker.' }, { status: 400 });
  }

  // Read the pending order cookie
  const cookieStore = cookies();
  const raw = cookieStore.get('pehchan_pending_order')?.value;

  if (!raw) {
    return NextResponse.json({ error: 'Session expired. Please contact support.' }, { status: 410 });
  }

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
  };

  try {
    pending = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Corrupted session data.' }, { status: 400 });
  }

  // Safety check: the tracker in the URL must match the one we stored
  if (pending.tracker !== tracker) {
    return NextResponse.json({ error: 'Tracker mismatch. Possible tampering detected.' }, { status: 403 });
  }

  // Check if order was already recorded (idempotency guard)
  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id, total_pkr, status')
    .eq('gateway_txn_ref', tracker)
    .maybeSingle();

  if (existingOrder) {
    // Already written — return the existing order (idempotent)
    const response = NextResponse.json({ success: true, order: existingOrder, alreadyRecorded: true });
    response.cookies.delete('pehchan_pending_order');
    return response;
  }

  // =============================================
  // Write the order to Supabase
  // =============================================
  const { shipping, verifiedItems, subtotal, totalAmount, shippingPkr } = pending;

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_name:   shipping.customerName,
      customer_email:  shipping.customerEmail,
      customer_phone:  shipping.customerPhone,
      address_line1:   shipping.addressLine1,
      city:            shipping.city,
      province:        shipping.province,
      gateway:         'xpay',           // Safepay is gateway-agnostic; using xpay as placeholder
      gateway_txn_ref: tracker,          // Safepay tracker as the transaction reference
      subtotal_pkr:    subtotal,
      shipping_pkr:    shippingPkr,
      total_pkr:       totalAmount,
      status:          'payment_received',
    })
    .select('id, total_pkr, status, created_at')
    .single();

  if (orderError || !order) {
    console.error('[confirm-order] Order insert error:', orderError);
    return NextResponse.json({ error: 'Failed to record order. Please contact support with your tracker: ' + tracker }, { status: 500 });
  }

  // Insert order items
  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(verifiedItems.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    console.error('[confirm-order] Order items insert error:', itemsError);
    await supabaseAdmin.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    return NextResponse.json({ error: 'Failed to record order items.' }, { status: 500 });
  }

  // Success — clear the cookie
  const response = NextResponse.json({ success: true, order });
  response.cookies.delete('pehchan_pending_order');
  return response;
}
