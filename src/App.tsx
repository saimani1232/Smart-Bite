import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { InventoryProvider } from './context/InventoryContext';

function App() {
  return (
    <InventoryProvider>
      <Layout>
        <Dashboard />
      </Layout>
    </InventoryProvider>
  );
}

export default App;
