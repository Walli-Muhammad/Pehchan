import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { Resend } from 'resend';

// ─── Safepay integration is archived in src/app/api/_archived_safepay/ ────────
// It can be reactivated by copying those files back and configuring the env vars.

const resend = new Resend(process.env.RESEND_API_KEY);
const SHIPPING_PKR = 250;
const POD_PRICE_PKR = 5500;
const WHATSAPP_NUMBER = '923291881033'; // international format, no +

interface CheckoutItem {
  productId: string;
  variantId: string;
  quantity: number;
  podCustomizations: Record<string, string> | null;
}

interface CheckoutRequest {
  items: CheckoutItem[];
  paymentMethod: 'cod' | 'whatsapp'; // COD or WhatsApp-assisted JazzCash/EasyPaisa
  shipping: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    addressLine1: string;
    city: string;
    province: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutRequest = await req.json();
    const { items, shipping, paymentMethod = 'cod' } = body;

    // ── Validation ─────────────────────────────────────────────────────────────
    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }
    if (!shipping?.customerEmail || !shipping?.customerName || !shipping?.customerPhone) {
      return NextResponse.json({ error: 'Missing required shipping details.' }, { status: 400 });
    }

    // ── Server-side price verification ─────────────────────────────────────────
    const regularItems   = items.filter((i) => !i.productId.startsWith('custom-'));
    const customPodItems = items.filter((i) =>  i.productId.startsWith('custom-'));

    type ProductRow = { title: string; base_price: number; image_url: string | null; is_pod: boolean; is_active: boolean };
    let productMap = new Map<string, ProductRow>();

    if (regularItems.length > 0) {
      const productIds = [...new Set(regularItems.map((i) => i.productId))];
      const { data: products, error: productError } = await supabaseAdmin
        .from('products')
        .select('id, base_price, title, image_url, is_pod, is_active')
        .in('id', productIds);

      if (productError || !products) {
        return NextResponse.json({ error: 'Could not verify products.' }, { status: 500 });
      }
      productMap = new Map(products.map((p) => [p.id, p as ProductRow]));

      for (const item of regularItems) {
        const product = productMap.get(item.productId);
        if (!product || !product.is_active) {
          return NextResponse.json({ error: `Product "${item.productId}" is unavailable.` }, { status: 400 });
        }
      }
    }

    // ── POD sentinel row ────────────────────────────────────────────────────────
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

    // ── Build line items & calculate total ─────────────────────────────────────
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

    // ── Insert order with status='pending' ─────────────────────────────────────
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name:  shipping.customerName,
        customer_email: shipping.customerEmail,
        customer_phone: shipping.customerPhone,
        address_line1:  shipping.addressLine1,
        city:           shipping.city,
        province:       shipping.province,
        gateway:        paymentMethod, // 'cod' or 'whatsapp'
        subtotal_pkr:   subtotal,
        shipping_pkr:   SHIPPING_PKR,
        total_pkr:      totalAmount,
        status:         'pending',
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('[checkout] ORDER INSERT ERROR:', orderError);
      return NextResponse.json({ error: 'Failed to record order. Please try again.' }, { status: 500 });
    }

    // Insert order items
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(verifiedItems.map((item) => ({ ...item, order_id: order.id })));

    if (itemsError) {
      console.error('[checkout] ORDER ITEMS INSERT ERROR:', itemsError);
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to record order items.' }, { status: 500 });
    }

    const shortId = order.id.slice(0, 8).toUpperCase();

    // ── Send confirmation email to customer ────────────────────────────────────
    try {
      const paymentInstructions = paymentMethod === 'cod'
        ? `<p style="margin:0 0 16px;font-size:14px;color:#a1a1aa;line-height:1.7;">
             Your order has been placed successfully for <strong style="color:#fff;">Cash on Delivery</strong>.
             Our team will confirm your order by WhatsApp or phone before dispatch.
           </p>`
        : `<p style="margin:0 0 16px;font-size:14px;color:#a1a1aa;line-height:1.7;">
             You selected <strong style="color:#fff;">JazzCash / EasyPaisa</strong> payment.
             We will send you a payment request on your WhatsApp / phone shortly.
             Your order will be confirmed once payment is received.
           </p>`;

      await resend.emails.send({
        from: 'Pehchan Orders <onboarding@resend.dev>',
        to: [shipping.customerEmail],
        subject: `Order Received — Pehchan #${shortId}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
          <body style="margin:0;padding:0;background:#09090b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#d4d4d8;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#18181b;border-radius:16px;overflow:hidden;border:1px solid #27272a;">
              <tr>
                <td style="background:linear-gradient(135deg,#3730a3,#1e1b4b);padding:36px 40px;text-align:center;">
                  <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:0.15em;color:#ffffff;text-transform:uppercase;">PEHCHAN</h1>
                  <p style="margin:6px 0 0;font-size:11px;letter-spacing:0.3em;color:#a5b4fc;text-transform:uppercase;">Order Received</p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;">
                  <h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#ffffff;">Thanks, ${shipping.customerName}! 🎉</h2>
                  ${paymentInstructions}
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;border-radius:12px;border:1px solid #27272a;overflow:hidden;margin-bottom:28px;">
                    <tr style="border-bottom:1px solid #27272a;">
                      <td style="padding:14px 20px;font-size:11px;font-weight:700;letter-spacing:0.15em;color:#52525b;text-transform:uppercase;">Order Reference</td>
                      <td style="padding:14px 20px;text-align:right;font-size:13px;font-family:monospace;color:#e4e4e7;">#${shortId}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #27272a;">
                      <td style="padding:14px 20px;font-size:11px;font-weight:700;letter-spacing:0.15em;color:#52525b;text-transform:uppercase;">Total</td>
                      <td style="padding:14px 20px;text-align:right;font-size:15px;font-weight:800;color:#ffffff;">Rs. ${totalAmount.toLocaleString('en-PK')}</td>
                    </tr>
                    <tr>
                      <td style="padding:14px 20px;font-size:11px;font-weight:700;letter-spacing:0.15em;color:#52525b;text-transform:uppercase;">Payment</td>
                      <td style="padding:14px 20px;text-align:right;font-size:13px;color:#e4e4e7;">${paymentMethod === 'cod' ? 'Cash on Delivery' : 'JazzCash / EasyPaisa'}</td>
                    </tr>
                  </table>
                  <p style="font-size:12px;color:#52525b;line-height:1.7;">
                    Questions? WhatsApp us at <a href="https://wa.me/${WHATSAPP_NUMBER}" style="color:#818cf8;">+92 329 188 1033</a>
                    or email <a href="mailto:Pehchan.help@gmail.com" style="color:#818cf8;">Pehchan.help@gmail.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });
    } catch (emailErr) {
      // Non-fatal — order is in DB, email just didn't send
      console.error('[checkout] Email error:', emailErr);
    }

    // ── Build WhatsApp message (for whatsapp payment method) ──────────────────
    let whatsappUrl: string | null = null;
    if (paymentMethod === 'whatsapp') {
      const lineItems = verifiedItems
        .map((i) => `  • ${i.product_title} × ${i.quantity} — Rs. ${(i.unit_price_pkr * i.quantity).toLocaleString('en-PK')}`)
        .join('\n');

      const message = [
        `👋 Hi Pehchan! I'd like to complete my order:`,
        ``,
        `*Order #${shortId}*`,
        lineItems,
        `  • Shipping — Rs. ${SHIPPING_PKR.toLocaleString('en-PK')}`,
        ``,
        `*Total: Rs. ${totalAmount.toLocaleString('en-PK')}*`,
        ``,
        `Please send me a JazzCash/EasyPaisa payment request to *${shipping.customerPhone}*.`,
        ``,
        `Shipping to: ${shipping.addressLine1}, ${shipping.city}, ${shipping.province}`,
      ].join('\n');

      whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      shortId,
      totalAmount,
      paymentMethod,
      whatsappUrl, // null for COD, URL string for whatsapp
    });

  } catch (err) {
    console.error('[checkout] Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
