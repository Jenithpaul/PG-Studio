import { Hero } from './components/Hero.tsx';
import { FeatureSection } from './components/FeatureSection.tsx';
import { Contribution } from './components/Contribution.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import './index.css';

function App() {
  return (
    <div className="app">
      <Navbar />
      <main>
        <Hero />
        <FeatureSection />
        <Contribution />
      </main>
      <Footer />
    </div>
  );
}

export default App;
