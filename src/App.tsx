import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Recipes } from './pages/Recipes';
import { LoginPage } from './pages/LoginPage';
import { InventoryProvider } from './context/InventoryContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

export type PageType = 'home' | 'recipes' | 'analytics';

// Main app content (protected)
function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

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
    <InventoryProvider>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
    </InventoryProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
