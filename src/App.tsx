import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Calculator from './pages/Calculator';
import Pieces from './pages/Pieces';
import Kits from './pages/Kits';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/pieces" element={<Pieces />} />
          <Route path="/kits" element={<Kits />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
