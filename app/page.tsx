import { redirect } from 'next/navigation';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import DestinationsSection from './components/DestinationsSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorks from './components/HowItWorks';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import { getSession } from '@/lib/session';

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <DestinationsSection />
        <FeaturesSection />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
