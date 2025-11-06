import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.10.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-11-20.acacia",
    });

    const { type, tier, priceId, metadata } = await req.json();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    let sessionParams: any = {
      mode: type === "subscription" ? "subscription" : "payment",
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: metadata || {},
    };

    if (type === "subscription") {
      const prices: Record<string, string> = {
        bronze: "price_bronze",
        silver: "price_silver",
        gold: "price_gold",
        platinum: "price_platinum",
      };

      sessionParams.line_items = [
        {
          price: priceId || prices[tier],
          quantity: 1,
        },
      ];
    } else if (type === "ticket") {
      sessionParams.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: metadata.eventName || "Event Ticket",
              description: metadata.description || "",
            },
            unit_amount: Math.round(metadata.price * 100),
          },
          quantity: metadata.quantity || 1,
        },
      ];
    } else if (type === "escrow") {
      sessionParams.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Booking Deposit - ${metadata.musicianName}`,
              description: `Event: ${metadata.eventDate}`,
            },
            unit_amount: Math.round(metadata.amount * 100),
          },
          quantity: 1,
        },
      ];
      sessionParams.payment_intent_data = {
        application_fee_amount: Math.round(metadata.gigmateFee * 100),
        transfer_data: {
          destination: metadata.musicianStripeAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});