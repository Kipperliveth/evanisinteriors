import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { BsArrowRight, BsArrowUpRight } from "react-icons/bs";
import "aos/dist/aos.css";
import AOS from "aos";

// --- Replace these with your actual high-res portfolio images ---
import heroImg from "../stock/table.jpg"; 
import aboutImg from "../stock/table.jpg"; // For the "Who We Are" section
import processImg from "../stock/table.jpg"; // For the "How We Work" section
import qualityImg from "../stock/table.jpg"; // For the wide bento box image

function About() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    document.title = "Interiors Studio - Evanis";

    if (!hasMounted) {
      setHasMounted(true);
      AOS.init({ delay: 100, once: true });
    } else {
      AOS.refresh();
    }
    window.scrollTo(0, 0);
  }, [hasMounted]);

  if (!hasMounted) return null;

  return (
    <div className="interiors-page-wrapper">
      
      {/* =========================================
          1. IMMERSIVE HERO (Matched to Contact Page)
          ========================================= */}
     <section className="interiors-immersive-hero" style={{ backgroundImage: `url(${heroImg})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content" data-aos="fade" data-aos-duration="1000">
          
          {/* Change the title here */}
          <h1>The Studio</h1> 
          
          <div className="hero-breadcrumb">
            {/* Change the breadcrumb text here */}
            <NavLink to="/">Home</NavLink> <span>&gt;</span> <span>The Studio</span>
          </div>
          
        </div>
      </section>

      {/* =========================================
          2. WHO WE ARE - BENTO SPLIT
          ========================================= */}
      <section className="who-we-are-section">
        <div className="who-we-are-inner">
          
     {/* Left Stats Box */}
          <div className="stats-box" data-aos="fade" data-aos-duration="1000">
            <div className="stat-item">
              <h3>3+</h3>
              <p>Years of design<br/>excellence</p>
            </div>
            <div className="stat-item">
              <h3>1000+</h3>
              <p>Homes & businesses<br/>trust us</p>
            </div>
            <div className="stat-item">
              <h3>100%</h3>
              <p>Custom, bespoke<br/>& truly yours</p>
            </div>
          </div>

          {/* Right Info Box */}
          <div className="info-box" data-aos="fade" data-aos-duration="1000" data-aos-delay="200">
            <div className="info-text">
              <h2>Who <span className="highlight">We Are</span></h2>
              <p>At Evanis, we understand the challenges of creating exceptional spaces that perfectly blend elegance, quality, and functionality.</p>
              <p>As a premier furniture and interior solutions provider, we've made it our mission to simplify the furnishing process, ensuring that every project is executed flawlessly from initial consultation to final installation.</p>
            </div>
            <div className="info-img">
              <img src={aboutImg} alt="Evanis Design Team" />
            </div>
          </div>

        </div>
      </section>

      {/* =========================================
          3. HOW WE WORK / PROCESS 
          ========================================= */}
      <section className="how-we-work-section bg-warm-light">
        <div className="work-header" data-aos="fade">
          <h2>How We <span className="highlight">Simplify</span> Your<br/>Furnishing Experience</h2>
        </div>

        <div className="work-split-container">
          
          {/* Left: Numbered Steps */}
          <div className="work-steps">
            <div className="step-card" data-aos="fade" data-aos-duration="800">
              <span className="step-num">1</span>
              <h3>Consultation & Spatial Planning</h3>
              <p>We begin by understanding your vision, lifestyle, and spatial constraints. Our team maps out precise layouts to optimize flow and functionality.</p>
            </div>

            <div className="step-card" data-aos="fade" data-aos-duration="800">
              <span className="step-num">2</span>
              <h3>Bespoke Curation</h3>
              <p>We source and design custom furniture pieces, selecting premium fabrics and materials that align with your unique aesthetic and structural needs.</p>
            </div>

            <div className="step-card" data-aos="fade" data-aos-duration="800">
              <span className="step-num">3</span>
              <h3>White-Glove Installation</h3>
              <p>Our commitment extends to the final reveal. We manage the entire delivery and installation process, ensuring every piece sits perfectly in your space.</p>
            </div>
          </div>

          {/* Right: Sticky Image */}
          <div className="work-visual" data-aos="fade" data-aos-duration="1000" data-aos-delay="200">
            <div className="sticky-img-wrapper">
              <img src={processImg} alt="Evanis Interior Process" />
            </div>
          </div>

        </div>
      </section>

      {/* =========================================
          4. WHY CHOOSE EVANIS - BENTO GRID 
          ========================================= */}
      <section className="why-choose-section">
        <div className="choose-header" data-aos="fade">
          <h2>Why <span className="highlight">Choose</span> Evanis</h2>
        </div>

        <div className="choose-bento-grid">
          
          {/* Top Left: End-to-End */}
          <div className="bento-card light-card card-end" data-aos="fade" data-aos-duration="800">
            <h4>End-to-End Solutions</h4>
            <p>We manage every aspect of your furnishing project, saving you time and valuable resources.</p>
          </div>

          {/* Top Middle: After-Sales */}
          <div className="bento-card light-card card-support" data-aos="fade" data-aos-duration="800" data-aos-delay="100">
            <h4>After-Sales Support</h4>
            <p>We are committed to providing ongoing support and maintenance to address any future needs.</p>
          </div>

          {/* Right Tall: Bespoke Furniture */}
          <div className="bento-card dark-card card-bespoke" data-aos="fade" data-aos-duration="800" data-aos-delay="200">
            <div className="card-content">
              <h4>Limitless Customization</h4>
              <p>We don't believe in variety restrictions. We specialize in sourcing and fabricating custom-made furniture pieces that perfectly match your unique vision, lifestyle, and architectural requirements.</p>
            </div>
          </div>

          {/* Bottom Wide: Superior Quality */}
          <div className="bento-card img-card card-quality" data-aos="fade" data-aos-duration="800" data-aos-delay="300" style={{ backgroundImage: `url(${qualityImg})` }}>
            <div className="card-overlay"></div>
            <div className="card-content">
              <h4>Superior Quality</h4>
              <p>Our partnerships with the best suppliers and craftsmen grant us access to the finest materials and rigorous quality control processes.</p>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================
          5. BOLD CALL TO ACTION
          ========================================= */}
      <section className="interiors-final-cta">
        <div className="cta-content" data-aos="fade" data-aos-duration="1000">
          <h2>Ready to transform<br/>your space?</h2>
          <p>Book a consultation at our Lagos studio or schedule a virtual review for your project.</p>
          <NavLink to="/contact" className="cta-button">
            Get Started <BsArrowUpRight className="icon" />
          </NavLink>
        </div>
      </section>

    </div>
  );
}

export default About;