import React, { memo, useMemo } from 'react';

/**
 * Props for the ContactContent component.
 */
interface Props {
  info: {
    email: string;
    linkedin: string;
    github: string;
  };
}

/**
 * A simple component to display contact information inside a window.
 */
const ContactContent: React.FC<Props> = ({ info }) => {
  // Memoized style objects to ensure stable prop references
  const containerStyle = { padding: "20px", lineHeight: "1.8" };
  const listStyle = { listStyle: 'none', padding: 0, marginTop: '10px' };

  return (
    <div style={containerStyle}>
      <h2>Get In Touch</h2>
      <p>You can reach me via the following channels:</p>
      <ul style={listStyle}>
        <li>
          <strong>Email:</strong> {info.email}
        </li>
        <li>
          <strong>LinkedIn:</strong> {info.linkedin}
        </li>
        <li>
          <strong>GitHub:</strong> {info.github}
        </li>
      </ul>
    </div>
  );
};

// Wrap in memo to prevent re-renders if the info prop hasn't changed.
export default memo(ContactContent);