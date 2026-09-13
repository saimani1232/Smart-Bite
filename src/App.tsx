import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Recipes } from './pages/Recipes';
import { LoginPage } from './pages/LoginPage';
import { InventoryProvider } from './context/InventoryContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Insights } from './pages/Insights';

export type PageType = 'home' | 'recipes' | 'analytics';

// Main app content (protected)
function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [targetRecipeIngredient, setTargetRecipeIngredient] = useState<string | undefined>(undefined);
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading SmartBite...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleOpenRecipes = (ingredientOrId: string) => {
    setTargetRecipeIngredient(ingredientOrId);
    setCurrentPage('recipes');
  };

  const handleNavigate = (page: PageType) => {
    if (page !== 'recipes') {
      setTargetRecipeIngredient(undefined);
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'recipes':
        return (
          <Recipes
            onNavigateHome={() => handleNavigate('home')}
            initialIngredient={targetRecipeIngredient}
          />
        );
      case 'analytics':
        return (
          <Insights
            onNavigateToRecipes={() => handleNavigate('recipes')}
            onNavigateToPantry={() => handleNavigate('home')}
          />
        );
      default:
        return <Dashboard onOpenRecipes={handleOpenRecipes} />;
    }
  };

  return (
    <InventoryProvider>
      <Layout
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenRecipes={handleOpenRecipes}
      >
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
