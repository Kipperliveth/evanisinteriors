import React from "react";
import { useState, useEffect } from "react";
import { FaAngleRight } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { FaArrowRightLong } from "react-icons/fa6";
import "aos/dist/aos.css";
import AOS from "aos";
import "aos/dist/aos.js";

function Home() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    document.ttile = "Evanis Interiors"
    
    if (!hasMounted) {
      setHasMounted(true);
      AOS.init({
        delay: 200,
      });
    } else {
      AOS.refresh();
    }
  }, [hasMounted]);

  return (
    <div className="pagewidth ">
      <div className="home">
        <div className="landing">
          <div
            className="landing-content-container"
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-once="true"
          >
            <h1 data-aos="zoom-in" data-aos-duration="800" data-aos-once="true">
              Transform Your Space to a Place of Beauty and Comfort
            </h1>
            <p
              data-aos-delay="300"
              data-aos="zoom-in" data-aos-duration="800" data-aos-once="true" 
             >
              Conceptual. Custom. Yours. We design interiors that tell your
              story through unique details and bespoke furniture
            </p>

            <div
              className="button"
              data-aos="zoom-in"
              data-aos-duration="1000"
              data-aos-once="true"
              data-aos-delay="400"
            >
              <button className="cta">
                <NavLink to='/shop' className='span'>Get Started</NavLink>
                <FaAngleRight />
              </button>
            </div>
          </div>
        </div>

        <div className="shop-section">
          <h1 data-aos="fade-up" data-aos-duration="800" data-aos-once="true">
            Design Your Dream, Piece by Piece
          </h1>

          <p data-aos="fade-up" data-aos-duration="800" data-aos-once="true">
            Shop customizable furnitures to match your style and space
          </p>

          <div className="shop-items">
            <NavLink
           to="/shop?category=sitting"
              className="clm one"
              data-aos="fade-left"
              data-aos-duration="1000"
              data-aos-once="true"
              data-aos-delay="200"
            >
              <h2 className="top-desc">Seating Furniture</h2>

              <h3 className="bottom-desc">Sofas and Couches</h3>
            </NavLink>

            <NavLink
               to="/shop?category=tables"
              className="clm two"
              data-aos="fade-left"
              data-aos-duration="1000"
              data-aos-once="true"
              data-aos-delay="300"
            >
              <h2 className="top-desc">Tables & Surfaces</h2>

              <h3 className="bottom-desc">Desks and Dining</h3>
            </NavLink>

            <NavLink
               to="/shop?category=storage"
              className="clm three"
              data-aos="fade-left"
              data-aos-duration="1000"
              data-aos-once="true"
              data-aos-delay="400"
            >
              <h2 className="top-desc">Storage & Organanisation</h2>

              <h3 className="bottom-desc">Beds, Wardrobes</h3>
            </NavLink>

            <NavLink
              to="/shop"
              className="clm four"
              data-aos="fade-left"
              data-aos-duration="1000"
              data-aos-once="true"
              data-aos-delay="500"
            >
              <h2 className="top-desc">Speciality & Decor</h2>

              <h3 className="bottom-desc">Mirrors, Lighting</h3>
            </NavLink>
          </div>

          <button
            className="shop-cta"
            data-aos="zoom-in"
            data-aos-duration="800"
            data-aos-once="true"
          >
            <NavLink className='span'>Go To Shop</NavLink>
            <FaArrowRightLong className="ctaArrow special-icon" />
          </button>
        </div>

        <div className="masterclass-section">
          <div className="m-container">
            <div
              className="m-sec-left"
              data-aos="zoom-in-right"
              // data-aos-duration="500"
              data-aos-once="true"
            ></div>

            <div className="m-sec-right">
              <h3
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-once="true"
              >
                Join our Masterclass
              </h3>

              <h1
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-delay="200"
                data-aos-once="true"
              >
                <span> Unlock </span>Your Interior Design Potential and Master
                the Art from certified experts
              </h1>

              <p
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-once="true"
                data-aos-delay="300"
              >
                Discover the secrets to stunning interiors with our exclusive
                Masterclass. From basics to advanced techniques, our expert
                instructors guide you every step of the way. Elevate your skills
                and unleash your creativity. Enroll now and transform your space
                today.
              </p>

              <div
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-once="true"
                data-aos-delay="400"
              >
                <NavLink to="/masterclass" className="masterclass-cta">
                  <p>See more</p>
                  <FaArrowRightLong />
                </NavLink>
              </div>
            </div>
          </div>
        </div>

        <div className="about-section">
          <div className="abt-sec-container">
            <div className="abt-sec-left">
              <h3
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-delay="200"
                data-aos-once="true"
              >
                Get to know us
              </h3>

              <h1
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-delay="300"
                data-aos-once="true"
              >
                <span>See</span> what we're about and how we can design
                interiors for you
              </h1>

              <p
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-delay="400"
                data-aos-once="true"
              >
                Explore our company's essence and gain insight into how our
                tailored designs can cater to your unique needs.
              </p>

              <div
                data-aos="fade-up"
                data-aos-duration="1000"
                data-aos-delay="600"
                data-aos-once="true"
              >
                <NavLink to="/about">Learn More</NavLink>
              </div>
            </div>

            <div
              className="abt-sec-right"
              data-aos="zoom-in-left"
              data-aos-duration="800"
              data-aos-delay="200"
              data-aos-once="true"
            ></div>
          </div>
        </div>

        <div className="newsletter-section">
          <div className="newsletter-container">
            <h3
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay="600"
              data-aos-once="true"
            >
              <span>Stay</span> in the loop!
            </h3>

            <h1
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay="600"
              data-aos-once="true"
            >
              Subscribe to our newsletter for the <span>latest updates</span>,
              offers, and design inspiration.
            </h1>
            <span></span>

            <p
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay="600"
              data-aos-once="true"
            >
              Join our community and get access to special offers and early bird
              discounts,expert tips, industry news, and product updates straight
              from our team.
            </p>

            <div
              className="sub-container"
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay="600"
              data-aos-once="true"
            >
              <input type="text" placeholder="Enter email address" />
              <button>Subscribe</button>
            </div>

            <h6
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay="600"
              data-aos-once="true"
            >
              We promise not to spam you
            </h6>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
