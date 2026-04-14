import { signIn } from "@/lib/auth";

export default function LandingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="max-w-md w-full p-8 text-center space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-[#0B1E40] tracking-tight">Osteon</h1>
          <p className="text-lg text-slate-500 mt-2">Secure Medical Test Portal</p>
        </div>

        {searchParams?.error === "not_authorized" && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm text-left">
            Your email is not registered in our system. Please contact your administrator.
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0B1E40] hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B1E40] transition-colors"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
