import Image from "next/image";

const highlights = [
  "Plan campaigns and keep every project on track",
  "Create polished content with your AI copilot",
  "Manage your team's work from one shared space",
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-[#f7faf9] dark:bg-background lg:grid lg:grid-cols-[minmax(380px,0.92fr)_1.08fr]">
      <aside className="relative hidden min-h-svh overflow-hidden bg-gradient-to-br from-[#13a39c] via-[#087d79] to-[#064b4b] px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-36 -top-32 size-[34rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-56 -left-36 size-[32rem] rounded-full border border-white/10"
        />
        <div className="relative flex items-center gap-3">
          <Image
            src="/icon.svg"
            alt=""
            width={44}
            height={44}
            className="rounded-xl"
            priority
          />
          <span className="text-lg font-semibold tracking-tight">
            Smart Content
            <span className="block text-xs font-normal tracking-wide text-white/70">
              Campaign Manager
            </span>
          </span>
        </div>

        <div className="relative my-auto max-w-xl py-16">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-white/70">
            Create. Organize. Grow.
          </p>
          <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Everything your team needs to move great ideas forward.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/75 xl:text-lg">
            Bring your campaigns, AI-powered content, and team workflow
            together in one clear, collaborative workspace.
          </p>
          <ul className="mt-9 space-y-5">
            {highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-white/60" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/55">
          © 2026 Smart Content Manager. All rights reserved.
        </p>
      </aside>

      <div className="flex min-h-svh flex-col">
        <header className="flex items-center gap-3 px-5 pt-6 sm:px-8 lg:hidden">
          <Image
            src="/icon.svg"
            alt=""
            width={38}
            height={38}
            className="rounded-lg"
            priority
          />
          <span className="text-sm font-semibold tracking-tight">
            Smart Content
            <span className="block text-xs font-normal text-muted-foreground">
              Campaign Manager
            </span>
          </span>
        </header>
        <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-[440px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
