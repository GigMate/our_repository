import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@14.10.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature",
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === "subscription") {
          const { data: profile } = await supabase
            .from("profiles")
            .update({
              subscription_status: "active",
              subscription_tier: session.metadata?.tier || "bronze",
              stripe_subscription_id: session.subscription as string,
            })
            .eq("id", session.client_reference_id!)
            .select()
            .single();

          await supabase.from("transactions").insert({
            user_id: session.client_reference_id,
            type: "subscription",
            amount: (session.amount_total || 0) / 100,
            status: "completed",
            stripe_payment_intent_id: session.payment_intent as string,
            metadata: session.metadata,
          });
        } else if (session.metadata?.type === "ticket") {
          await supabase.from("ticket_purchases").insert({
            fan_id: session.metadata.fan_id,
            event_id: session.metadata.event_id,
            quantity: parseInt(session.metadata.quantity || "1"),
            total_amount: (session.amount_total || 0) / 100,
            stripe_payment_intent_id: session.payment_intent as string,
            status: "completed",
          });

          await supabase.from("transactions").insert({
            user_id: session.metadata.fan_id,
            type: "ticket_purchase",
            amount: (session.amount_total || 0) / 100,
            status: "completed",
            stripe_payment_intent_id: session.payment_intent as string,
            metadata: session.metadata,
          });
        } else if (session.metadata?.type === "escrow") {
          await supabase.from("escrow_transactions").insert({
            booking_id: session.metadata.booking_id,
            venue_id: session.metadata.venue_id,
            musician_id: session.metadata.musician_id,
            amount: (session.amount_total || 0) / 100,
            gigmate_fee: parseFloat(session.metadata.gigmate_fee || "0"),
            stripe_payment_intent_id: session.payment_intent as string,
            status: "held",
          });

          await supabase.from("transactions").insert({
            user_id: session.metadata.venue_id,
            type: "escrow_deposit",
            amount: (session.amount_total || 0) / 100,
            status: "completed",
            stripe_payment_intent_id: session.payment_intent as string,
            metadata: session.metadata,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from("profiles")
          .update({
            subscription_status: "cancelled",
            subscription_tier: "free",
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        
        await supabase
          .from("profiles")
          .update({
            subscription_status: "past_due",
          })
          .eq("stripe_subscription_id", invoice.subscription as string);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase
          .from("transactions")
          .update({
            status: "completed",
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        await supabase
          .from("transactions")
          .update({
            status: "failed",
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Webhook handler error:", error);
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