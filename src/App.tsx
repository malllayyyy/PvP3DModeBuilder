import { Workspace } from './components/Workspace';
import { UIOverlay } from './components/UIOverlay';
import { useGameNetwork } from './hooks/useGameNetwork';
import './index.css';

function App() {
  useGameNetwork();

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <UIOverlay />
      <Workspace />
    </div>
  );
}

export default App;
