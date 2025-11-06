import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string;
  template: string;
  data: Record<string, any>;
}

const templates: Record<string, { subject: string; html: (data: any) => string }> = {
  booking_request: {
    subject: 'New Booking Request',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .details { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Booking Request</h1>
          </div>
          <div class="content">
            <p>You have received a booking request from <strong>${data.venue_name}</strong>!</p>
            
            <div class="details">
              <h2>${data.title}</h2>
              <p><strong>Date:</strong> ${new Date(data.date).toLocaleString()}</p>
              <p><strong>Payment Offered:</strong> $${data.payment.toFixed(2)}</p>
              <p><strong>Description:</strong> ${data.description}</p>
            </div>
            
            <p>Log in to your GigMate account to review and respond to this request.</p>
            
            <a href="${data.link}" class="button">View Booking Request</a>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Remember to respond within 48 hours to maintain your response rate.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 GigMate. All rights reserved.</p>
            <p>This email was sent because you have a GigMate musician account.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
  booking_accepted: {
    subject: 'Booking Accepted!',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .details { background: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Great news! <strong>${data.musician_name}</strong> has accepted your booking request.</p>
            
            <div class="details">
              <h2>${data.title}</h2>
              <p><strong>Date:</strong> ${new Date(data.date).toLocaleString()}</p>
              <p><strong>Payment:</strong> $${data.payment.toFixed(2)}</p>
            </div>
            
            <p>Your payment is being held in escrow and will be released to the musician after the event is completed.</p>
            
            <a href="${data.link}" class="button">View Booking Details</a>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              We'll send you a reminder 24 hours before the event.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 GigMate. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
  booking_declined: {
    subject: 'Booking Request Update',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Request Declined</h1>
          </div>
          <div class="content">
            <p>Unfortunately, <strong>${data.musician_name}</strong> is unable to accept your booking request for "${data.title}".</p>
            
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
            
            <p>Don't worry! There are many talented musicians on GigMate. You can:</p>
            <ul>
              <li>Search for other musicians in your area</li>
              <li>Adjust your booking dates or payment offer</li>
              <li>Contact the musician directly to discuss alternative arrangements</li>
            </ul>
            
            <a href="https://gigmate.us/search" class="button">Find Other Musicians</a>
          </div>
          <div class="footer">
            <p>© 2025 GigMate. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
  booking_counter_offer: {
    subject: 'Counter Offer Received',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .offer-box { background: #fffbeb; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Counter Offer</h1>
          </div>
          <div class="content">
            <p><strong>${data.musician_name}</strong> has sent a counter offer for your booking "${data.title}".</p>
            
            <div class="offer-box">
              <p><strong>Your Offer:</strong> $${data.original_payment.toFixed(2)}</p>
              <p><strong>Counter Offer:</strong> $${data.counter_offer.toFixed(2)}</p>
              ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
            </div>
            
            <p>Review the counter offer and decide whether to accept or decline.</p>
            
            <a href="${data.link}" class="button">View Counter Offer</a>
          </div>
          <div class="footer">
            <p>© 2025 GigMate. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
  ticket_purchase: {
    subject: 'Your GigMate Tickets',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .ticket-info { background: #faf5ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎟️ Ticket Purchase Confirmed!</h1>
          </div>
          <div class="content">
            <p>Thank you for your purchase! Your tickets are ready.</p>
            
            <div class="ticket-info">
              <h2>${data.event_name}</h2>
              <p><strong>Venue:</strong> ${data.venue_name}</p>
              <p><strong>Date:</strong> ${new Date(data.event_date).toLocaleString()}</p>
              <p><strong>Quantity:</strong> ${data.quantity} ticket(s)</p>
              <p><strong>Total:</strong> $${data.total.toFixed(2)}</p>
            </div>
            
            <p>Your tickets with QR codes are available in your GigMate account. Present them at the venue for entry.</p>
            
            <a href="${data.link}" class="button">View Your Tickets</a>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Tip: Download the GigMate mobile app for easy access to your tickets at the event.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 GigMate. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
  subscription_activated: {
    subject: 'Welcome to GigMate Premium!',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .features { background: #fffbeb; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👑 Welcome to Premium!</h1>
          </div>
          <div class="content">
            <p>Your <strong>${data.subscription_type}</strong> subscription is now active!</p>
            
            <div class="features">
              <h3>Your Premium Benefits:</h3>
              <ul>
                <li>Priority search placement</li>
                <li>Advanced analytics and insights</li>
                <li>Unlimited bookings</li>
                <li>Premium support</li>
                <li>And much more!</li>
              </ul>
            </div>
            
            <p>Your subscription will renew on ${new Date(data.current_period_end).toLocaleDateString()}.</p>
            
            <a href="${data.link}" class="button">Explore Premium Features</a>
          </div>
          <div class="footer">
            <p>© 2025 GigMate. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, template, data }: EmailRequest = await req.json();

    const templateConfig = templates[template];
    if (!templateConfig) {
      throw new Error(`Unknown template: ${template}`);
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      throw new Error('Email service not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'GigMate <notifications@gigmate.us>',
        to,
        subject: templateConfig.subject,
        html: templateConfig.html(data),
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Resend API error:', errorData);
      throw new Error(`Failed to send email: ${response.statusText}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: any) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});