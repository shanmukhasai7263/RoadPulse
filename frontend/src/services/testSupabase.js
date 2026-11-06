
import { supabase } from "./supabaseClient";

export async function testSupabaseConnection() {
  console.log("Testing Supabase connection...");

  const { data, error } = await supabase
    .from("complaints")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Supabase connection test failed:", error.message);
    return;
  }

  console.log("Supabase connection successful!");
  console.log("Database response:", data);
}
