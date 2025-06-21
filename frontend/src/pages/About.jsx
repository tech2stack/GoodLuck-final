import React from "react";
import styled from "styled-components";
import aboutImage from "../assets/3.png"; // Use your actual image here
import background from '../assets/bg.jpg';

// Import the LazyImage component
import LazyImage from '../components/LazyImage'; 

const PageWrapper = styled.div`
  min-height: 100vh;
  /*
    This background image is loaded via CSS (styled-components).
    It will be implicitly lazy-loaded because the About component itself
    is lazy-loaded via React.lazy() in App.js.
  */
  background: url(${aboutImage}) center/cover no-repeat fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

// Dark overlay for better text readability
const Overlay = styled.div`
  background-color: rgba(0, 0, 0, 0.6);
  min-height: 100vh;
  width: 100%;
  padding: 60px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

// Main content container with glass effect
const ContentContainer = styled.div`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
  width: 75%;
  max-width: 900px;
  display: flex;
  gap: 40px;
  padding: 40px;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 90%;
    padding: 20px;
    gap: 25px;
  }
`;

const LeftSide = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;

  /*
    The img tag inside LeftSide will now be handled by LazyImage,
    so its specific styling for max-width, height, box-shadow
    will be applied to the LazyImage's internal <img> tag.
  */
  img {
    border-radius: 16px;
    max-width: 100%;
    height: auto;
    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
  }
`;

const RightSide = styled.div`
  flex: 1;
  color: #f0f0f0;
  font-family: 'Segoe UI', sans-serif;

  h2 {
    font-size: 36px;
    margin-bottom: 20px;
    text-shadow: 2px 2px 8px rgba(0, 255, 170, 0.8);
  }

  p {
    font-size: 18px;
    line-height: 1.6;
    margin-bottom: 30px;
    color: #ddd;
  }

  h3 {
    font-size: 24px;
    margin-bottom: 15px;
    color: #4caf50;
  }

  ul {
    list-style: none;
    padding-left: 0;

    li {
      font-size: 18px;
      margin-bottom: 12px;
      padding-left: 24px;
      position: relative;
      color: #c8facc;

      &::before {
        content: "✔";
        position: absolute;
        left: 0;
        color: #4caf50;
      }
    }
  }
`;

const About = () => {
  const paragraph =
    "Welcome to Goodluck Book Store! We are dedicated to providing a wide range of books across genres with excellent customer service.";

  const whyChooseUs = [
    "Wide variety of books",
    "Affordable prices",
    "Experienced staff",
    "Custom orders available",
    "Fast delivery",
    "Trusted by thousands",
  ];

  return (
    <PageWrapper>
      <Overlay>
        <ContentContainer>
          <LeftSide>
            {/* Changed <img> to <LazyImage> for the image inside LeftSide */}
            <LazyImage src={background} alt="About Goodluck Bookstore" />
          </LeftSide>
          <RightSide>
            <h2>About Us</h2>
            <p>{paragraph}</p>
            <h3>Why Choose Us?</h3>
            <ul>
              {whyChooseUs.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </RightSide>
        </ContentContainer>
      </Overlay>
    </PageWrapper>
  );
};

export default About;