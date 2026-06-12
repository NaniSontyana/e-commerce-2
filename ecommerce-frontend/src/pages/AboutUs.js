// src/pages/AboutUs.js
import { useState } from 'react';
import '../styles/AboutUs.css';

// Placeholder for live chat integration (e.g., using a third-party service like Tawk.to or a custom solution)
const LiveChatWidget = () => {
  return (
    <div className="live-chat-widget">
      <h3>Need Help? Chat with Us!</h3>
      <p>Our team is online to assist you. Click below to start a live chat.</p>
      <button className="chat-btn">Start Chat</button>
      {/* In a real implementation, embed a live chat service like Tawk.to here */}
    </div>
  );
};

function AboutUs() {
  const [currentTeamMember, setCurrentTeamMember] = useState(0);

  const teamMembers = [
    {
      name: "Alex Nova",
      role: "Founder & CEO",
      bio: "Alex has over 10 years of experience in e-commerce and a passion for space exploration.",
      image: "https://via.placeholder.com/150", // Replace with actual image URL
    },
    {
      name: "Luna Star",
      role: "Head of Customer Support",
      bio: "Luna ensures every customer has a stellar experience with Cosmic Commerce.",
      image: "https://via.placeholder.com/150", // Replace with actual image URL
    },
    {
      name: "Orion Blaze",
      role: "Chief Product Officer",
      bio: "Orion curates the best products from across the galaxy for our customers.",
      image: "https://via.placeholder.com/150", // Replace with actual image URL
    },
  ];

  const handlePrevTeamMember = () => {
    setCurrentTeamMember((prev) => (prev === 0 ? teamMembers.length - 1 : prev - 1));
  };

  const handleNextTeamMember = () => {
    setCurrentTeamMember((prev) => (prev === teamMembers.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="aboutus-container">
      <div className="aboutus-scrollable">
        <div className="aboutus-content">
          <h1 className="aboutus-title">About Cosmic Commerce</h1>

          {/* Company Overview */}
          <div className="aboutus-card">
            <h2>Our Story</h2>
            <p>
              Founded in 2023, <strong>Cosmic Commerce</strong> was born from a vision to bring the wonders of the universe to your doorstep. We specialize in curating high-quality products from across the galaxy, offering everything from cutting-edge tech gadgets to stellar fashion pieces. Our mission is to provide an out-of-this-world shopping experience with exceptional customer service, fast shipping, and a seamless user experience.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="aboutus-card">
            <h2>Our Mission</h2>
            <p>
              To connect customers with the best products in the universe, fostering a community of explorers and innovators. We aim to make shopping a cosmic adventure, ensuring every customer feels valued and supported.
            </p>
          </div>

          {/* Team Section with Carousel */}
          <div className="aboutus-card">
            <h2>Meet Our Team</h2>
            <div className="team-carousel">
              <button className="carousel-btn prev" onClick={handlePrevTeamMember}>
                ◄
              </button>
              <div className="team-member">
                <img src={teamMembers[currentTeamMember].image} alt={teamMembers[currentTeamMember].name} />
                <h3>{teamMembers[currentTeamMember].name}</h3>
                <p className="team-role">{teamMembers[currentTeamMember].role}</p>
                <p>{teamMembers[currentTeamMember].bio}</p>
              </div>
              <button className="carousel-btn next" onClick={handleNextTeamMember}>
                ►
              </button>
            </div>
          </div>

          {/* Milestones */}
          <div className="aboutus-card">
            <h2>Our Milestones</h2>
            <ul className="milestone-list">
              <li><strong>2023:</strong> Cosmic Commerce was founded.</li>
              <li><strong>2024:</strong> Reached 10,000 happy customers.</li>
              <li><strong>2025:</strong> Expanded our product range to include interstellar tech gadgets.</li>
            </ul>
          </div>

          {/* Live Chat Widget */}
          <div className="aboutus-card">
            <LiveChatWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutUs;