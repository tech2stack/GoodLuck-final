// Career.js
import React from 'react';
import '../styles/Career.css';
import background from '../assets/3.png';
import hiringBanner from '../assets/Hiring-banner.webp';
import LazyImage from '../components/LazyImage';

const Career = () => {
  const openings = [
    {
      title: '📚 Store Clerk',
      description: 'Assist customers, organize shelves, and maintain a welcoming book environment. Good communication skills preferred.',
    },
    {
      title: '📦 Inventory Manager',
      description: 'Track stock levels, manage book deliveries, and handle supplier coordination. Prior inventory experience a plus.',
    },
    {
      title: '💳 Cashier',
      description: 'Handle daily billing, POS entries, and customer checkout with efficiency and a smile.',
    },
    {
      title: '📢 Marketing Executive',
      description: 'Promote new arrivals, events, and seasonal offers via social media and local advertising.',
    },
    {
      title: '🚚 Delivery Associate',
      description: 'Ensure prompt delivery of online or phone orders within city limits. Must have own bike.',
    },
  ];

  const createMailToLink = (jobTitle) => {
    const subject = encodeURIComponent(`Job Application for ${jobTitle}`);
    const body = encodeURIComponent(`Hi,\n\nI'm interested in the ${jobTitle} position at Good Luck Book Store. Please find my resume attached.\n\nThanks,\n[Your Name]`);
    return `mailto:glbsbhopal@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="career-page" style={{ backgroundImage: `url(${background})` }}>
      <div className="career-overlay">
        <section className="career-container">
          <LazyImage className="banner-image" src={hiringBanner} alt="We're Hiring Banner" />
          <header className="career-header">
            <h2>We're Hiring at Good Luck Book Store</h2>
            <p>Join a team that’s passionate about books and building a strong reading community across India.</p>
          </header>
          <div className="job-list">
            {openings.map((job, idx) => (
              <article className="job-card" key={idx}>
                <div className="job-info">
                  <strong>{job.title}</strong>
                  <p>{job.description}</p>
                  <a href={createMailToLink(job.title)} rel="noopener noreferrer">
                    <button type="button">Apply Now</button>
                  </a>
                </div>
              </article>
            ))}
          </div>
          <p className="footer-note">
            Don’t see a role that fits?{' '}
            <a
              href="mailto:glbsbhopal@gmail.com?subject=General%20Job%20Inquiry&body=Hi%2C%20I%27m%20interested%20in%20working%20with%20Good%20Luck%20Book%20Store.%20Please%20find%20my%20resume%20attached."
              rel="noopener noreferrer"
            >
              Email us your resume
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Career;
