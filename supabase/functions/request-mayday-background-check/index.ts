import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MaydayRequest {
  investor_request_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { investor_request_id }: MaydayRequest = await req.json();

    if (!investor_request_id) {
      throw new Error("investor_request_id is required");
    }

    // Get investor request details
    const { data: investorRequest, error: fetchError } = await supabase
      .from("investor_interest_requests")
      .select("*")
      .eq("id", investor_request_id)
      .single();

    if (fetchError || !investorRequest) {
      throw new Error("Investor request not found");
    }

    // Verify payment was made (this should be called AFTER Stripe payment succeeds)
    if (!investorRequest.mayday_check_paid) {
      throw new Error("Payment not confirmed for background check");
    }

    // Prepare KYC data package for Mayday Investigations
    const kycDataPackage = {
      request_id: investorRequest.id,
      request_date: new Date().toISOString(),

      // Personal Information
      full_name: investorRequest.full_name,
      email: investorRequest.email,
      phone: investorRequest.phone,
      company: investorRequest.company,
      investment_range: investorRequest.investment_range,

      // Physical Address
      physical_address: {
        line1: investorRequest.physical_address_line1,
        line2: investorRequest.physical_address_line2,
        city: investorRequest.physical_city,
        state: investorRequest.physical_state,
        zip: investorRequest.physical_zip,
        country: investorRequest.physical_country,
      },

      // Mailing Address
      mailing_address: {
        line1: investorRequest.mailing_address_line1,
        line2: investorRequest.mailing_address_line2,
        city: investorRequest.mailing_city,
        state: investorRequest.mailing_state,
        zip: investorRequest.mailing_zip,
        country: investorRequest.mailing_country,
        same_as_physical: investorRequest.mailing_same_as_physical,
      },

      // KYC Consent
      kyc_consent: {
        given: investorRequest.kyc_consent_given,
        timestamp: investorRequest.kyc_consent_timestamp,
        ip_address: investorRequest.kyc_consent_ip,
      },

      // Additional Context
      message: investorRequest.message,
      documents_signed: investorRequest.documents_signed_at ? true : false,

      // Instructions for Mayday
      instructions: "Please perform a comprehensive background check on this investor prospect. This is for investment opportunity verification purposes. The subject has provided full consent for this investigation.",

      service_requested: "Investor Background Check - Standard Package",
      payment_amount: "$50.00",
      payment_status: "Paid",
    };

    // Generate HTML email for Mayday Investigations
    const maydayEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3a8a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .section { margin: 25px 0; padding: 20px; background: #f9fafb; border-radius: 6px; }
          .label { font-weight: bold; color: #4b5563; text-transform: uppercase; font-size: 11px; margin-bottom: 5px; }
          .value { color: #111827; font-size: 14px; margin-bottom: 15px; }
          .important { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">GigMate Investor Background Check Request</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Request ID: ${investorRequest.id}</p>
          </div>

          <div class="content">
            <div class="important">
              <strong>⚠️ CONFIDENTIAL - Background Check Request</strong><br/>
              This email contains sensitive personal information for background verification purposes only.
              Please handle according to your standard confidentiality protocols.
            </div>

            <div class="section">
              <h2 style="margin-top: 0;">Service Details</h2>
              <div class="label">Service Requested</div>
              <div class="value">Investor Background Check - Standard Package</div>
              <div class="label">Payment Status</div>
              <div class="value">✓ Paid - $50.00</div>
              <div class="label">Request Date</div>
              <div class="value">${new Date().toLocaleString()}</div>
            </div>

            <div class="section">
              <h2 style="margin-top: 0;">Subject Information</h2>
              <div class="label">Full Name</div>
              <div class="value">${investorRequest.full_name}</div>

              <div class="label">Email Address</div>
              <div class="value">${investorRequest.email}</div>

              ${investorRequest.phone ? `
                <div class="label">Phone Number</div>
                <div class="value">${investorRequest.phone}</div>
              ` : ''}

              ${investorRequest.company ? `
                <div class="label">Company/Organization</div>
                <div class="value">${investorRequest.company}</div>
              ` : ''}

              <div class="label">Investment Range</div>
              <div class="value">${investorRequest.investment_range}</div>
            </div>

            <div class="section">
              <h2 style="margin-top: 0;">Physical Address</h2>
              <div class="value">
                ${investorRequest.physical_address_line1}<br/>
                ${investorRequest.physical_address_line2 ? investorRequest.physical_address_line2 + '<br/>' : ''}
                ${investorRequest.physical_city}, ${investorRequest.physical_state} ${investorRequest.physical_zip}<br/>
                ${investorRequest.physical_country}
              </div>
            </div>

            <div class="section">
              <h2 style="margin-top: 0;">Mailing Address</h2>
              ${investorRequest.mailing_same_as_physical ? `
                <div class="value" style="font-style: italic;">Same as physical address</div>
              ` : `
                <div class="value">
                  ${investorRequest.mailing_address_line1}<br/>
                  ${investorRequest.mailing_address_line2 ? investorRequest.mailing_address_line2 + '<br/>' : ''}
                  ${investorRequest.mailing_city}, ${investorRequest.mailing_state} ${investorRequest.mailing_zip}<br/>
                  ${investorRequest.mailing_country}
                </div>
              `}
            </div>

            <div class="section">
              <h2 style="margin-top: 0;">Consent & Authorization</h2>
              <div class="label">KYC Consent Status</div>
              <div class="value">✓ Granted on ${new Date(investorRequest.kyc_consent_timestamp).toLocaleString()}</div>
              <div class="label">IP Address (for verification)</div>
              <div class="value">${investorRequest.kyc_consent_ip || 'Not available'}</div>
              <p style="font-size: 13px; color: #6b7280; margin-top: 10px;">
                Subject has provided explicit written consent for GigMate to conduct comprehensive background
                investigations for investor verification purposes.
              </p>
            </div>

            ${investorRequest.message ? `
              <div class="section">
                <h2 style="margin-top: 0;">Additional Context</h2>
                <div class="value">${investorRequest.message}</div>
              </div>
            ` : ''}

            <div class="section">
              <h2 style="margin-top: 0;">Instructions for Mayday Investigations</h2>
              <p>Please perform a comprehensive background check including:</p>
              <ul>
                <li>Identity verification</li>
                <li>Criminal history check (if applicable by law)</li>
                <li>Address verification</li>
                <li>Financial background (public records)</li>
                <li>Professional/business verification</li>
                <li>Any other standard investor verification checks</li>
              </ul>
              <p style="margin-top: 15px;">
                <strong>Timeline:</strong> Please complete within 5-7 business days if possible.
              </p>
              <p>
                <strong>Report Delivery:</strong> Please send completed report to admin@gigmate.com
              </p>
            </div>

            <div class="footer">
              <p><strong>GigMate Platform</strong></p>
              <p>This is an automated request from the GigMate investor verification system.</p>
              <p>Questions? Contact: admin@gigmate.com</p>
              <p style="margin-top: 15px; font-size: 11px;">
                Confidential and Proprietary Information<br/>
                © ${new Date().getFullYear()} GigMate. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to Mayday Investigations
    if (!resendApiKey) {
      throw new Error("Email service not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "GigMate Investor Services <notifications@gigmate.us>",
        to: ["jon@maydaypi.com", "jt@maydaypi.com"],
        subject: `Background Check Request - ${investorRequest.full_name} - Request #${investorRequest.id.slice(0, 8)}`,
        html: maydayEmailHtml,
        reply_to: "admin@gigmate.com",
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Failed to send email to Mayday: ${errorText}`);
    }

    // Update investor request to mark that Mayday request was sent
    const { error: updateError } = await supabase
      .from("investor_interest_requests")
      .update({
        mayday_check_request_sent: true,
        mayday_check_request_date: new Date().toISOString(),
        background_check_status: "mayday_requested",
      })
      .eq("id", investor_request_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`Mayday background check request sent for investor: ${investorRequest.full_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Background check request sent to Mayday Investigations",
        request_sent_to: ["jon@maydaypi.com", "jt@maydaypi.com"],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error requesting Mayday background check:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
