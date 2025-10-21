import React from 'react';

// Define an interface for the props the component will receive
interface Props {
  info: {
    name: string;
    tagline: string;
    aboutContent: string[];
  };
}

const AboutContent: React.FC<Props> = ({ info }) => {
  return (
    <div style={{ padding: "20px", lineHeight: "1.6" }}>
      <h2>{info.name}</h2>
      <p style={{ fontStyle: 'italic', color: '#555' }}>{info.tagline}</p>
      <hr style={{ margin: '15px 0' }} />
      {info.aboutContent.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
};

export default AboutContent;