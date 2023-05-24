import { useRef, useEffect } from 'react';
import Model from './model';

const Keli = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<Model | null>(null);

  useEffect(() => {
    instanceRef.current = new Model({ wrap: containerRef.current });
    return () => {
      instanceRef.current?.destroy();
    };
  }, []);

  return <div ref={containerRef} />;
};

export default Keli;
