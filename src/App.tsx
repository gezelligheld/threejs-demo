import { useMemo, useRef, useEffect } from 'react';
import Model from './model';
import './App.css';

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const model = useMemo(() => new Model(), []);

  useEffect(() => {
    model.init({ wrap: containerRef.current });
  }, [model]);

  return <div ref={containerRef}></div>;
}

export default App;
