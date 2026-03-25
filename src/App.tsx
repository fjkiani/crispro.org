import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import Layout from './components/Layout';
import Home from './pages/Home';
import PlatinumWindow from './pages/PlatinumWindow';
import ProgressionArbiter from './pages/ProgressionArbiter';
import About from './pages/About';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/platinum-window" element={<PlatinumWindow />} />
            <Route path="/progression-arbiter" element={<ProgressionArbiter />} />
            <Route path="/about" element={<About />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
