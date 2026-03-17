import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import Layout from './components/Layout';
import Home from './pages/Home';
import PlatinumWindow from './pages/PlatinumWindow';
import About from './pages/About';
import VariantTriagePage from './pages/VariantTriagePage';
import TriageResultsPage from './pages/TriageResultsPage';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/platinum-window" element={<PlatinumWindow />} />
            <Route path="/variant-triage" element={<VariantTriagePage />} />
            <Route path="/variant-triage/results" element={<TriageResultsPage />} />
            <Route path="/about" element={<About />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
