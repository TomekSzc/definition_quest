import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";
import fs from "fs";
import path from "path";

/**
 * Global Teardown dla Playwright
 *
 * Ten skrypt uruchamia się PO WSZYSTKICH testach E2E.
 * Czyści bazę danych testową z danych utworzonych podczas testów.
 *
 * Używa klucza publicznego (SUPABASE_KEY) i loguje się jako użytkownik testowy,
 * dzięki czemu respektuje Row Level Security (RLS) - bezpieczniejsze podejście.
 */

async function globalTeardown() {
  console.log("\n🧹 Starting E2E Global Teardown...");

  // Walidacja zmiennych środowiskowych
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const testUserEmail = process.env.E2E_USERNAME;
  const testUserPassword = process.env.E2E_PASSWORD;

  if (!supabaseUrl) {
    console.error("❌ SUPABASE_URL not found in environment variables");
    console.log("   Make sure .env.test is configured properly");
    return;
  }

  if (!supabaseKey) {
    console.error("❌ SUPABASE_KEY not found in environment variables");
    console.log("   Public key is required for cleanup");
    return;
  }

  if (!testUserEmail || !testUserPassword) {
    console.error("❌ E2E_USERNAME or E2E_PASSWORD not found in environment variables");
    console.log("   Test user credentials are required for cleanup");
    return;
  }

  // Utwórz klienta Supabase z kluczem publicznym (respektuje RLS)
  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    console.log("🗑️  Deleting test data from database...");

    // Zaloguj się jako użytkownik testowy
    console.log(`   Logging in as test user: ${testUserEmail}`);
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });

    if (loginError || !authData.user) {
      console.error("❌ Error logging in as test user:", loginError?.message);
      console.log("   Make sure E2E_USERNAME and E2E_PASSWORD are correct");
      return;
    }

    const testUser = authData.user;
    console.log(`   ✅ Logged in successfully (ID: ${testUser.id})`);

    // Usuń dane w odpowiedniej kolejności (ze względu na foreign keys)
    // Teraz jesteśmy zalogowani jako użytkownik testowy, więc RLS pozwala na usuwanie

    // 1. Usuń scores
    const { error: scoresError } = await supabase.from("scores").delete().eq("user_id", testUser.id);

    if (scoresError) {
      console.error("   ⚠️  Error deleting scores:", scoresError.message);
    } else {
      console.log("   ✅ Deleted scores for test user");
    }

    // 2. Usuń ai_requests
    const { error: aiRequestsError } = await supabase.from("ai_requests").delete().eq("user_id", testUser.id);

    if (aiRequestsError) {
      console.error("   ⚠️  Error deleting ai_requests:", aiRequestsError.message);
    } else {
      console.log("   ✅ Deleted ai_requests for test user");
    }

    // 3. Pobierz boards użytkownika, żeby usunąć pairs
    const { data: boards, error: boardsSelectError } = await supabase
      .from("boards")
      .select("id")
      .eq("owner_id", testUser.id);

    if (boardsSelectError) {
      console.error("   ⚠️  Error fetching boards:", boardsSelectError.message);
    } else if (boards && boards.length > 0) {
      const boardIds = boards.map((b) => b.id);

      // 4. Usuń pairs dla wszystkich boards użytkownika
      const { error: pairsError } = await supabase.from("pairs").delete().in("board_id", boardIds);

      if (pairsError) {
        console.error("   ⚠️  Error deleting pairs:", pairsError.message);
      } else {
        console.log(`   ✅ Deleted pairs for ${boards.length} board(s)`);
      }
    }

    // 5. Usuń boards (kaskada usunie powiązane pairs jeśli są jakieś pozostałe)
    const { error: boardsError } = await supabase.from("boards").delete().eq("owner_id", testUser.id);

    if (boardsError) {
      console.error("   ⚠️  Error deleting boards:", boardsError.message);
    } else {
      console.log("   ✅ Deleted boards for test user");
    }

    // 6. Usuń user_meta
    const { error: userMetaError } = await supabase.from("user_meta").delete().eq("id", testUser.id);

    if (userMetaError) {
      console.error("   ⚠️  Error deleting user_meta:", userMetaError.message);
    } else {
      console.log("   ✅ Deleted user_meta for test user");
    }

    // Wyloguj się
    await supabase.auth.signOut();

    console.log("✅ E2E Global Teardown completed successfully\n");
  } catch (error) {
    console.error("❌ Error during global teardown:", error);
    // Nie rzucamy błędu, żeby nie blokować raportów testowych
  } finally {
    // Usuń .env.local utworzony podczas testów E2E
    const envLocalPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envLocalPath)) {
      fs.unlinkSync(envLocalPath);
      console.log("🧹 Cleaned up .env.local");
    }
  }
}

export default globalTeardown;
