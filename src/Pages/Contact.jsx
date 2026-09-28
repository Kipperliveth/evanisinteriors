import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FaInstagram, FaWhatsapp, FaArrowRight, FaPlus, FaMinus } from "react-icons/fa";
import { IoLogoTiktok } from "react-icons/io5";
import { BsArrowUpRight } from "react-icons/bs";
import "aos/dist/aos.css";
import AOS from "aos";

// Immersive Hero Background
import slide3 from "../stock/table.jpg"; 


function Contact() {
  const [hasMounted, setHasMounted] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    document.title = "Contact - Evanis Interiors";
    if (!hasMounted) {
      setHasMounted(true);
      AOS.init({ delay: 100, once: true });
    } else {
      AOS.refresh();
    }
    window.scrollTo(0, 0);
  }, [hasMounted]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      // Simulate API call
      setTimeout(() => {
        setIsSubscribed(true);
        setNewsletterEmail("");
      }, 500);
    }
  };

  // FAQ Data 
  const faqData = [
    {
      id: 1,
      question: "How to place an order?",
      answer: "Ordering is easy! Simply browse our collection, add items to your cart, and proceed to checkout. Follow the prompts to enter your shipping details and preferred payment method."
    },
    {
      id: 2,
      question: "Quality and sustainability of materials",
      answer: "We use high-quality, sustainable materials that are both stylish and comfortable. Our furniture is carefully selected for durability, and we use eco-friendly finishing processes whenever possible."
    },
    {
      id: 3,
      question: "What is your refund policy?",
      answer: "We want you to be delighted with your purchase. Check out our Return Policy for information on returns, exchanges, and how to initiate a return request."
    },
    {
      id: 4,
      question: "Do you offer custom designs or alterations?",
      answer: "Yes, we offer a variety of custom design and bespoke furniture services to help you create the perfect piece tailored to your exact spatial needs."
    },
    {
      id: 5,
      question: "Where do you deliver and install?",
      answer: "We currently offer delivery and professional white-glove installation across Lagos and Port Harcourt. For projects outside these regions, please contact our team to discuss logistics."
    }
  ];

  const toggleFaq = (id) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  if (!hasMounted) return null;

  return (
    <div className="contact-editorial-wrapper">
      
      {/* =========================================
          1. IMMERSIVE HERO 
          ========================================= */}
      <section className="contact-immersive-hero" style={{ backgroundImage: `url(${slide3})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content" data-aos="fade" data-aos-duration="1000">
          <h1>Contact</h1>
          <div className="hero-breadcrumb">
            <NavLink to="/">Home</NavLink> <span>&gt;</span> <span>Contact</span>
          </div>
        </div>
      </section>

      {/* =========================================
          2. CONTACT DETAILS GRID
          ========================================= */}
      <section className="contact-details-section">
        <div className="contact-details-inner">
          
          <div className="details-left" data-aos="fade" data-aos-duration="1000">
            <h2>Get in touch</h2>
            <p>Get in touch with us for any enquiries, bespoke furniture requests, and design consultations.</p>
            
            <div className="social-text-links">
              <a href="https://instagram.com/evanis_interiors" target="_blank" rel="noreferrer">
                Instagram (@evanis_interiors) <BsArrowUpRight className="arrow-icon"/>
              </a>
              <a href="https://instagram.com/evanisdesigns" target="_blank" rel="noreferrer">
                Instagram (@evanisdesigns) <BsArrowUpRight className="arrow-icon"/>
              </a>
              <a href="https://tiktok.com/@evanis_homes" target="_blank" rel="noreferrer">
                TikTok (@evanis_homes) <BsArrowUpRight className="arrow-icon"/>
              </a>
            </div>
          </div>

          <div className="details-right" data-aos="fade" data-aos-duration="1000" data-aos-delay="200">
            <div className="contact-grid-modern">
              
              <div className="grid-item">
                <p className="label">general inquiries</p>
                <a href="mailto:evanisinteriors@gmail.com" className="data-link">evanisinteriors@gmail.com</a>
                <p className="data-text">+234 703 806 5509</p>
              </div>

              <div className="grid-item">
                <p className="label">whatsapp chat</p>
                <a href="https://wa.me/2347038065509" target="_blank" rel="noreferrer" className="data-link flex-link">
                  Message our team <FaWhatsapp className="inline-icon"/>
                </a>
              </div>

              <div className="grid-item">
                <p className="label">studio address</p>
                <p className="data-text">38 Emmanuel Bus Stop,<br/>Akute/Ajuwon Road, Lagos</p>
              </div>

              <div className="grid-item">
                <p className="label">operating hours</p>
                <p className="data-text">Available 24/7<br/>For inquiries & support</p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================
          3. MAP & LOCATION SECTION 
          ========================================= */}
      <section className="map-location-section bg-warm-light">
        <div className="location-inner-grid">
          
          <div className="loc-text-col" data-aos="fade">
            <h2>Where to<br/>find us</h2>
            <p>Based in Lagos, the Evanis studio is a creative space where our designs come to life. We invite you to visit us to explore our curated collections, test the comfort of our bespoke furniture, and discuss your next interior project. We also actively service and deliver to projects across Port Harcourt.</p>
          </div>

          <div className="loc-map-col" data-aos="fade" data-aos-delay="200">
            <div className="map-wrapper">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3962.836021200192!2d3.3330!3d6.6660!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMzknNTcuNiJOIDPCsDE5JzU4LjgiRQ!5e0!3m2!1sen!2sng!4v1620000000000!5m2!1sen!2sng" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                title="Evanis Interiors Location"
              ></iframe>
            </div>
          </div>

          <div className="loc-details-col" data-aos="fade" data-aos-delay="400">
            <div className="detail-block">
              <h4>Address</h4>
              <p>38 Emmanuel Bus Stop,<br/>Akute/Ajuwon Road,<br/>Lagos, Nigeria.</p>
            </div>
            
            <div className="detail-block">
              <h4>Contact</h4>
              <p>+234 703 806 5509</p>
              <a href="mailto:evanisinteriors@gmail.com">evanisinteriors@gmail.com</a>
            </div>

            <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="directions-btn">
              Get Directions <BsArrowUpRight className="dir-icon"/>
            </a>
          </div>

        </div>
      </section>

      {/* =========================================
          4. FAQ SECTION
          ========================================= */}
      <section id="faqs" className="faq-split-section">
        <div className="faq-header-col">
          <div className="sticky-faq-header">
            <h5>SUPPORT</h5>
            <h2>Got Questions?<br/>We've got answers.</h2>
            <p>Everything you need to know about our bespoke furniture, design process, and logistics.</p>
          </div>
        </div>

        <div className="faq-accordion-col">
          {faqData.map((faq) => (
            <div 
              key={faq.id} 
              className={`faq-item ${activeFaq === faq.id ? 'active' : ''}`}
              onClick={() => toggleFaq(faq.id)}
            >
              <div className="faq-question">
                <h4>{faq.question}</h4>
                <button className="faq-toggle-btn">
                  {activeFaq === faq.id ? <FaMinus /> : <FaPlus />}
                </button>
              </div>
              
              <div className="faq-answer-wrapper">
                <div className="faq-answer-inner">
                  <p>{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================
          5. FULL-WIDTH NEWSLETTER SECTION 
          ========================================= */}
      <section className="fullwidth-newsletter-section">
        <div className="newsletter-container" data-aos="fade" data-aos-duration="800">
          
          <div className="news-left">
            <h5>STAY UP TO DATE</h5>
            <h2>Subscribe to our<br/>newsletter</h2>
            <p>Subscribe to our newsletter and be the first to receive insights, updates, and expert tips on optimizing your interior spaces and bespoke furniture releases.</p>
          </div>

          <div className="news-right">
            
            {!isSubscribed ? (
              <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required 
                />
                <button type="submit">Subscribe</button>
              </form>
            ) : (
              <div className="success-message">
                <span className="dot"></span> Thank you! You've been subscribed.
              </div>
            )}

            <p className="disclaimer">
              By subscribing you agree to our <a href="#">Privacy Policy</a>
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}

export default Contact;