import React from 'react';
import '../styles/Footer.css'; // Ensure this path is correct

// Import social media icons from react-icons/fa (Font Awesome)
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content container"> {/* Added container for content width */}

        <div className="footer-column footer-about">
          <h3 className="footer-heading">Goodluck Book Store</h3>
          <p>Your one-stop destination for academic excellence and literary adventures. We offer a wide range of books and stationery to fuel your passion for learning.</p>
        </div>

        <div className="footer-column footer-links">
          <h3 className="footer-heading">Quick Links</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/career">Career</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/#benefits">Benefits</a></li>
            <li><a href="/#review">Reviews</a></li>

            {/* Add more links as your site grows */}
          </ul>
        </div>

        <div className="footer-column footer-contact">
          <h3 className="footer-heading">Contact Us</h3>
          <p>Shop No. 2, Shriji Tower, <br /> Near Manpreet Hotel, New Ashoka Garden, <br /> Bhopal, Madhya Pradesh 462023</p>
          <p><strong>Phone:</strong> +91 7024136476</p>
          <p><strong>Email:</strong> glbsbhopal@gmail.com</p>
          <p><strong>Hours:</strong> Mon - Sat: 10 AM - 9 PM</p>
        </div>

        <div className="footer-column footer-social">
          <h3 className="footer-heading">Follow Us</h3>
          <div className="social-icons">
            {/* Using React Icons components */}
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebookF /></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaYoutube /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedinIn /></a>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Goodluck Book Store. All rights reserved.</p>
        <p>Developed with ❤️ by <em><b>Tech2Stack</b></em></p>
      </div>
    </footer>
  );
};

export default Footer;