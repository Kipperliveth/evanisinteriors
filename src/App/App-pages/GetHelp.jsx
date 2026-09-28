import React, { useState, useEffect } from "react";
import UserNav from "../App-components/UserNav";
import { FaInstagram, FaWhatsapp, FaTiktok } from "react-icons/fa";
import { MdMailOutline } from "react-icons/md";
import { BsSearch, BsChevronDown } from "react-icons/bs";

import "aos/dist/aos.css";
import AOS from "aos";

function GetHelp() {
  const [hasMounted, setHasMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    document.title = "Support - Evanis Interiors";
    if (!hasMounted) {
      setHasMounted(true);
      AOS.init({ delay: 100, once: true });
    } else {
      AOS.refresh();
    }
  }, [hasMounted]);

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  // SMOOTH SCROLL FUNCTION FOR POPULAR TOPICS
  const handleTopicClick = (faqId) => {
    setOpenFaq(faqId); // Automatically open the accordion
    
    setTimeout(() => {
      const element = document.getElementById(faqId);
      if (element) {
        // Calculates position and offsets by 120px so the fixed navbar doesn't cover the title
        const yOffset = -120; 
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 100); // Slight delay to ensure React state updates before scrolling
  };

  const suggestedFaqs = [
    {
      id: "s1",
      question: "What is the estimated delivery time for custom pieces?",
      answer: "Bespoke and custom-built furniture typically requires a lead time of 4 to 6 weeks for manufacturing, quality assurance, and preparation for dispatch."
    },
    {
      id: "s2",
      question: "What are your shipping options and range?",
      answer: "We offer nationwide shipping across Nigeria. While our primary operations span Port Harcourt and Lagos, our logistics network ensures your bespoke pieces are delivered securely to your doorstep. Freight and white-glove delivery fees are calculated separately during checkout."
    },
    {
      id: "s3",
      question: "What is your return and refund policy?",
      answer: "Due to the highly personalized and bespoke nature of our furniture, we do not offer refunds or returns once an order has been processed, built, or delivered."
    }
  ];

  const allFaqs = [
    {
      id: "a1",
      question: "How do I place an order?",
      answer: "Simply browse our online collection, add your desired pieces to the cart, and proceed to checkout. You will be prompted to enter your shipping details and complete your payment."
    },
    {
      id: "a2",
      question: "Do you offer custom designs or dimension alterations?",
      answer: "Yes, we specialize in custom furniture builds and spatial planning. If you need specific dimensions or unique fabrics, please contact our concierge team before placing your order."
    },
    {
      id: "a3",
      question: "How do I track my order status?",
      answer: "Once your order moves into the production phase, and subsequently to shipping, you can track its progress directly from the 'Order History' tab in your Account Dashboard."
    },
    {
      id: "a4",
      question: "How should I care for my furniture?",
      answer: "We use high-quality, sustainable materials. A detailed digital care guide covering fabric maintenance, wood polishing, and general upkeep is provided with every purchase."
    },
    {
      id: "a5",
      question: "Can I modify my order after payment?",
      answer: "Order modifications (such as changing a fabric color or dimension) can only be accommodated within 24 hours of payment. After this window, production begins and changes cannot be made."
    }
  ];

  return (
    <div className="kb-editorial-wrapper">
      <UserNav />

      <div className="kb-container">
        
        {/* =========================================
            HEADER & SEARCH SECTION
            ========================================= */}
        <div className="kb-header" data-aos="fade-up" data-aos-duration="800">
          <h1>Need some help?</h1>
          
          <div className="search-wrapper">
            <div className="search-input-box">
              <BsSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search for shipping, refunds, care guides..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-btn">Search</button>
            </div>
            <div className="popular-topics">
              <span>Popular topics:</span>
              <button className="topic-tag" onClick={() => handleTopicClick('a3')}>Tracking</button>
              <button className="topic-tag" onClick={() => handleTopicClick('s3')}>Refunds</button>
              <button className="topic-tag" onClick={() => handleTopicClick('a2')}>Custom Orders</button>
            </div>
          </div>
        </div>

        {/* =========================================
            FAQ LISTS SECTION
            ========================================= */}
        <div className="faq-lists-container">
          
          {/* Suggested Questions */}
          <div className="faq-section" data-aos="fade-up" data-aos-duration="800" data-aos-delay="100">
            <h2 className="section-title">Suggested Questions</h2>
            <div className="faq-accordion">
              {suggestedFaqs.map((faq) => (
                <div 
                  key={faq.id} 
                  id={faq.id} // Added ID here for the scroll target
                  className={`faq-item ${openFaq === faq.id ? "active" : ""}`}
                  onClick={() => toggleFaq(faq.id)}
                >
                  <div className="faq-question">
                    <h3>{faq.question}</h3>
                    <BsChevronDown className="chevron" />
                  </div>
                  <div className="faq-answer-wrapper" style={{ maxHeight: openFaq === faq.id ? "200px" : "0px" }}>
                    <p className="faq-answer">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Questions */}
          <div className="faq-section" data-aos="fade-up" data-aos-duration="800" data-aos-delay="200">
            <h2 className="section-title">All Questions</h2>
            <div className="faq-accordion">
              {allFaqs.map((faq) => (
                <div 
                  key={faq.id} 
                  id={faq.id} // Added ID here for the scroll target
                  className={`faq-item ${openFaq === faq.id ? "active" : ""}`}
                  onClick={() => toggleFaq(faq.id)}
                >
                  <div className="faq-question">
                    <h3>{faq.question}</h3>
                    <BsChevronDown className="chevron" />
                  </div>
                  <div className="faq-answer-wrapper" style={{ maxHeight: openFaq === faq.id ? "200px" : "0px" }}>
                    <p className="faq-answer">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* =========================================
            DIRECT CONTACT SECTION
            ========================================= */}
        <div className="direct-contact-section" data-aos="fade-in" data-aos-duration="1000" data-aos-delay="400">
          <div className="contact-bento">
            <div className="contact-text">
              <h2>Still can't find the answer?</h2>
              <p>Our concierge team is available to assist you directly with any specific inquiries.</p>
            </div>
            
            <div className="social-links">
              <a href="#whatsapp" className="social-btn whatsapp">
                <FaWhatsapp className="icon" /> WhatsApp
              </a>
              <a href="mailto:evanisinteriors@gmail.com" className="social-btn email">
                <MdMailOutline className="icon" /> Email Us
              </a>
              <a href="#instagram" className="social-btn icon-only">
                <FaInstagram className="icon" />
              </a>
              <a href="#tiktok" className="social-btn icon-only tiktok">
                <FaTiktok className="icon" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default GetHelp;