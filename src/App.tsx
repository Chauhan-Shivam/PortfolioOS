import React from 'react';
import { Analytics } from "@vercel/analytics/react";
import Desktop from './components/Desktop';

const App: React.FC = () => {
  return (
    <>
      <Desktop />
      <Analytics />
    </>
  );
};

export default App;