import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import Layout from './components/Layout';
import Home from './pages/Home';
import PlatinumWindow from './pages/PlatinumWindow';
import ProgressionArbiter from './pages/ProgressionArbiter';
import About from './pages/About';
import PaeOncApp from './features/pae-onc/App';
import ZetaCore from './pages/ZetaCore';
import ResearchIntelligence from './pages/ResearchIntelligence';
import MobileBlocker from './components/MobileBlocker';

export default function App() {
  return (
    <ThemeProvider>
      <MobileBlocker />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/platinum-window" element={<PlatinumWindow />} />
            <Route path="/progression-arbiter" element={<ProgressionArbiter />} />
            <Route path="/about" element={<About />} />
            <Route path="/pae-onc/*" element={<PaeOncApp />} />
            <Route path="/zeta-core" element={<ZetaCore />} />
            <Route path="/research-intelligence" element={<ResearchIntelligence />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
