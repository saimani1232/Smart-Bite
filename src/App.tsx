import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { InventoryProvider } from './context/InventoryContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <InventoryProvider>
        <Layout>
          <Dashboard />
        </Layout>
      </InventoryProvider>
    </ThemeProvider>
  );
}

export default App;
