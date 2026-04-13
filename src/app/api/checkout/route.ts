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
  gateway: 'jazzCash' | 'easyPaisa' | 'xpay';
}

// =============================================
// Shipping cost (flat-rate MVP)
// =============================================
const SHIPPING_PKR = 250;

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutRequest = await req.json();
    const { items, shipping, gateway } = body;

    // — Validation —
    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }
    if (!shipping?.customerEmail || !shipping?.customerName) {
      return NextResponse.json({ error: 'Missing shipping details.' }, { status: 400 });
    }
    if (!['jazzCash', 'easyPaisa', 'xpay'].includes(gateway)) {
      return NextResponse.json({ error: 'Invalid payment gateway.' }, { status: 400 });
    }

    // =============================================
    // SECURITY: Re-fetch product prices server-side.
    // We NEVER trust the price sent from the client.
    // =============================================
    const productIds = [...new Set(items.map((i) => i.productId))];

    const { data: products, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, base_price, title, image_url, is_pod, is_active')
      .in('id', productIds);

    if (productError || !products) {
      console.error('[checkout] Product fetch error:', productError);
      return NextResponse.json({ error: 'Could not verify products.' }, { status: 500 });
    }

    // Reject if any product is inactive / not found
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || !product.is_active) {
        return NextResponse.json(
          { error: `Product "${item.productId}" is unavailable.` },
          { status: 400 }
        );
      }
    }

    // =============================================
    // Calculate server-verified total
    // =============================================
    let subtotal = 0;
    const verifiedItems = items.map((item) => {
      const product = productMap.get(item.productId)!;
      // In MVP we use base_price directly (no variant price_delta fetched).
      // Phase 6 should join variants here.
      const unitPrice = Number(product.base_price);
      subtotal += unitPrice * item.quantity;

      return {
        product_id: item.productId,
        variant_id: item.variantId,
        product_title: product.title,
        product_image_url: product.image_url,
        quantity: item.quantity,
        unit_price_pkr: unitPrice,
        pod_customization: item.podCustomizations ?? null,
        is_pod: product.is_pod,
      };
    });

    const total = subtotal + SHIPPING_PKR;

    // =============================================
    // Simulate payment gateway handshake
    // Replace this block with real SDK calls in Phase 6
    // =============================================
    const gatewayTxnRef = `${gateway.toUpperCase()}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    // Simulate ~200ms gateway latency
    await new Promise((r) => setTimeout(r, 200));
    // In production: if gateway returns failure, return 402 here.

    // =============================================
    // Write Order + Order Items atomically
    // =============================================
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name: shipping.customerName,
        customer_email: shipping.customerEmail,
        customer_phone: shipping.customerPhone,
        address_line1: shipping.addressLine1,
        city: shipping.city,
        province: shipping.province,
        gateway,
        gateway_txn_ref: gatewayTxnRef,
        subtotal_pkr: subtotal,
        shipping_pkr: SHIPPING_PKR,
        total_pkr: total,
        status: 'payment_received',
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('[checkout] Order insert error:', orderError);
      return NextResponse.json({ error: 'Failed to record order.' }, { status: 500 });
    }

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(verifiedItems.map((item) => ({ ...item, order_id: order.id })));

    if (itemsError) {
      console.error('[checkout] Order items insert error:', itemsError);
      // Order was created but items failed — mark as cancelled for investigation
      await supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);
      return NextResponse.json({ error: 'Failed to record order items.' }, { status: 500 });
    }

    // =============================================
    // Success
    // =============================================
    return NextResponse.json({
      success: true,
      orderId: order.id,
      gatewayTxnRef,
      verifiedTotal: total,
      shippingCost: SHIPPING_PKR,
    });
  } catch (err) {
    console.error('[checkout] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
