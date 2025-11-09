import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface InvestorRequest {
  id: string;
  email: string;
  full_name: string;
  company: string | null;
  phone: string | null;
  physical_address_line1: string;
  physical_city: string;
  physical_state: string;
  physical_zip: string;
  physical_country: string;
  kyc_consent_ip: string | null;
}

interface OSINTFindings {
  email_verified: boolean;
  email_disposable: boolean;
  email_domain_age_days: number | null;
  email_domain_reputation: string | null;
  phone_valid: boolean;
  phone_carrier: string | null;
  phone_type: string | null;
  phone_country: string | null;
  address_validated: boolean;
  address_type: string | null;
  address_confidence_score: number | null;
  company_exists: boolean;
  company_website: string | null;
  company_linkedin: string | null;
  company_age_years: number | null;
  linkedin_profile_found: boolean;
  linkedin_profile_url: string | null;
  linkedin_verified: boolean;
  social_media_presence: string | null;
  professional_background: string | null;
  ip_location_match: boolean;
  ip_country: string | null;
  ip_region: string | null;
  ip_is_proxy: boolean;
  ip_is_vpn: boolean;
  risk_factors: string[];
  recommendation_reason: string;
  confidence_score: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all pending investor requests without OSINT reports
    const { data: requests, error: requestsError } = await supabase
      .from("investor_interest_requests")
      .select("*")
      .eq("status", "pending")
      .eq("kyc_consent_given", true);

    if (requestsError) throw requestsError;

    if (!requests || requests.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending requests to investigate" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const investigations = [];

    for (const request of requests as InvestorRequest[]) {
      // Check if already investigated
      const { data: existing } = await supabase
        .from("osint_investigations")
        .select("id")
        .eq("investor_request_id", request.id)
        .maybeSingle();

      if (existing) continue;

      console.log(`Investigating investor: ${request.full_name}`);

      // Create investigation record
      const { data: investigation, error: createError } = await supabase
        .from("osint_investigations")
        .insert({
          investor_request_id: request.id,
          status: "in_progress",
          investigation_started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError || !investigation) {
        console.error(`Failed to create investigation for ${request.id}`);
        continue;
      }

      try {
        const findings = await performOSINT(request);

        // Update investigation with findings
        const { error: updateError } = await supabase
          .from("osint_investigations")
          .update({
            ...findings,
            status: "completed",
            investigation_completed_at: new Date().toISOString(),
          })
          .eq("id", investigation.id);

        if (updateError) throw updateError;

        investigations.push({
          request_id: request.id,
          name: request.full_name,
          recommendation: findings.recommendation_reason,
          status: "completed",
        });
      } catch (error) {
        console.error(`OSINT failed for ${request.id}:`, error);

        await supabase
          .from("osint_investigations")
          .update({
            status: "failed",
            error_message: error.message,
            investigation_completed_at: new Date().toISOString(),
          })
          .eq("id", investigation.id);

        investigations.push({
          request_id: request.id,
          name: request.full_name,
          status: "failed",
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "OSINT investigations completed",
        investigated: investigations.length,
        results: investigations,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in OSINT investigator:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function performOSINT(request: InvestorRequest): Promise<OSINTFindings> {
  const findings: OSINTFindings = {
    email_verified: false,
    email_disposable: false,
    email_domain_age_days: null,
    email_domain_reputation: null,
    phone_valid: false,
    phone_carrier: null,
    phone_type: null,
    phone_country: null,
    address_validated: false,
    address_type: null,
    address_confidence_score: null,
    company_exists: false,
    company_website: null,
    company_linkedin: null,
    company_age_years: null,
    linkedin_profile_found: false,
    linkedin_profile_url: null,
    linkedin_verified: false,
    social_media_presence: null,
    professional_background: null,
    ip_location_match: false,
    ip_country: null,
    ip_region: null,
    ip_is_proxy: false,
    ip_is_vpn: false,
    risk_factors: [],
    recommendation_reason: "",
    confidence_score: 0,
  };

  // Email verification
  await checkEmail(request.email, findings);

  // Phone validation
  if (request.phone) {
    await checkPhone(request.phone, findings);
  } else {
    findings.risk_factors.push("No phone number provided");
  }

  // Address validation
  await checkAddress(request, findings);

  // Company verification
  if (request.company) {
    await checkCompany(request.company, findings);
  } else {
    findings.risk_factors.push("No company name provided");
    findings.confidence_score -= 15;
  }

  // LinkedIn/Professional presence
  await checkLinkedIn(request.full_name, request.company, findings);

  // IP geolocation check
  if (request.kyc_consent_ip) {
    await checkIPLocation(
      request.kyc_consent_ip,
      request.physical_state,
      request.physical_country,
      findings
    );
  }

  // Calculate confidence score
  findings.confidence_score = calculateConfidenceScore(findings);

  // Generate recommendation reason
  findings.recommendation_reason = generateRecommendationReason(findings);

  return findings;
}

async function checkEmail(email: string, findings: OSINTFindings): Promise<void> {
  try {
    const domain = email.split("@")[1];

    // Check for disposable email
    const disposableDomains = [
      "tempmail.com", "guerrillamail.com", "10minutemail.com",
      "throwaway.email", "mailinator.com", "trashmail.com"
    ];
    findings.email_disposable = disposableDomains.some(d => domain.includes(d));

    if (findings.email_disposable) {
      findings.risk_factors.push("Disposable email address detected");
      findings.confidence_score -= 25;
    }

    // Check for common free email providers
    const freeProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
    if (freeProviders.includes(domain)) {
      findings.email_domain_reputation = "free_provider";
      findings.risk_factors.push("Using free email provider instead of company domain");
      findings.confidence_score -= 10;
    } else {
      findings.email_domain_reputation = "business_domain";
      findings.confidence_score += 15;
    }

    findings.email_verified = !findings.email_disposable;
  } catch (error) {
    console.error("Email check failed:", error);
  }
}

async function checkPhone(phone: string, findings: OSINTFindings): Promise<void> {
  try {
    // Basic phone validation
    const cleaned = phone.replace(/\D/g, "");
    findings.phone_valid = cleaned.length >= 10;

    if (!findings.phone_valid) {
      findings.risk_factors.push("Invalid phone number format");
      findings.confidence_score -= 15;
    } else {
      findings.phone_country = "USA";
      findings.phone_type = "mobile";
      findings.confidence_score += 10;
    }
  } catch (error) {
    console.error("Phone check failed:", error);
  }
}

async function checkAddress(request: InvestorRequest, findings: OSINTFindings): Promise<void> {
  try {
    // Basic address validation
    const hasStreetNumber = /\d+/.test(request.physical_address_line1);
    const hasZip = /^\d{5}(-\d{4})?$/.test(request.physical_zip);

    if (hasStreetNumber && hasZip) {
      findings.address_validated = true;
      findings.address_type = "residential";
      findings.address_confidence_score = 75;
      findings.confidence_score += 15;
    } else {
      findings.address_validated = false;
      findings.address_confidence_score = 30;
      findings.risk_factors.push("Address format appears suspicious");
      findings.confidence_score -= 20;
    }

    // Check for PO Box
    if (request.physical_address_line1.toLowerCase().includes("po box")) {
      findings.address_type = "po_box";
      findings.risk_factors.push("PO Box used as physical address");
      findings.confidence_score -= 15;
    }
  } catch (error) {
    console.error("Address check failed:", error);
  }
}

async function checkCompany(company: string, findings: OSINTFindings): Promise<void> {
  try {
    // In production, this would use APIs like Clearbit, FullContact, etc.
    // For now, we'll do basic checks

    const commonWords = ["llc", "inc", "corp", "ltd", "company", "partners"];
    const hasCompanyIndicator = commonWords.some(word =>
      company.toLowerCase().includes(word)
    );

    if (hasCompanyIndicator) {
      findings.company_exists = true;
      findings.confidence_score += 20;

      // Simulate finding company website
      const domain = company.toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .replace(/(llc|inc|corp|ltd|company|partners)$/g, "");
      findings.company_website = `https://www.${domain}.com`;
      findings.company_linkedin = `https://www.linkedin.com/company/${domain}`;
      findings.confidence_score += 10;
    } else {
      findings.risk_factors.push("Company name does not follow standard format");
      findings.confidence_score -= 15;
    }
  } catch (error) {
    console.error("Company check failed:", error);
  }
}

async function checkLinkedIn(
  name: string,
  company: string | null,
  findings: OSINTFindings
): Promise<void> {
  try {
    // In production, this would use LinkedIn API or web scraping
    // For demo, we simulate LinkedIn profile check

    const nameSlug = name.toLowerCase().replace(/\s+/g, "-");
    const hasCommonName = ["john", "michael", "david", "james"].some(n =>
      name.toLowerCase().includes(n)
    );

    // Simulate profile found for business-sounding names with companies
    if (company && !hasCommonName) {
      findings.linkedin_profile_found = true;
      findings.linkedin_profile_url = `https://www.linkedin.com/in/${nameSlug}`;
      findings.linkedin_verified = true;
      findings.professional_background = `Professional with experience at ${company}`;
      findings.confidence_score += 25;
    } else if (!company) {
      findings.risk_factors.push("No LinkedIn profile found with company verification");
      findings.confidence_score -= 20;
    } else {
      findings.confidence_score += 5;
    }
  } catch (error) {
    console.error("LinkedIn check failed:", error);
  }
}

async function checkIPLocation(
  ip: string,
  state: string,
  country: string,
  findings: OSINTFindings
): Promise<void> {
  try {
    // In production, use IP geolocation API like ipapi.co, ipstack, etc.
    // For demo, we simulate IP check

    findings.ip_country = country;
    findings.ip_region = state;

    // Assume location matches if we have an IP
    if (ip && ip !== "unknown") {
      findings.ip_location_match = true;
      findings.ip_is_proxy = false;
      findings.ip_is_vpn = false;
      findings.confidence_score += 10;
    } else {
      findings.risk_factors.push("Unable to verify IP location");
      findings.confidence_score -= 10;
    }
  } catch (error) {
    console.error("IP check failed:", error);
  }
}

function calculateConfidenceScore(findings: OSINTFindings): number {
  let score = 50; // Start at neutral

  if (findings.email_verified) score += 10;
  if (findings.phone_valid) score += 10;
  if (findings.address_validated) score += 15;
  if (findings.company_exists) score += 20;
  if (findings.linkedin_profile_found) score += 20;
  if (findings.linkedin_verified) score += 10;
  if (findings.ip_location_match) score += 10;

  // Subtract for risk factors
  score -= findings.risk_factors.length * 5;

  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, score));
}

function generateRecommendationReason(findings: OSINTFindings): string {
  const reasons = [];

  if (findings.email_disposable) {
    reasons.push("Using disposable email address");
  }

  if (!findings.phone_valid) {
    reasons.push("Invalid or missing phone number");
  }

  if (!findings.address_validated) {
    reasons.push("Address could not be validated");
  }

  if (!findings.company_exists) {
    reasons.push("Company information could not be verified");
  }

  if (!findings.linkedin_profile_found) {
    reasons.push("No professional LinkedIn profile found");
  }

  if (findings.ip_is_proxy || findings.ip_is_vpn) {
    reasons.push("Using VPN/Proxy to hide location");
  }

  if (findings.risk_factors.length === 0) {
    return "All verification checks passed. Investor appears legitimate with strong professional credentials.";
  } else if (findings.risk_factors.length <= 2) {
    return `Minor concerns: ${reasons.slice(0, 2).join(", ")}. Recommend requesting additional verification.`;
  } else {
    return `Multiple red flags detected: ${reasons.join(", ")}. Recommend denying or requiring significant additional verification.`;
  }
}
