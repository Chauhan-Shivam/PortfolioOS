import React, { memo } from 'react';

// Memoized style object.
const containerStyle = { padding: "20px" };

/**
 * A static placeholder component for the "Games" window.
 */
const GamesContent: React.FC = () => (
  <div style={containerStyle}>
    <h2>Games</h2>
    <p>Coming soon...</p>
  </div>
);

// Wrap in memo. As this component has no props, it will
// render exactly once and never re-render.
export default memo(GamesContent);