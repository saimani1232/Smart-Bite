import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Recipes } from './pages/Recipes';
import { InventoryProvider } from './context/InventoryContext';
import { ThemeProvider } from './context/ThemeContext';

export type PageType = 'home' | 'recipes' | 'analytics';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'recipes':
        return <Recipes onNavigateHome={() => setCurrentPage('home')} />;
      case 'analytics':
        return (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Analytics Coming Soon</h2>
              <p className="text-gray-500 dark:text-gray-400">Track your food waste and savings over time.</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <InventoryProvider>
        <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
          {renderPage()}
        </Layout>
      </InventoryProvider>
    </ThemeProvider>
  );
}

export default App;
