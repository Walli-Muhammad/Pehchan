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
// 1. Verify products + calculate server-side total
// 2. Encode cart state into a short-lived signed cookie
// 3. Create a Safepay tracker
// 4. Return the Safepay hosted checkout URL
// =============================================
export async function POST(req: NextRequest) {
  try {
    const body: CheckoutRequest = await req.json();
    const { items, shipping } = body;

    // — Validation —
    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }
    if (!shipping?.customerEmail || !shipping?.customerName || !shipping?.customerPhone) {
      return NextResponse.json({ error: 'Missing required shipping details.' }, { status: 400 });
    }

    // =============================================
    // SECURITY: Re-fetch product prices server-side
    // =============================================
    const regularItems   = items.filter((i) => !i.productId.startsWith('custom-'));
    const customPodItems = items.filter((i) =>  i.productId.startsWith('custom-'));

    let productMap = new Map<string, { title: string; base_price: number; image_url: string | null; is_pod: boolean; is_active: boolean }>();

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

    // =============================================
    // POD sentinel product (for FK constraint)
    // =============================================
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

    // =============================================
    // Server-verified totals
    // =============================================
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
          product_image_url: null,
          quantity:          item.quantity,
          unit_price_pkr:    POD_PRICE_PKR,
          pod_customization: { ...(item.podCustomizations ?? {}), _custom_pod_ref: item.productId },
          is_pod:            true,
        };
      }),
    ];

    const totalAmount = subtotal + SHIPPING_PKR;

    // =============================================
    // Safepay: Create Tracker
    // =============================================
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

      if (!safepayRes.ok) {
        const errText = await safepayRes.text();
        console.error('[checkout] Safepay init error:', errText);
        return NextResponse.json({ error: 'Payment gateway error. Please try again.' }, { status: 502 });
      }

      const safepayData = await safepayRes.json();
      tracker = safepayData?.data?.token;

      if (!tracker) {
        console.error('[checkout] Safepay returned no tracker:', safepayData);
        return NextResponse.json({ error: 'Could not initiate payment session.' }, { status: 502 });
      }
    } catch (networkErr) {
      console.error('[checkout] Safepay network error:', networkErr);
      return NextResponse.json({ error: 'Could not reach payment gateway.' }, { status: 502 });
    }

    // =============================================
    // Persist pending order state in an HttpOnly cookie
    // The success page will read this to write the DB row
    // =============================================
    const pendingOrder = {
      tracker,
      shipping,
      verifiedItems,
      subtotal,
      totalAmount,
      shippingPkr: SHIPPING_PKR,
      createdAt: Date.now(),
    };

    // Safepay checkout URL
    const checkoutUrl =
      `https://sandbox.api.getsafepay.com/checkout/pay` +
      `?env=sandbox` +
      `&tracker=${tracker}` +
      `&client=${safepayApiKey}` +
      `&source=custom` +
      `&cancel_url=${siteUrl}/cart` +
      `&success_url=${siteUrl}/payment/success`;

    // Build response and set cookie
    const response = NextResponse.json({ success: true, checkoutUrl, tracker });

    response.cookies.set('pehchan_pending_order', JSON.stringify(pendingOrder), {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 30,   // 30 minutes — long enough to complete payment
      path:     '/',
    });

    return response;

  } catch (err) {
    console.error('[checkout] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
