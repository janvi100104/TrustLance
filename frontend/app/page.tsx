import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { WalletButton } from '@/components/wallet/WalletButton';
import {
  ArrowRight,
  CirclePlay,
  ClipboardCheck,
  Coins,
  HandCoins,
  Link2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Star,
  WalletCards,
} from 'lucide-react';

const HERO_IMAGE_SRC = '/landing/hero-trustlance-v2.png';
const STEPS_IMAGE_SRC = '/landing/steps-trustlance-v2.png';

const navLinks = [
  'Home',
  'How It Works',
  'Post a Project',
  'Browse Talent',
  'Pricing',
  'Login',
] as const;

const trustStats = [
  { value: '10k+', label: 'Verified Projects' },
  { value: '50k+', label: 'Freelancers' },
  { value: '99.8%', label: 'Client Satisfaction' },
] as const;

const reasons: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: 'Secure Escrow Locker',
    description: 'Client funds stay locked in a secure smart contract before work starts.',
    icon: Link2,
  },
  {
    title: 'Transparent Milestones',
    description: 'Work is submitted and approved via clearly defined project milestones.',
    icon: ClipboardCheck,
  },
  {
    title: 'Instant Payouts on Approval',
    description: "Funds are instantly released to the freelancer's wallet on client approval.",
    icon: WalletCards,
  },
];

const guaranteeSteps = [
  'Create Profile & Verify.',
  'Post or Apply for Project.',
  'Define & Complete Milestones.',
  'Work Approved & Paid.',
] as const;

const stepStats = [
  { value: '160+', label: 'Avg. Transaction Speed' },
  { value: '500+', label: 'Escrowed Contracts' },
  { value: '24 Lakh', label: 'Secure Funds' },
  { value: '12K', label: 'Funds' },
] as const;

const categories: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: 'Blockchain Development',
    description: 'Build secure smart contract systems with verified milestone rails.',
    icon: Link2,
  },
  {
    title: 'FinTech Design',
    description: 'Design frictionless finance products with trust-first user journeys.',
    icon: WalletCards,
  },
  {
    title: 'Secure Data Analysis',
    description: 'Deliver data insights with encrypted workflows and transparent payouts.',
    icon: ShieldCheck,
  },
];

const landingStyles = `
.tl-shell {
  --tl-cream: #f7f1e4;
  --tl-gold: #f5c14f;
  background:
    radial-gradient(95% 120% at 10% 0%, rgba(73, 139, 123, 0.3) 0%, rgba(73, 139, 123, 0) 55%),
    radial-gradient(80% 120% at 100% 15%, rgba(27, 82, 74, 0.35) 0%, rgba(27, 82, 74, 0) 65%),
    linear-gradient(135deg, #2d7f71 0%, #184f47 60%, #103d38 100%);
}

.tl-hero-surface {
  background:
    radial-gradient(90% 95% at 0% 0%, rgba(113, 191, 169, 0.18) 0%, rgba(113, 191, 169, 0) 65%),
    radial-gradient(80% 100% at 100% 0%, rgba(99, 178, 158, 0.14) 0%, rgba(99, 178, 158, 0) 62%),
    linear-gradient(135deg, #134f48 0%, #0d3e39 55%, #0a3430 100%);
}

.tl-fade-in {
  animation: tlFadeIn 700ms ease both;
}

.tl-float {
  animation: tlFloat 5.5s ease-in-out infinite;
}

.tl-float-delay {
  animation-delay: 1.2s;
}

@keyframes tlFadeIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tlFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}
`;

function TopNav() {
  return (
    <div className="flex items-center justify-between gap-4 text-white/90">
      <div className="flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-300/15 ring-1 ring-emerald-100/30">
          <ShieldCheck className="h-4 w-4 text-emerald-100" />
        </div>
        <span className="text-lg font-semibold tracking-tight">TrustLance</span>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        {navLinks.map((link) => (
          <Link
            key={link}
            href="#"
            className="text-xs font-medium text-emerald-50/85 transition-colors hover:text-emerald-50"
          >
            {link}
          </Link>
        ))}
      </div>

      <WalletButton variant="nav" />
    </div>
  );
}

function HeroActions() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/45 px-4 py-2 text-sm font-medium text-white shadow-[0_8px_20px_rgba(0,0,0,0.28)]"
      >
        <span className="text-base leading-none"></span>
        <span>App Store</span>
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium text-emerald-100 transition-colors hover:text-white"
      >
        <CirclePlay className="h-6 w-6 text-[var(--tl-gold)]" />
        Watch Demo
      </button>
    </div>
  );
}

function RatingRow() {
  return (
    <div className="flex items-center gap-1 text-[var(--tl-gold)]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className="h-4 w-4 fill-current" />
      ))}
    </div>
  );
}

function TrustStats() {
  return (
    <div className="grid grid-cols-3 gap-3 pt-4">
      {trustStats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center backdrop-blur-sm"
        >
          <p className="text-2xl font-semibold text-white sm:text-3xl">{stat.value}</p>
          <p className="mt-1 text-xs text-emerald-100/80">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

function HeroImageFrame() {
  return (
    <div className="relative mx-auto h-[340px] w-[255px] sm:h-[420px] sm:w-[320px]">
      <div className="tl-float absolute -left-5 top-10 rounded-full bg-amber-300/90 p-1.5 text-slate-900 shadow-lg">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="tl-float tl-float-delay absolute -right-3 top-24 rounded-full bg-amber-300/90 p-1.5 text-slate-900 shadow-lg">
        <Coins className="h-4 w-4" />
      </div>

      <div className="absolute inset-0 rounded-[2.4rem] border border-emerald-100/25 bg-gradient-to-b from-emerald-300/20 to-emerald-900/15" />
      <div className="absolute inset-x-6 top-6 h-2/5 rounded-full bg-emerald-300/20 blur-2xl" />

      <div className="absolute inset-3 overflow-hidden rounded-[2rem] border border-emerald-100/25 bg-gradient-to-b from-white/20 to-emerald-950/5">
        <Image
          src={HERO_IMAGE_SRC}
          alt="Smiling professional woman in green vest"
          fill
          priority
          className="object-cover object-[50%_22%] scale-[1.2] sm:scale-[1.26] drop-shadow-[0_16px_28px_rgba(0,0,0,0.3)]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b3732]/18 via-transparent to-[#0b3732]/8" />
      </div>
    </div>
  );
}

function StepsImageFrame() {
  return (
    <div className="relative mx-auto h-[340px] w-[255px] sm:h-[420px] sm:w-[320px]">
      <div className="absolute inset-0 rounded-[40%] border border-emerald-900/20 bg-gradient-to-b from-emerald-200/30 to-emerald-400/10" />
      <div className="absolute -right-3 top-3 rounded-full border border-amber-300/70 bg-amber-200/90 p-2 text-amber-950 shadow">
        <HandCoins className="h-5 w-5" />
      </div>
      <div className="absolute left-3 top-10 rounded-full border border-white/50 bg-white/80 p-1.5 text-emerald-900 shadow">
        <Star className="h-4 w-4 fill-emerald-900" />
      </div>

      <div className="absolute inset-3 overflow-hidden rounded-[45%] border border-emerald-900/15 bg-gradient-to-b from-[#f0dcc8] to-[#e6c7ad]">
        <Image
          src={STEPS_IMAGE_SRC}
          alt="Woman holding key and showing four fingers"
          fill
          className="object-cover object-[52%_20%] scale-[1.26] sm:scale-[1.34] drop-shadow-[0_16px_26px_rgba(0,0,0,0.22)]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#d4b48c]/16 via-transparent to-[#e4ccb0]/8" />
      </div>
    </div>
  );
}

function ReasonsSection() {
  return (
    <section className="space-y-5">
      <h2 className="text-center text-3xl font-semibold tracking-tight text-[#142f2b] sm:text-4xl">
        3 Reasons To Choose Us
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        {reasons.map((reason) => (
          <article
            key={reason.title}
            className="relative rounded-[1.65rem] border border-[#d2e1d8] bg-white p-5 shadow-[0_14px_28px_rgba(10,60,50,0.12)]"
          >
            <span className="absolute right-0 top-0 h-9 w-9 rounded-bl-2xl border-b-2 border-l-2 border-[#2d7167]/65" />
            <div className="mb-3 inline-flex rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-800">
              <reason.icon className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-[#163530]">{reason.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#355750]">{reason.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StepsSection() {
  return (
    <section className="space-y-8">
      <h2 className="text-center text-3xl font-semibold tracking-tight text-[#142f2b] sm:text-4xl">
        4 Simple Steps to Guaranteed Payment.
      </h2>

      <div className="grid gap-8 lg:grid-cols-[0.95fr_1fr_0.8fr]">
        <ol className="rounded-3xl border border-[#c9ddd3] bg-[#f9f5ea] px-5 py-4">
          {guaranteeSteps.map((step, index) => (
            <li key={step} className="flex gap-3 border-b border-emerald-900/15 py-3 last:border-b-0">
              <span className="text-xl font-semibold text-[#1f5f55]">{index + 1}.</span>
              <span className="text-xl font-semibold leading-tight text-[#183a34]">{step}</span>
            </li>
          ))}
        </ol>

        <div className="flex items-center justify-center rounded-[2.25rem] border border-[#c3d8ce] bg-gradient-to-b from-[#f2ecdd] via-[#ecf3ec] to-[#e8eee0] p-3">
          <StepsImageFrame />
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-[#c9ddd3] bg-[#f8f3e8] p-4 lg:grid-cols-1">
          {stepStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-emerald-900/10 bg-white/90 px-4 py-3 text-right shadow-sm">
              <p className="text-4xl font-semibold tracking-tight text-[#1f5f55]">{stat.value}</p>
              <p className="text-sm text-[#365f57]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCategories() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-emerald-900/20 bg-gradient-to-b from-[#0f4f49] to-[#0a3733] p-5 text-white shadow-[0_18px_36px_rgba(2,24,20,0.35)]">
      <h2 className="text-center text-3xl font-semibold tracking-tight">Featured Project Categories</h2>
      <div className="mt-5 grid gap-3">
        {categories.map((category) => (
          <article key={category.title} className="rounded-2xl border border-emerald-200/20 bg-emerald-950/45 p-4 backdrop-blur-sm">
            <div className="mb-2 inline-flex rounded-lg bg-emerald-200/15 p-2 text-emerald-100">
              <category.icon className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight">{category.title}</h3>
            <p className="mt-1 text-sm text-emerald-100/80">{category.description}</p>
            <Link href="#" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-100/95">
              Read More <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function FullRightStylePage() {
  return (
    <section className="min-h-screen bg-[var(--tl-cream)]">
      <div className="tl-hero-surface relative px-4 pb-6 pt-5 text-white sm:px-6">
        <div className="mx-auto max-w-[1160px]">
          <TopNav />

          <div className="mt-7 grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
            <div className="space-y-4">
              <RatingRow />
              <h1 className="max-w-[14ch] text-5xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Securing Freelancer Payments, Built on Trust.
              </h1>
              <p className="text-sm leading-relaxed text-emerald-50/88 sm:text-base">
                Funds are securely locked in a smart locker via Stellar blockchain, and freelancers get paid on
                milestone approval.
              </p>
              <HeroActions />
            </div>

            <div className="md:justify-self-end">
              <HeroImageFrame />
            </div>
          </div>

          <TrustStats />
        </div>
      </div>

      <div className="bg-[var(--tl-cream)] px-4 pb-10 pt-8 sm:px-6">
        <div className="mx-auto max-w-[1160px] space-y-10">
          <ReasonsSection />
          <StepsSection />
          <FeaturedCategories />
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="tl-shell min-h-screen text-[#14342f]">
      <style>{landingStyles}</style>

      <main className="w-full">
        <div className="tl-fade-in">
          <FullRightStylePage />
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-3 right-3 rounded-full border border-white/35 bg-white/20 p-2 text-white/80 backdrop-blur-sm">
        <LockKeyhole className="h-4 w-4" />
      </div>
    </div>
  );
}
