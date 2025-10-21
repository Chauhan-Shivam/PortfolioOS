import React from 'react';

// Define an interface for the props the component will receive
interface Props {
  info: {
    email: string;
    linkedin: string;
    github: string;
  };
}

const ContactContent: React.FC<Props> = ({ info }) => {
  return (
    <div style={{ padding: "20px", lineHeight: "1.8" }}>
      <h2>Get In Touch</h2>
      <p>You can reach me via the following channels:</p>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
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

export default ContactContent;