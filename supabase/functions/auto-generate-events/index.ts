import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting auto event generation...");

    // Call the database function to generate events
    const { data: generateResult, error: generateError } = await supabase
      .rpc("generate_upcoming_events", { weeks_ahead: 4 });

    if (generateError) {
      console.error("Error generating events:", generateError);
      throw generateError;
    }

    console.log(`Generated ${generateResult} new events`);

    // Clean up old events
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc("cleanup_past_events");

    if (cleanupError) {
      console.error("Error cleaning up events:", cleanupError);
    } else {
      console.log(`Cleaned up ${cleanupResult} old events`);
    }

    // Get current event count
    const { count, error: countError } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .gte("event_date", new Date().toISOString());

    if (countError) {
      console.error("Error counting events:", countError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Event auto-generation completed",
        events_generated: generateResult,
        events_cleaned: cleanupResult || 0,
        total_upcoming_events: count || 0,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});