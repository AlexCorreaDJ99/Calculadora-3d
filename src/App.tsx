import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Component, ReactNode } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Calculator from './pages/Calculator';
import Pieces from './pages/Pieces';
import Kits from './pages/Kits';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
          <div className="bg-white rounded-xl border border-surface-200 p-6 max-w-md text-center">
            <h1 className="text-lg font-bold text-surface-900 mb-2">Erro na aplicação</h1>
            <p className="text-sm text-surface-600 mb-4">
              {this.state.error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
