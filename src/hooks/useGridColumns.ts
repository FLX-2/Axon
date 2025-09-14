import { useState, useEffect } from 'react';

export const useGridColumns = () => {
  const [columns, setColumns] = useState(5);

  useEffect(() => {
    const calculateColumns = () => {
      if (window.innerWidth < 640) {
        setColumns(2);
      } else if (window.innerWidth < 1024) {
        setColumns(3);
      } else if (window.innerWidth < 1280) {
        setColumns(4);
      } else {
        setColumns(5);
      }
    };

    calculateColumns();
    window.addEventListener('resize', calculateColumns);

    return () => window.removeEventListener('resize', calculateColumns);
  }, []);

  return columns;
};