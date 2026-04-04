import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "vb_session";

// If already logged in, skip the login page
async function checkSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  return session === process.env.SESSION_SECRET;
}

async function login(formData: FormData) {
  "use server";
  const password = formData.get("password") as string;
  const from = formData.get("from") as string || "/admin";

  if (password !== process.env.ADMIN_PASSWORD) {
    redirect(`/login?error=1&from=${encodeURIComponent(from)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, process.env.SESSION_SECRET!, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect(from);
}

type Props = { searchParams: Promise<{ error?: string; from?: string }> };

export default async function LoginPage(props: Props) {
  const searchParams = await props.searchParams;
  const from = searchParams.from || "/admin";

  if (await checkSession()) redirect(from);
  const hasError = !!searchParams.error;

  return (
    <div className="min-h-screen w-screen bg-[var(--bg-color)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent-teal)] to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--accent-teal)]/20">
            <span className="text-black text-3xl font-bold">V</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Vigilboard</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Sign in to continue</p>
          </div>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form action={login} className="flex flex-col gap-5">
            <input type="hidden" name="from" value={from} />

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoFocus
                autoComplete="current-password"
                className={`input ${hasError ? 'border-red-500/60 focus:border-red-500' : ''}`}
                placeholder="Enter admin password"
              />
              {hasError && (
                <p className="text-sm text-red-400">Incorrect password. Try again.</p>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-full py-3 text-base font-semibold mt-1">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
