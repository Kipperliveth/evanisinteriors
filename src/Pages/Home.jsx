import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FaArrowRight, FaRegHeart, FaStar, FaArrowLeft, FaInstagram, FaWhatsapp, FaTimes, FaCloudUploadAlt, FaCamera, FaPlus, FaMinus, FaPhoneAlt } from "react-icons/fa";

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectFade, Navigation, EffectCoverflow, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

// Image imports 
import slide1 from "../stock/homeLanding.jpg"; 
import slide2 from "../stock/sofa.jpg"; 
import slide3 from "../stock/table.jpg"; 
import cat1 from "../stock/sofa.jpg"; 
import cat2 from "../stock/table.jpg"; 
import cat3 from "../stock/bed.jpg"; 
import cat4 from "../stock/light.jpg"; 
import furnitureCutout from "../stock/furniture-cutout.png";

function Home() {
  const [hasMounted, setHasMounted] = useState(false);
  
  // States for the Reviews Section
  const [viewAllReviews, setViewAllReviews] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null); 
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [bottomSwiperInstance, setBottomSwiperInstance] = useState(null);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);

  // State for FAQs
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    document.title = "Evanis Interiors";
    setHasMounted(true);
  }, []);

  // Lock body scroll when overlays are open
  useEffect(() => {
    if (viewAllReviews || isReviewModalOpen || fullScreenImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [viewAllReviews, isReviewModalOpen, fullScreenImage]);

  // Synchronize the top coverflow and the bottom pagination swiper
  useEffect(() => {
    if (swiperInstance && swiperInstance.activeIndex !== activeReviewIndex) {
      swiperInstance.slideTo(activeReviewIndex);
    }
    if (bottomSwiperInstance && bottomSwiperInstance.activeIndex !== activeReviewIndex) {
      bottomSwiperInstance.slideTo(activeReviewIndex);
    }
  }, [activeReviewIndex, swiperInstance, bottomSwiperInstance]);

  const heroSlides = [
    { id: 1, image: slide1 },
    { id: 2, image: slide2 },
    { id: 3, image: slide3 }
  ];

  const reviewsData = [
    {
      id: 1,
      name: "Amina J.",
      firstName: "Amina",
      initials: "AJ",
      service: "Bespoke Furniture",
      text: "Evanis completely transformed our living space. The bespoke sofa is a masterpiece of craftsmanship and comfort. We had an awkward corner that nothing fit into, and their design team built a custom sectional that looks like it belongs in an architectural magazine.",
      hasMedia: true,
      attachedImage: slide2
    },
    {
      id: 2,
      name: "David O.",
      firstName: "David",
      initials: "DO",
      service: "Interior Design",
      text: "The attention to detail is unmatched. They don't just fill a room; they give it a soul. Our office has never felt more inspiring.",
      hasMedia: false,
      attachedImage: null
    },
    {
      id: 3,
      name: "Sarah & Tom",
      firstName: "Sarah",
      initials: "ST",
      service: "Bespoke Furniture",
      text: "From the initial consultation to the final installation, the Evanis team was exceptional. They understood our vision perfectly and executed it with a level of precision we didn't know was possible. The custom dining table is now the centerpiece of our home.",
      hasMedia: true,
      attachedImage: slide3
    },
    {
      id: 4,
      name: "Michael T.",
      firstName: "Michael",
      initials: "MT",
      service: "Interior Design",
      text: "Absolutely breathtaking work. They managed to perfectly capture the modern, minimalist aesthetic we wanted for our home.",
      hasMedia: false,
      attachedImage: null
    },
    {
      id: 5,
      name: "Elena R.",
      firstName: "Elena",
      initials: "ER",
      service: "Interior Design",
      text: "Working with Evanis felt effortless. They took our vague ideas and turned them into a stunning, functional reality. Every detail was meticulously planned.",
      hasMedia: false,
      attachedImage: null
    },
    {
      id: 6,
      name: "Marcus W.",
      firstName: "Marcus",
      initials: "MW",
      service: "Bespoke Furniture",
      text: "The custom shelving unit they designed for my studio is not just furniture; it's a work of art. Incredible craftsmanship.",
      hasMedia: true,
      attachedImage: cat4
    }
  ];

  // FAQ Data
  const faqData = [
    {
      id: 1,
      question: "How long does a bespoke furniture order take?",
      answer: "Since every piece is custom-built from scratch using premium materials, our standard lead time is 4 to 6 weeks from the design approval and deposit payment. Complex architectural pieces may require additional time, which will be communicated during the consultation."
    },
    {
      id: 2,
      question: "Do you offer full-service interior design?",
      answer: "Yes. Our interior design services cover everything from initial spatial planning and 3D rendering to material procurement and the final styling of the space. We handle residential, commercial, and boutique hospitality projects."
    },
    {
      id: 3,
      question: "Can I choose my own fabrics and finishes?",
      answer: "Absolutely. We pride ourselves on the 'bespoke' nature of our work. During your consultation, we provide a curated selection of high-end fabrics, woods, and metals. We can also source specific materials upon request to match your exact vision."
    },
    {
      id: 4,
      question: "Where do you deliver and install?",
      answer: "We currently offer delivery and professional white-glove installation across Lagos and Port Harcourt. For projects outside these regions or international shipping, please contact our team to discuss logistics and specialized crating."
    },
    {
      id: 5,
      question: "How do I start a custom project with Evanis?",
      answer: "Simply click 'Request Quote' or 'Custom Order' to fill out our brief inquiry form. One of our lead designers will reach out within 24 hours to schedule a consultation call to discuss your space, aesthetic preferences, and budget."
    }
  ];

  const handleOpenReview = (index) => {
    setActiveReviewIndex(index);
    setViewAllReviews(true);
  };

  const toggleFaq = (id) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  if (!hasMounted) return null;

  return (
    <div className="home-page-wrapper">
      
      {/* =========================================
          HERO SECTION
          ========================================= */}
      <div className="home-container">
        <section className="bento-hero-section">
          
          <div className="hero-content-col">
            <div className="hero-text-block">
              <h1>Transform your space into a place of beauty.</h1>
              <p>
                Conceptual. Custom. Yours. We design aesthetic interiors that tell your story through meticulously crafted details and bespoke furniture.
              </p>
              
              <div className="hero-cta-group">
                <NavLink to="/shop" className="hero-cta-primary">
                  <span>Shop Now</span>
                  <FaArrowRight className="cta-icon" />
                </NavLink>
                <NavLink to="/categories" className="hero-cta-secondary">
                  Explore Collections
                </NavLink>
              </div>
            </div>

            <div className="hero-stats-row">
              <div className="stat-card">
                <h2>3+</h2>
                <p>years of design <br/>excellence</p>
              </div>
              <div className="stat-card">
                <h2>1000+</h2>
                <p>homes & businesses <br/>trust us</p>
              </div>
              <div className="stat-card">
                <h2>100%</h2>
                <p>custom, bespoke <br/>& truly yours</p>
              </div>
            </div>
          </div>

          <div className="hero-image-col">
            <Swiper
              modules={[Pagination, Autoplay, EffectFade]}
              effect="fade"
              speed={1200}
              pagination={{ clickable: true, el: '.bento-pagination' }}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              loop={true}
              className="bento-swiper"
            >
              {heroSlides.map((slide) => (
                <SwiperSlide key={slide.id}>
                  <div 
                    className="bento-slide-bg" 
                    style={{ backgroundImage: `url(${slide.image})` }}
                  ></div>
                </SwiperSlide>
              ))}
              <div className="bento-pagination"></div>
            </Swiper>
          </div>

        </section>
      </div>

      {/* =========================================
          SHOP BY CATEGORY
          ========================================= */}
      <div className="section-container">
        <section className="shop-categories-minimal">
          <div className="section-title-center">
            <h2>Our Collections</h2>
            <p>Discover our curated collection of timeless furniture, where classic design meets modern elegance.</p>
          </div>

          <div className="category-minimal-grid">
            <NavLink to="/shop?category=sitting" className="minimal-cat-item">
              <div className="img-wrapper"><img src={cat1} alt="Sofas" /></div>
              <h4>Sofas & Couches</h4>
              <p>28 Items</p>
            </NavLink>
            <NavLink to="/shop?category=chairs" className="minimal-cat-item">
              <div className="img-wrapper"><img src={cat2} alt="Chairs" /></div>
              <h4>Chairs</h4>
              <p>15 Items</p>
            </NavLink>
            <NavLink to="/shop?category=tables" className="minimal-cat-item">
              <div className="img-wrapper"><img src={cat3} alt="Tables" /></div>
              <h4>Tables</h4>
              <p>20 Items</p>
            </NavLink>
            <NavLink to="/shop?category=storage" className="minimal-cat-item">
              <div className="img-wrapper"><img src={cat4} alt="Storage" /></div>
              <h4>Consoles</h4>
              <p>7 Items</p>
            </NavLink>
            <NavLink to="/shop?category=beds" className="minimal-cat-item">
              <div className="img-wrapper"><img src={cat1} alt="Beds" /></div>
              <h4>Beds</h4>
              <p>11 Items</p>
            </NavLink>
          </div>
        </section>
      </div>

      {/* =========================================
          BEST SELLERS
          ========================================= */}
      <div className="section-container">
        <section className="bestsellers-inspo-section">
          
          <div className="bestsellers-header">
            <h5>BEST SELLERS</h5>
            <h2>Our Most<br/>Loved Pieces</h2>
            <p>Handpicked favorites that blend style, quality, and functionality.</p>
            
            {/* Proper Desktop link toggle */}
            <NavLink to="/shop" className="text-link-cta desktop-only">
              View All Products <FaArrowRight className="link-icon" />
            </NavLink>
          </div>

          <div className="bestsellers-slider-col">
            
            <div className="slider-custom-nav">
              <button className="best-prev"><FaArrowLeft /></button>
              <button className="best-next"><FaArrowRight /></button>
            </div>

            <Swiper
              modules={[Navigation]}
              slidesPerView={1.2}
              spaceBetween={20}
              navigation={{
                nextEl: '.best-next',
                prevEl: '.best-prev',
              }}
              breakpoints={{
                640: { slidesPerView: 2.2, spaceBetween: 20 },
                1024: { slidesPerView: 2.5, spaceBetween: 30 }
              }}
              className="inspo-swiper"
            >
              <SwiperSlide>
                <div className="inspo-product-card">
                  <div className="image-box">
                    <img src={cat1} alt="Luna 3-Seater Sofa" />
                    <div className="new-badge"><span className="dot"></span> New</div>
                    <button className="wishlist-btn"><FaRegHeart /></button>
                  </div>
                  <NavLink to="/shop/product/1" className="meta-box">
                    <h4>Luna 3-Seater Sofa</h4>
                    <p>₦899,000</p>
                  </NavLink>
                </div>
              </SwiperSlide>

              <SwiperSlide>
                <div className="inspo-product-card">
                  <div className="image-box">
                    <img src={cat2} alt="Haven Dining Table" />
                    <button className="wishlist-btn"><FaRegHeart /></button>
                  </div>
                  <NavLink to="/shop/product/2" className="meta-box">
                    <h4>Haven Dining Table</h4>
                    <p>₦599,000</p>
                  </NavLink>
                </div>
              </SwiperSlide>

              <SwiperSlide>
                <div className="inspo-product-card">
                  <div className="image-box">
                    <img src={cat1} alt="Casa Lounge Chair" />
                    <button className="wishlist-btn"><FaRegHeart /></button>
                  </div>
                  <NavLink to="/shop/product/3" className="meta-box">
                    <h4>Casa Lounge Chair</h4>
                    <p>₦299,000</p>
                  </NavLink>
                </div>
              </SwiperSlide>
              
              <SwiperSlide>
                <div className="inspo-product-card">
                  <div className="image-box">
                    <img src={cat3} alt="Milo Sideboard" />
                    <div className="new-badge"><span className="dot"></span> New</div>
                    <button className="wishlist-btn"><FaRegHeart /></button>
                  </div>
                  <NavLink to="/shop/product/4" className="meta-box">
                    <h4>Milo Sideboard</h4>
                    <p>₦449,000</p>
                  </NavLink>
                </div>
              </SwiperSlide>
            </Swiper>
          </div>

          {/* Proper Mobile link toggle with centering */}
          <NavLink to="/shop" className="text-link-cta centered-link mobile-only">
            View All Products <FaArrowRight className="link-icon" />
          </NavLink>

        </section>
      </div>

      {/* =========================================
          ABOUT & SERVICES
          ========================================= */}
      <section className="split-about-section">
        
        <div className="sticky-image-col">
          <img src={slide3} alt="Evanis Interior Design" />
        </div>

        <div className="scrolling-content-col">
          <div className="as-header">
            <h5>OUR EXPERTISE</h5>
            <h2>Designing your world, down to the last detail.</h2>
            <p className="about-text">
              At Evanis, we don't just furnish spaces—we craft environments. We believe that your home or workspace should be a true reflection of your vision. From single custom items to full-scale architectural transformations, our expertise spans residential and commercial spaces of any size.
            </p>
          </div>

          <div className="services-list">
            
            <div className="service-item">
              <div className="service-number">01</div>
              <div className="service-image-wrapper">
                <img src={cat2} alt="Bespoke Furniture" className="subtle-img" />
              </div>
              <div className="service-details">
                <h4>Bespoke Furniture</h4>
                <p>On-demand, custom-built pieces meticulously crafted for houses, workspaces, and unique interiors. We use premium materials to build furniture that fits your exact spatial and aesthetic needs.</p>
                
                <div className="service-links">
                  <NavLink to="/shop" className="service-link">
                    See Store <FaArrowRight className="link-icon" />
                  </NavLink>
                  <NavLink to="/contact" className="service-link">
                    Custom Order <FaArrowRight className="link-icon" />
                  </NavLink>
                </div>
              </div>
            </div>

            <div className="service-item">
              <div className="service-number">02</div>
              <div className="service-image-wrapper">
                <img src={cat3} alt="Interior Design" className="subtle-img" />
              </div>
              <div className="service-details">
                <h4>Interior Design</h4>
                <p>Comprehensive interior styling for any scale and any type of environment. From initial spatial planning to the final curated styling touches, we bring your complete vision to life.</p>
                
                <div className="service-links">
                  <NavLink to="/designs" className="service-link">
                    Explore Studio <FaArrowRight className="link-icon" />
                  </NavLink>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* =========================================
          FULL-WIDTH PROMO BANNER
          ========================================= */}
      <section className="full-width-promo-banner">
        
        <div className="hp-inner-container">
          <div className="hp-content">
            <h5>DESIGNED TO INSPIRE</h5>
            <h2>Modern Furniture.<br/>Made for Real Life.</h2>
            <p>Discover bespoke pieces that combine unparalleled comfort, intelligent function, and timeless style for your unique space.</p>
            
            <NavLink to="/shop" className="promo-btn">
              <span>Explore Collection</span>
              <FaArrowRight className="btn-icon" />
            </NavLink>
          </div>
        </div>

        <div className="hp-image-container">
          <img src={furnitureCutout} alt="Evanis Furniture Collection" className="floating-sofa" />
        </div>

      </section>

      {/* =========================================
          REVIEWS & SOCIAL PROOF SECTION
          ========================================= */}
      
      {/* VIEW 1: Split Layout (100vh Sticky & Scrolling) */}
      <section className="split-reviews-section bg-warm-light">
        
        {/* Left Col: Sticky Header Info */}
        <div className="sticky-info-col">
          <div className="sticky-content-wrapper">
            
            <h5>LOVED BY OUR CLIENTS</h5>
            <h2>Elevating spaces,<br/>one detail at a time.</h2>
            <p className="subtext">From single bespoke pieces to full architectural styling, read how we've transformed homes and workspaces.</p>
            
            {/* Desktop Action Buttons */}
            <div className="review-action-btns desktop-only">
              <button className="primary-action" onClick={() => setIsReviewModalOpen(true)}>
                Leave a Review
              </button>
              <button className="secondary-action" onClick={() => setViewAllReviews(true)}>
                View All Reviews <FaArrowRight className="icon" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Scrolling Review Cards */}
        <div className="scrolling-reviews-col">
          <div className="reviews-list">
            {reviewsData.map((review, idx) => (
              <div key={review.id} className="review-card">
                
                <div className="card-header">
                  <div className="header-left">
                    <div className="reviewer-monogram">{review.initials}</div>
                    <div>
                      <h4>{review.name}</h4>
                      <span className="service-tag">{review.service}</span>
                    </div>
                  </div>
                  
                  {/* View Media Button */}
                  {review.hasMedia && review.attachedImage && (
                    <button 
                      className="corner-media-btn" 
                      onClick={() => setFullScreenImage(review.attachedImage)}
                    >
                      <FaCamera className="media-icon" />
                      <span className="media-text">View Attached Media</span>
                    </button>
                  )}
                </div>
                
                {/* Clamped Text */}
                <p className="clamped-text">"{review.text}"</p>
                
                {/* Jump to full view if text is long */}
                <button className="view-full-text-btn" onClick={() => handleOpenReview(idx)}>
                  View full review
                </button>

              </div>
            ))}
          </div>

          {/* Mobile Action Buttons */}
          <div className="review-action-btns mobile-only">
            <button className="primary-action" onClick={() => setIsReviewModalOpen(true)}>
              Leave a Review
            </button>
            <button className="secondary-action" onClick={() => setViewAllReviews(true)}>
              View All Reviews <FaArrowRight className="icon" />
            </button>
          </div>
        </div>

      </section>

      {/* VIEW 2: FULL-SCREEN OVERLAY (Coverflow Carousel) */}
      {viewAllReviews && (
        <div className="full-coverflow-overlay fade-in">
          
          <div className="carousel-header">
            <button className="back-btn" onClick={() => setViewAllReviews(false)}>
              <FaArrowLeft className="icon" /> Back to Summary
            </button>
            
            <div className="carousel-header-actions">
              <select className="review-filter">
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rated</option>
                <option value="media">With Media</option>
              </select>
              <button className="primary-action slim" onClick={() => setIsReviewModalOpen(true)}>
                Leave a Review
              </button>
            </div>
          </div>

          <div className="coverflow-container">
            {/* Left / Right Navigation Arrows */}
            <button className="coverflow-nav-btn prev" onClick={() => swiperInstance?.slidePrev()}><FaArrowLeft /></button>
            <button className="coverflow-nav-btn next" onClick={() => swiperInstance?.slideNext()}><FaArrowRight /></button>

            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              initialSlide={activeReviewIndex}
              mousewheel={{ forceToAxis: true }} 
              onSwiper={setSwiperInstance}
              onSlideChange={(swiper) => setActiveReviewIndex(swiper.activeIndex)}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 150,
                modifier: 2.5,
                slideShadows: false,
              }}
              modules={[EffectCoverflow, Mousewheel]}
              className="reviews-coverflow"
            >
              {reviewsData.map((review) => (
                <SwiperSlide key={review.id} className="coverflow-slide">
                  <div className="coverflow-card">
                    
                    <div className="card-top">
                      <div className="header-left">
                        <div className="reviewer-monogram">{review.initials}</div>
                        <div>
                          <h3>{review.name}</h3>
                          <span>{review.service}</span>
                        </div>
                      </div>

                      {review.hasMedia && review.attachedImage && (
                        <button 
                          className="corner-media-btn" 
                          onClick={() => setFullScreenImage(review.attachedImage)}
                        >
                          <FaCamera className="media-icon" />
                          <span className="media-text">View Attached Media</span>
                        </button>
                      )}
                    </div>
                    
                    <p className="card-body">"{review.text}"</p>
                    
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Synchronized Swiper Pagination for Monograms */}
            <div className="monogram-pagination-wrapper">
              <Swiper
                onSwiper={setBottomSwiperInstance}
                slidesPerView="auto"
                centeredSlides={true}
                spaceBetween={20}
                slideToClickedSlide={true}
                initialSlide={activeReviewIndex}
                onSlideChange={(swiper) => setActiveReviewIndex(swiper.activeIndex)}
                className="monogram-swiper"
              >
                {reviewsData.map((review, idx) => (
                  <SwiperSlide key={review.id} className="monogram-slide">
                    <div className={`monogram-container ${activeReviewIndex === idx ? 'active' : ''}`}>
                      <div className="monogram-dot">{review.initials}</div>
                      <span className="monogram-name">{review.firstName}</span>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

          </div>
        </div>
      )}

      {/* =========================================
          FULL-SCREEN IMAGE MEDIA MODAL
          ========================================= */}
      {fullScreenImage && (
        <div className="media-modal-overlay fade-in" onClick={() => setFullScreenImage(null)}>
          <div className="media-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setFullScreenImage(null)}>
              <FaTimes />
            </button>
            <img src={fullScreenImage} alt="Client attached media full view" />
          </div>
        </div>
      )}

      {/* =========================================
          LEAVE A REVIEW MODAL
          ========================================= */}
      {isReviewModalOpen && (
        <div className="review-modal-overlay fade-in" onClick={() => setIsReviewModalOpen(false)}>
          <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setIsReviewModalOpen(false)}>
              <FaTimes />
            </button>
            
            <h2>Share Your Experience</h2>
            <p>Tell us how Evanis transformed your space.</p>
            
            <form className="review-form" onSubmit={(e) => { e.preventDefault(); setIsReviewModalOpen(false); }}>
              
              <div className="form-group">
                <label>Name</label>
                <input type="text" placeholder="John Doe" required />
              </div>

              <div className="form-group">
                <label>Service Received</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="service" value="furniture" defaultChecked />
                    <span>Bespoke Furniture</span>
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="service" value="design" />
                    <span>Interior Design</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Your Review</label>
                <textarea rows="4" placeholder="Describe your experience..." required></textarea>
              </div>

              <div className="form-group">
                <label>Add Media (Optional)</label>
                <div className="upload-box">
                  <FaCloudUploadAlt className="upload-icon" />
                  <span>Upload a photo or 5-sec video</span>
                  <input type="file" accept="image/*,video/mp4" />
                </div>
              </div>

              <button type="submit" className="submit-btn">Submit Review</button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          FAQ SECTION (Split Layout)
          ========================================= */}
      <div className="section-container bg-white">
        <section id="faqs" className="faq-split-section">
          
          <div className="faq-header-col">
            <div className="sticky-faq-header">
              <h5>SUPPORT</h5>
              <h2>Got Questions?<br/>We've got answers.</h2>
              <p>Everything you need to know about our bespoke furniture, design process, and logistics.</p>

              {/* Desktop Smart CTA positioned right beneath the paragraph */}
              <div className="faq-contact-cta desktop-only">
                <p className="cta-prompt">Didn't find what you're looking for?</p>
                <NavLink to="/contact" className="text-link-cta">
                  Speak with our team <FaArrowRight className="link-icon" />
                </NavLink>
              </div>
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

            {/* Mobile Smart CTA positioned at the bottom of the accordion list */}
            <div className="faq-contact-cta mobile-only">
              <p className="cta-prompt">Didn't find what you're looking for?</p>
              <NavLink to="/contact" className="text-link-cta centered-link">
                Speak with our team <FaArrowRight className="link-icon" />
              </NavLink>
            </div>

          </div>

        </section>
      </div>

      {/* =========================================
          FINAL CTA / SOCIALS (100vh Dark Bento Grid)
          ========================================= */}
      <div className="section-container bg-dark-editorial">
        <section className="social-cta-section">
          
          {/* Left Col: Contact Info */}
          <div className="cta-content-col">
            <h5>CONNECT WITH US</h5>
            <h2>Let's bring your vision to life.</h2>
            <p>Whether you're looking for a single bespoke piece or a complete architectural transformation, our team is ready to create with you.</p>

            <div className="contact-buttons">
              <a href="https://wa.me/2347038065509" target="_blank" rel="noopener noreferrer" className="action-btn whatsapp-btn">
                <FaWhatsapp className="btn-icon" /> Chat on WhatsApp
              </a>
              <a href="tel:+2347038065509" className="action-btn call-btn">
                <FaPhoneAlt className="btn-icon" /> Call Us Directly
              </a>
            </div>

            <div className="social-links-group">
              <p>SEE MORE ON:</p>
              <div className="ig-links-row">
                
                <a href="https://instagram.com/evanis_interiors" target="_blank" rel="noopener noreferrer" className="ig-pill">
                  <FaInstagram className="ig-icon" />
                  <span>@evanis_interiors</span>
                </a>
                
                <a href="https://instagram.com/evanisdesigns" target="_blank" rel="noopener noreferrer" className="ig-pill">
                  <FaInstagram className="ig-icon" />
                  <span>@evanisdesigns</span>
                </a>

              </div>
            </div>
          </div>

          {/* Right Col: 100vh Masonry Social Grid */}
          <div className="social-grid-col">
            <div className="ig-masonry-grid">
              
              <div className="grid-col col-down">
                <div className="grid-item">
                  <img src={slide3} alt="Instagram post" />
                  <div className="ig-overlay"><FaInstagram /></div>
                </div>
                <div className="grid-item">
                  <img src={cat2} alt="Instagram post" />
                  <div className="ig-overlay"><FaInstagram /></div>
                </div>
                <div className="grid-item">
                  <img src={slide1} alt="Instagram post" />
                  <div className="ig-overlay"><FaInstagram /></div>
                </div>
              </div>
              
              <div className="grid-col col-up">
                <div className="grid-item">
                  <img src={cat1} alt="Instagram post" />
                  <div className="ig-overlay"><FaInstagram /></div>
                </div>
                <div className="grid-item">
                  <img src={slide2} alt="Instagram post" />
                  <div className="ig-overlay"><FaInstagram /></div>
                </div>
                <div className="grid-item">
                  <img src={cat3} alt="Instagram post" />
                  <div className="ig-overlay"><FaInstagram /></div>
                </div>
              </div>

            </div>
          </div>

        </section>
      </div>

    </div>
  );
}

export default Home;