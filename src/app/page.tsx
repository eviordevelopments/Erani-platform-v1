import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <main className="min-h-screen relative">
      <Navigation />
      <Hero />
      
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none -z-50 opacity-10">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-blue/5 to-background" />
      </div>
    </main>
  );
}
