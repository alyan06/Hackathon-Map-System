import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
      <div className="max-w-2xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
        <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">
          GreenScore MVP
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Car Travel Carbon Tracker
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          This is a focused demo shell for the car travel feature. Open the tracker
          route below to add a vehicle, calculate a trip with Google Maps, and save
          the estimated CO2 output.
        </p>
        <Link
          className="mt-8 inline-flex rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          href="/car-travel"
        >
          Open Car Travel Tracker
        </Link>
      </div>
    </main>
  )
}
