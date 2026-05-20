import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * GET /api/confirm-order?beacon=<tracker>
 *
 * Called by /payment/success after Safepay redirects back.
 *
 * Architecture (Database-First):
 * - No cookie reading. The order row was already inserted by /api/checkout.
 * - We simply UPDATE the order's status from 'pending' → 'payment_received'
 *   by matching gateway_txn_ref = beacon.
 * - After confirming, we send a receipt email via Resend to the customer + admin.
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

  // ── Idempotency: already confirmed → return early (skip re-sending email) ─
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

  // ── Fetch full order details for the receipt email ─────────────────────────
  const { data: fullOrder, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('gateway_txn_ref', beacon)
    .single();

  if (fetchError || !fullOrder) {
    // Non-fatal — order is confirmed, receipt email just won't fire
    console.error('[confirm-order] Could not fetch full order for email:', fetchError?.message);
  } else {
    // ── Send receipt email via Resend ────────────────────────────────────────
    try {
      const shortId = fullOrder.id.slice(0, 8).toUpperCase();
      const adminEmail = 'Pehchan.help@gmail.com';

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: 'Pehchan Orders <onboarding@resend.dev>', // swap for orders@pehchan.pk once domain is verified
        to: [fullOrder.customer_email, adminEmail],
        subject: `Order Confirmed — Pehchan #${shortId}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="margin:0;padding:0;background:#09090b;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#d4d4d8;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:#18181b;border-radius:16px;overflow:hidden;border:1px solid #27272a;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#3730a3,#1e1b4b);padding:36px 40px;text-align:center;">
                  <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:0.15em;color:#ffffff;text-transform:uppercase;">PEHCHAN</h1>
                  <p style="margin:6px 0 0;font-size:11px;letter-spacing:0.3em;color:#a5b4fc;text-transform:uppercase;">Order Confirmation</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 8px;font-size:14px;color:#a1a1aa;">Hello,</p>
                  <h2 style="margin:0 0 24px;font-size:22px;font-weight:800;color:#ffffff;">Thank you, ${fullOrder.customer_name}! 🎉</h2>

                  <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#a1a1aa;">
                    Your payment has been received and your custom print-on-demand apparel is now in production.
                    We&apos;ll email you again as soon as your order ships.
                  </p>

                  <!-- Order Details -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;border-radius:12px;border:1px solid #27272a;overflow:hidden;margin-bottom:28px;">
                    <tr style="border-bottom:1px solid #27272a;">
                      <td style="padding:14px 20px;font-size:11px;font-weight:700;letter-spacing:0.15em;color:#52525b;text-transform:uppercase;">Order Reference</td>
                      <td style="padding:14px 20px;text-align:right;font-size:13px;font-family:monospace;color:#e4e4e7;">#${shortId}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #27272a;">
                      <td style="padding:14px 20px;font-size:11px;font-weight:700;letter-spacing:0.15em;color:#52525b;text-transform:uppercase;">Total Paid</td>
                      <td style="padding:14px 20px;text-align:right;font-size:15px;font-weight:800;color:#ffffff;">Rs. ${fullOrder.total_pkr.toLocaleString('en-PK')}</td>
                    </tr>
                    <tr>
                      <td style="padding:14px 20px;font-size:11px;font-weight:700;letter-spacing:0.15em;color:#52525b;text-transform:uppercase;">Status</td>
                      <td style="padding:14px 20px;text-align:right;">
                        <span style="background:#052e16;color:#4ade80;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:4px 12px;border-radius:999px;border:1px solid #166534;">Payment Received</span>
                      </td>
                    </tr>
                  </table>

                  <!-- Shipping Address -->
                  <h3 style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.15em;color:#52525b;text-transform:uppercase;">Shipping To</h3>
                  <p style="margin:0 0 28px;font-size:14px;line-height:1.8;color:#a1a1aa;">
                    <strong style="color:#e4e4e7;">${fullOrder.customer_name}</strong><br/>
                    ${fullOrder.address_line1}<br/>
                    ${fullOrder.city}, ${fullOrder.province}<br/>
                    <a href="tel:${fullOrder.customer_phone}" style="color:#818cf8;">${fullOrder.customer_phone}</a>
                  </p>

                  <!-- Timeline -->
                  <h3 style="margin:0 0 16px;font-size:12px;font-weight:700;letter-spacing:0.15em;color:#52525b;text-transform:uppercase;">What Happens Next</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                    <tr>
                      <td style="width:32px;vertical-align:top;padding-top:2px;">
                        <div style="width:24px;height:24px;border-radius:50%;background:#3730a3;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;text-align:center;line-height:24px;">1</div>
                      </td>
                      <td style="padding:0 0 16px 12px;font-size:13px;color:#a1a1aa;line-height:1.6;">
                        <strong style="color:#e4e4e7;">In Production</strong> — Your custom apparel is being printed (3–5 business days).
                      </td>
                    </tr>
                    <tr>
                      <td style="width:32px;vertical-align:top;padding-top:2px;">
                        <div style="width:24px;height:24px;border-radius:50%;background:#27272a;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#71717a;text-align:center;line-height:24px;">2</div>
                      </td>
                      <td style="padding:0 0 16px 12px;font-size:13px;color:#a1a1aa;line-height:1.6;">
                        <strong style="color:#71717a;">Dispatched</strong> — We&apos;ll email you a tracking number once shipped.
                      </td>
                    </tr>
                    <tr>
                      <td style="width:32px;vertical-align:top;padding-top:2px;">
                        <div style="width:24px;height:24px;border-radius:50%;background:#27272a;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#71717a;text-align:center;line-height:24px;">3</div>
                      </td>
                      <td style="padding:0 0 0 12px;font-size:13px;color:#a1a1aa;line-height:1.6;">
                        <strong style="color:#71717a;">Delivered</strong> — Enjoy your unique piece. Share it with us on Instagram!
                      </td>
                    </tr>
                  </table>

                  <!-- CTA -->
                  <div style="text-align:center;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL}/profile"
                       style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:14px 32px;border-radius:999px;letter-spacing:0.05em;">
                      View My Wardrobe →
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:24px 40px;border-top:1px solid #27272a;text-align:center;">
                  <p style="margin:0;font-size:11px;color:#52525b;line-height:1.7;">
                    Questions? Reply to this email or WhatsApp us at
                    <a href="https://wa.me/923497839492" style="color:#818cf8;">+92 349 7839492</a><br/>
                    Pehchan · DHA Phase 6, Lahore, Pakistan
                  </p>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });

      if (emailError) {
        console.error('[confirm-order] RESEND EMAIL ERROR:', emailError);
      } else {
        console.log('[confirm-order] RECEIPT EMAIL SENT — Resend ID:', emailData?.id);
        console.log('[confirm-order] Email sent to:', fullOrder.customer_email, 'and', adminEmail);
      }
    } catch (emailException) {
      // Non-fatal — order is confirmed, log and continue
      console.error('[confirm-order] Unexpected error sending receipt email:', emailException);
    }
  }

  console.log('=== CONFIRM ORDER COMPLETE ===');

  return NextResponse.json({ success: true, order: updatedOrder });
}
