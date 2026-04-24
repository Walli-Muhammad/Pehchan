import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// =============================================
// Request Body Shape
// =============================================
interface CheckoutItem {
  productId: string;
  variantId: string;
  quantity: number;
  podCustomizations: Record<string, string> | null;
}

interface CheckoutRequest {
  items: CheckoutItem[];
  shipping: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    addressLine1: string;
    city: string;
    province: string;
  };
}

const SHIPPING_PKR = 250;
const POD_PRICE_PKR = 5500;

// =============================================
// POST /api/checkout
//
// Architecture (Database-First):
// 1. Verify products & calculate server-side total
// 2. Generate Safepay tracker
// 3. INSERT order into Supabase with status='pending'
//    and gateway_txn_ref=tracker  ← key for confirm-order lookup
// 4. INSERT order_items
// 5. Return checkoutUrl to the client
//
// No cookie is used. The DB row is the source of truth.
// =============================================
export async function POST(req: NextRequest) {
  try {
    const body: CheckoutRequest = await req.json();
    const { items, shipping } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }
    if (!shipping?.customerEmail || !shipping?.customerName || !shipping?.customerPhone) {
      return NextResponse.json({ error: 'Missing required shipping details.' }, { status: 400 });
    }

    // ── Server-side price verification ────────────────────────────────────────
    const regularItems   = items.filter((i) => !i.productId.startsWith('custom-'));
    const customPodItems = items.filter((i) =>  i.productId.startsWith('custom-'));

    let productMap = new Map<string, {
      title: string; base_price: number; image_url: string | null;
      is_pod: boolean; is_active: boolean;
    }>();

    if (regularItems.length > 0) {
      const productIds = [...new Set(regularItems.map((i) => i.productId))];
      const { data: products, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, base_price, title, image_url, is_pod, is_active')
        .in('id', productIds);

      if (productError || !products) {
        return NextResponse.json({ error: 'Could not verify products.' }, { status: 500 });
      }
      productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of regularItems) {
        const product = productMap.get(item.productId);
        if (!product || !product.is_active) {
          return NextResponse.json({ error: `Product "${item.productId}" is unavailable.` }, { status: 400 });
        }
      }
    }

    // ── POD sentinel row ──────────────────────────────────────────────────────
    let podProductId: string | null = null;
    if (customPodItems.length > 0) {
      const { data: existing } = await supabaseAdmin
        .from('products').select('id')
        .eq('title', '__CUSTOM_POD_TEMPLATE__').limit(1).single();

      if (existing) {
        podProductId = existing.id;
      } else {
        const { data: created, error: createErr } = await supabaseAdmin
          .from('products')
          .insert({
            title: '__CUSTOM_POD_TEMPLATE__',
            base_price: POD_PRICE_PKR,
            category: 'Custom',
            description: 'Sentinel row for custom POD order items. Do not delete.',
            is_pod: true,
            is_active: false,
          })
          .select('id').single();

        if (createErr || !created) {
          return NextResponse.json({ error: 'Could not process custom item.' }, { status: 500 });
        }
        podProductId = created.id;
      }
    }

    // ── Build verified line items & calculate total ───────────────────────────
    let subtotal = 0;
    const verifiedItems = [
      ...regularItems.map((item) => {
        const product = productMap.get(item.productId)!;
        const unitPrice = Number(product.base_price);
        subtotal += unitPrice * item.quantity;
        return {
          product_id:        item.productId,
          variant_id:        item.variantId,
          product_title:     product.title,
          product_image_url: product.image_url,
          quantity:          item.quantity,
          unit_price_pkr:    unitPrice,
          pod_customization: item.podCustomizations ?? null,
          is_pod:            product.is_pod,
        };
      }),
      ...customPodItems.map((item) => {
        subtotal += POD_PRICE_PKR * item.quantity;
        return {
          product_id:        podProductId!,
          variant_id:        'custom-pod',
          product_title:     'Custom Pehchan Tee (POD)',
          product_image_url: null as string | null,
          quantity:          item.quantity,
          unit_price_pkr:    POD_PRICE_PKR,
          pod_customization: { ...(item.podCustomizations ?? {}), _custom_pod_ref: item.productId } as Record<string, unknown>,
          is_pod:            true,
        };
      }),
    ];

    const totalAmount = subtotal + SHIPPING_PKR;

    // ── Generate Safepay tracker ──────────────────────────────────────────────
    const safepayApiKey = process.env.SAFEPAY_API_KEY!;
    const siteUrl       = process.env.NEXT_PUBLIC_SITE_URL!;

    let tracker: string;

    try {
      const safepayRes = await fetch('https://sandbox.api.getsafepay.com/order/v1/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client:      safepayApiKey,
          amount:      totalAmount,
          currency:    'PKR',
          environment: 'sandbox',
        }),
      });

      const safepayData = await safepayRes.json();
      console.log('[checkout] SAFEPAY INIT RESPONSE:', JSON.stringify(safepayData, null, 2));

      if (!safepayRes.ok || !safepayData?.data?.token) {
        console.error('[checkout] Safepay tracker generation failed:', safepayData);
        return NextResponse.json({ error: 'Payment gateway error. Please try again.' }, { status: 502 });
      }

      tracker = safepayData.data.token;
      console.log('[checkout] Safepay tracker obtained:', tracker);
    } catch (networkErr) {
      console.error('[checkout] Safepay network error:', networkErr);
      return NextResponse.json({ error: 'Could not reach payment gateway.' }, { status: 502 });
    }

    // ── DATABASE-FIRST: Insert order immediately with status='pending' ─────────
    // This removes the need for any cookie — the row is the source of truth.
    console.log('[checkout] Inserting pending order into Supabase...');

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
        gateway_txn_ref: tracker,     // ← used by confirm-order to find this row
        subtotal_pkr:    subtotal,
        shipping_pkr:    SHIPPING_PKR,
        total_pkr:       totalAmount,
        status:          'pending',   // will be updated to 'payment_received' on success
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('[checkout] SUPABASE ORDER INSERT ERROR:', orderError);
      return NextResponse.json({ error: 'Failed to record order. Please try again.' }, { status: 500 });
    }

    console.log('[checkout] Pending order created — ID:', order.id);

    // Insert order items
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(verifiedItems.map((item) => ({ ...item, order_id: order.id })));

    if (itemsError) {
      console.error('[checkout] ORDER ITEMS INSERT ERROR:', itemsError);
      // Roll back the order row so we don't leave orphaned records
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to record order items.' }, { status: 500 });
    }

    console.log('[checkout] Order items inserted successfully');

    // ── Build Safepay checkout URL ────────────────────────────────────────────
    const checkoutUrl =
      `https://sandbox.api.getsafepay.com/checkout/pay` +
      `?env=sandbox` +
      `&beacon=${tracker}` +
      `&source=custom` +
      `&client=${safepayApiKey}` +
      `&cancel_url=${encodeURIComponent(`${siteUrl}/cart`)}` +
      `&redirect_url=${encodeURIComponent(`${siteUrl}/payment/success`)}`;

    console.log('[checkout] Safepay checkout URL:', checkoutUrl);

    return NextResponse.json({ success: true, checkoutUrl, tracker });

  } catch (err) {
    console.error('[checkout] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
