import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: emails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3)
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching emails:', fetchError);
      throw fetchError;
    }

    if (!emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No pending emails' }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    let successCount = 0;
    let failCount = 0;

    for (const email of emails) {
      try {
        const { error: sendError } = await supabase.functions.invoke('send-email', {
          body: {
            to: email.recipient_email,
            template: email.template,
            data: email.data,
          },
        });

        if (sendError) {
          throw sendError;
        }

        await supabase
          .from('email_queue')
          .update({ 
            status: 'sent',
            last_attempt_at: new Date().toISOString()
          })
          .eq('id', email.id);

        successCount++;
      } catch (error: any) {
        console.error(`Failed to send email ${email.id}:`, error);
        
        await supabase
          .from('email_queue')
          .update({
            status: email.attempts >= 2 ? 'failed' : 'pending',
            attempts: email.attempts + 1,
            last_attempt_at: new Date().toISOString(),
            error_message: error.message,
          })
          .eq('id', email.id);

        failCount++;
      }
    }

    return new Response(
      JSON.stringify({
        processed: emails.length,
        success: successCount,
        failed: failCount,
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: any) {
    console.error('Email queue processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});