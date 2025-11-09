import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OSINTReport {
  id: string;
  investor_request_id: string;
  investor_name: string;
  investor_email: string;
  investor_company: string | null;
  investor_phone: string | null;
  investment_range: string;
  risk_score: number;
  risk_level: string;
  recommendation: string;
  recommendation_reason: string;
  confidence_score: number;
  key_findings: string[];
  created_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@gigmate.com";

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, run OSINT investigations
    console.log("Running OSINT investigations...");
    const { data: osintResult, error: osintError } = await supabase.functions.invoke(
      "osint-investigator"
    );

    if (osintError) {
      console.error("OSINT investigation error:", osintError);
    }

    // Get all completed investigations from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: investigations, error: investigationsError } = await supabase
      .from("osint_investigations")
      .select(`
        *,
        investor_interest_requests (
          full_name,
          email,
          company,
          phone,
          investment_range
        )
      `)
      .eq("status", "completed")
      .gte("investigation_completed_at", yesterday.toISOString())
      .order("investigation_completed_at", { ascending: false });

    if (investigationsError) throw investigationsError;

    if (!investigations || investigations.length === 0) {
      console.log("No new investigations to report");
      return new Response(
        JSON.stringify({ message: "No investigations completed in the last 24 hours" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format reports
    const reports: OSINTReport[] = investigations.map((inv: any) => ({
      id: inv.id,
      investor_request_id: inv.investor_request_id,
      investor_name: inv.investor_interest_requests?.full_name || "Unknown",
      investor_email: inv.investor_interest_requests?.email || "Unknown",
      investor_company: inv.investor_interest_requests?.company || null,
      investor_phone: inv.investor_interest_requests?.phone || null,
      investment_range: inv.investor_interest_requests?.investment_range || "Unknown",
      risk_score: inv.risk_score || 0,
      risk_level: inv.risk_level || "unknown",
      recommendation: inv.recommendation || "more_info_needed",
      recommendation_reason: inv.recommendation_reason || "No reason provided",
      confidence_score: inv.confidence_score || 0,
      key_findings: inv.risk_factors || [],
      created_at: inv.investigation_completed_at,
    }));

    // Generate email HTML
    const emailHtml = generateReportEmail(reports);

    // Send email
    const { error: emailError } = await supabase.functions.invoke("send-email", {
      body: {
        to: adminEmail,
        subject: `GigMate OSINT Daily Report - ${new Date().toLocaleDateString()} - ${reports.length} Investigation(s)`,
        html: emailHtml,
        text: generateReportText(reports),
      },
    });

    if (emailError) {
      console.error("Failed to send email:", emailError);
      throw emailError;
    }

    console.log(`Daily OSINT report sent to ${adminEmail}`);

    return new Response(
      JSON.stringify({
        message: "Daily OSINT report sent successfully",
        investigations_reported: reports.length,
        sent_to: adminEmail,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in OSINT daily report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateReportEmail(reports: OSINTReport[]): string {
  const approveCount = reports.filter(r => r.recommendation === "approve").length;
  const denyCount = reports.filter(r => r.recommendation === "deny").length;
  const moreInfoCount = reports.filter(r => r.recommendation === "more_info_needed").length;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .summary-card { background: white; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #ddd; }
        .summary-card.approve { border-left-color: #28a745; }
        .summary-card.deny { border-left-color: #dc3545; }
        .summary-card.info { border-left-color: #ffc107; }
        .summary-number { font-size: 32px; font-weight: bold; margin: 10px 0; }
        .report { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .report-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 2px solid #f1f1f1; }
        .investor-name { font-size: 20px; font-weight: bold; color: #333; }
        .recommendation { padding: 8px 16px; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 12px; }
        .recommendation.approve { background: #d4edda; color: #155724; }
        .recommendation.deny { background: #f8d7da; color: #721c24; }
        .recommendation.more_info_needed { background: #fff3cd; color: #856404; }
        .risk-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-left: 10px; }
        .risk-badge.low { background: #d4edda; color: #155724; }
        .risk-badge.medium { background: #fff3cd; color: #856404; }
        .risk-badge.high { background: #f8d7da; color: #721c24; }
        .risk-badge.critical { background: #721c24; color: white; }
        .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 15px 0; }
        .detail-item { padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .detail-label { font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; }
        .detail-value { font-size: 14px; color: #333; }
        .findings { margin: 15px 0; }
        .findings-list { list-style: none; padding: 0; }
        .findings-list li { padding: 8px 12px; margin: 5px 0; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; }
        .reason-box { background: #e7f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .score-bar { height: 24px; background: #e9ecef; border-radius: 12px; overflow: hidden; margin: 10px 0; }
        .score-fill { height: 100%; background: linear-gradient(90deg, #dc3545 0%, #ffc107 50%, #28a745 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🔍 GigMate OSINT Daily Report</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Investor Verification Intelligence</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        <div class="summary">
          <h2 style="margin-top: 0;">Executive Summary</h2>
          <div class="summary-grid">
            <div class="summary-card approve">
              <div style="color: #28a745; font-weight: bold;">APPROVE</div>
              <div class="summary-number">${approveCount}</div>
              <div style="font-size: 12px; color: #666;">Ready for approval</div>
            </div>
            <div class="summary-card deny">
              <div style="color: #dc3545; font-weight: bold;">DENY</div>
              <div class="summary-number">${denyCount}</div>
              <div style="font-size: 12px; color: #666;">Recommend rejection</div>
            </div>
            <div class="summary-card info">
              <div style="color: #ffc107; font-weight: bold;">MORE INFO</div>
              <div class="summary-number">${moreInfoCount}</div>
              <div style="font-size: 12px; color: #666;">Needs investigation</div>
            </div>
          </div>
        </div>

        <h2>Detailed Reports</h2>

        ${reports.map(report => `
          <div class="report">
            <div class="report-header">
              <div>
                <div class="investor-name">${report.investor_name}</div>
                <div style="color: #666; font-size: 14px;">${report.investor_email}</div>
                ${report.investor_company ? `<div style="color: #666; font-size: 13px; margin-top: 4px;">${report.investor_company}</div>` : ""}
              </div>
              <div style="text-align: right;">
                <div class="recommendation ${report.recommendation}">${report.recommendation.replace("_", " ")}</div>
                <span class="risk-badge ${report.risk_level}">${report.risk_level.toUpperCase()} RISK</span>
              </div>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Investment Range</div>
                <div class="detail-value">${report.investment_range}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Phone</div>
                <div class="detail-value">${report.investor_phone || "Not provided"}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Risk Score</div>
                <div class="detail-value">${report.risk_score}/100</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Confidence Score</div>
                <div class="detail-value">${report.confidence_score}/100</div>
              </div>
            </div>

            <div style="margin: 15px 0;">
              <div class="detail-label">Risk Assessment</div>
              <div class="score-bar">
                <div class="score-fill" style="width: ${report.risk_score}%">
                  ${report.risk_score}% Risk
                </div>
              </div>
            </div>

            ${report.key_findings.length > 0 ? `
              <div class="findings">
                <div class="detail-label">⚠️ Risk Factors Identified</div>
                <ul class="findings-list">
                  ${report.key_findings.map(finding => `<li>${finding}</li>`).join("")}
                </ul>
              </div>
            ` : ""}

            <div class="reason-box">
              <div class="detail-label">🤖 GigM8Ai Recommendation</div>
              <p style="margin: 10px 0 0 0;">${report.recommendation_reason}</p>
            </div>

            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6; font-size: 12px; color: #666;">
              Investigation completed at ${new Date(report.created_at).toLocaleString()}
            </div>
          </div>
        `).join("")}

        <div class="footer">
          <p><strong>GigM8Ai Automated OSINT System</strong></p>
          <p>This report was automatically generated by analyzing public information sources including email validation, address verification, company records, professional profiles, and geolocation data.</p>
          <p style="margin-top: 15px;">Review these findings in your GigMate Admin Dashboard to make final approval decisions.</p>
          <p style="margin-top: 15px; font-size: 11px; color: #999;">
            Confidential Information - For Authorized Personnel Only<br/>
            © ${new Date().getFullYear()} GigMate. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateReportText(reports: OSINTReport[]): string {
  const approveCount = reports.filter(r => r.recommendation === "approve").length;
  const denyCount = reports.filter(r => r.recommendation === "deny").length;
  const moreInfoCount = reports.filter(r => r.recommendation === "more_info_needed").length;

  let text = `GigMate OSINT Daily Report - ${new Date().toLocaleDateString()}\n`;
  text += `${"=".repeat(70)}\n\n`;
  text += `EXECUTIVE SUMMARY\n`;
  text += `-`.repeat(70) + `\n`;
  text += `Approve: ${approveCount} | Deny: ${denyCount} | More Info Needed: ${moreInfoCount}\n\n`;

  reports.forEach((report, index) => {
    text += `\n${"=".repeat(70)}\n`;
    text += `REPORT #${index + 1}: ${report.investor_name}\n`;
    text += `${"=".repeat(70)}\n`;
    text += `Email: ${report.investor_email}\n`;
    text += `Company: ${report.investor_company || "Not provided"}\n`;
    text += `Phone: ${report.investor_phone || "Not provided"}\n`;
    text += `Investment Range: ${report.investment_range}\n`;
    text += `\n`;
    text += `RECOMMENDATION: ${report.recommendation.toUpperCase().replace("_", " ")}\n`;
    text += `Risk Level: ${report.risk_level.toUpperCase()}\n`;
    text += `Risk Score: ${report.risk_score}/100\n`;
    text += `Confidence: ${report.confidence_score}/100\n`;
    text += `\n`;
    if (report.key_findings.length > 0) {
      text += `Risk Factors:\n`;
      report.key_findings.forEach(finding => {
        text += `  - ${finding}\n`;
      });
      text += `\n`;
    }
    text += `GigM8Ai Analysis:\n${report.recommendation_reason}\n`;
    text += `\n`;
    text += `Investigated: ${new Date(report.created_at).toLocaleString()}\n`;
  });

  text += `\n${"=".repeat(70)}\n`;
  text += `End of Report\n`;
  text += `GigM8Ai Automated OSINT System\n`;

  return text;
}
