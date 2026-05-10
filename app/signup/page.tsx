import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignupForm } from "@/app/signup/signup-form";

export default async function SignupPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-12">
      <section className="w-full max-w-lg rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Create account</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Start building your personalized trips with Traveloop.
        </p>

        <div className="mt-6">
          <SignupForm />
        </div>
      </section>
    </main>
  );
}
