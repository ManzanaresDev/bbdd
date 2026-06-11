import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // proxy.ts — remplace getUser() par getSession()
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;
  const { pathname } = request.nextUrl;

  // console.log("=== PROXY DEBUG ===");
  // console.log("pathname:", pathname);
  // console.log(
  //   "cookies:",
  //   request.cookies.getAll().map((c) => c.name),
  // );
  // console.log("session:", session ? "OUI" : "NON");

  if (pathname.startsWith("/auth/callback")) {
    return supabaseResponse;
  }

  if (pathname.startsWith("/auth")) {
    if (user) return NextResponse.redirect(new URL("/dashboard", request.url));
    return supabaseResponse;
  }

  if (!user && pathname !== "/") {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(user ? "/dashboard" : "/auth/login", request.url),
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
