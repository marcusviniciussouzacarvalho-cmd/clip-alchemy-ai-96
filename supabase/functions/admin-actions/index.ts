import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller is admin using anon client
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roles } = await anonClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for privileged operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, target_user_id, ...params } = await req.json();

    if (!target_user_id) {
      return new Response(JSON.stringify({ error: "target_user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-actions
    if (target_user_id === user.id && (action === "delete" || action === "block")) {
      return new Response(JSON.stringify({ error: "Cannot perform this action on yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any = { success: true };

    switch (action) {
      case "delete": {
        // Delete user data first, then auth user
        await adminClient.from("clips").delete().eq("user_id", target_user_id);
        await adminClient.from("videos").delete().eq("user_id", target_user_id);
        await adminClient.from("processing_jobs").delete().eq("user_id", target_user_id);
        await adminClient.from("credits").delete().eq("user_id", target_user_id);
        await adminClient.from("credit_transactions").delete().eq("user_id", target_user_id);
        await adminClient.from("notifications").delete().eq("user_id", target_user_id);
        await adminClient.from("notification_preferences").delete().eq("user_id", target_user_id);
        await adminClient.from("profiles").delete().eq("user_id", target_user_id);
        await adminClient.from("saved_ideas").delete().eq("user_id", target_user_id);
        await adminClient.from("user_roles").delete().eq("user_id", target_user_id);

        const { error: deleteErr } = await adminClient.auth.admin.deleteUser(target_user_id);
        if (deleteErr) throw deleteErr;
        result.message = "User deleted";
        break;
      }

      case "block": {
        // Ban user via auth admin
        const { error: banErr } = await adminClient.auth.admin.updateUserById(target_user_id, {
          ban_duration: params.unblock ? "none" : "876000h", // ~100 years
        });
        if (banErr) throw banErr;
        result.message = params.unblock ? "User unblocked" : "User blocked";
        break;
      }

      case "credits":
      case "update_credits": {
        const newBalance = parseInt(params.balance, 10);
        if (isNaN(newBalance) || newBalance < 0) {
          return new Response(JSON.stringify({ error: "Invalid balance" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error: creditErr } = await adminClient
          .from("credits")
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq("user_id", target_user_id);
        if (creditErr) throw creditErr;
        result.message = `Credits updated to ${newBalance}`;
        break;
      }

      case "reset_password": {
        // Get user email first
        const { data: targetUser, error: userErr } = await adminClient.auth.admin.getUserById(target_user_id);
        if (userErr || !targetUser?.user?.email) throw userErr || new Error("User not found");

        // Generate a password reset link
        const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
          type: "recovery",
          email: targetUser.user.email,
        });
        if (linkErr) throw linkErr;
        result.message = "Password reset link generated";
        result.email = targetUser.user.email;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
