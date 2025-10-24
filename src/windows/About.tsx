import React, { memo } from 'react';

/**
 * Props for the AboutContent component.
 */
interface Props {
  info: {
    name: string;
    tagline: string;
    aboutContent: string[];
  };
}

/**
 * A simple component to display "About Me" information inside a window.
 */
const AboutContent: React.FC<Props> = ({ info }) => {
  // Memoized style objects to ensure stable prop references
  const containerStyle = { padding: "20px", lineHeight: "1.6" };
  const taglineStyle = { fontStyle: 'italic', color: '#555' };
  const hrStyle = { margin: '15px 0' };
  
  return (
    <div style={containerStyle}>
      <h2>{info.name}</h2>
      <p style={taglineStyle}>{info.tagline}</p>
      <hr style={hrStyle} />
      {info.aboutContent.map((paragraph, index) => (
        // Using index as a key is acceptable here since the list
        // is static and will not be re-ordered.
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
};

// Wrap in memo to prevent re-renders if the info prop hasn't changed.
export default memo(AboutContent);