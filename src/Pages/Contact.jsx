import React from "react";
import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { AiOutlineForm } from "react-icons/ai";
import { VscSend } from "react-icons/vsc";
import { FaInstagram } from "react-icons/fa";
import { IoLogoTiktok } from "react-icons/io5";
import { FaWhatsapp } from "react-icons/fa";
import { MdMailOutline } from "react-icons/md";
import "aos/dist/aos.css";
import AOS from "aos";
import "aos/dist/aos.js";
import { useForm, ValidationError } from '@formspree/react';


function Contact() {
  const [hasMounted, setHasMounted] = useState(false);
  const [completed, setCompleted] = useState(false)
  const [notCompleted, setNotCompleted] = useState(false)

  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    document.title = "Contact-Evanis interiors";

    if (!hasMounted) {
      setHasMounted(true);
      AOS.init({
        delay: 200,
      });
    } else {
      AOS.refresh();
    }
  }, [hasMounted]);

  const [wasSubmitting, setWasSubmitting] = useState(false);
  const [state, handleSubmit] = useForm("mvgpyprj");
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const messageRef = useRef(null);

  useEffect(() => {
    if (state.succeeded) {
      nameRef.current.value = "";
      emailRef.current.value = "";
      messageRef.current.value = "";
      setShowPopup(false);
      setCompleted(true);
    } else if (!state.submitting && wasSubmitting && !state.succeeded) {
      setShowPopup(false);
      setNotCompleted(true);
      console.log('didint work')
    }

    if (state.submitting) {
      setWasSubmitting(true);
    }
  }, [state.succeeded, state.submitting, wasSubmitting]);

  const handleFormSubmit = (event) => {
    setShowPopup(true);
    handleSubmit(event);
  };

  return (
    <div className="pagewidth">
      <div className="contact">
        <div className="contact-header">
          <h1>Contact Us</h1>
        </div>

        <div className="contact-form">
          <div className="form-left">
            <h1
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="300"
              data-aos-once="true"
            >
              Get in <span>Touch</span>
            </h1>
            <p
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="400"
              data-aos-once="true"
            >
              If you need help ordering from the online store, enrolling for the
              masterclass or need a quote for a design idea
            </p>

            <div
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="500"
              data-aos-once="true"
            >
              <NavLink className="contact-page-cta">
                <div>Send a Form</div>
                <AiOutlineForm className="cta-form" />
              </NavLink>
            </div>
          </div>

          <div
            className="form-right"
            data-aos="fade-in"
            data-aos-duration="1000"
            data-aos-delay="600"
            data-aos-once="true"
          >
          <form onSubmit={handleFormSubmit}>
              <div className="top">
                <input type="text" id="name" name="name" placeholder="Name" ref={nameRef} required />
                <input type="email" id="email" name="email" placeholder="Email or Phone" ref={emailRef} required />
              </div>
              <div className="bottom">
                <textarea
                  name="message"
                  id="message"
                  placeholder="Message"
                  ref={messageRef}
                  required
                ></textarea>
              </div>
              <button type="submit" disabled={state.submitting}>
                <h3>Submit</h3> <VscSend className="submit-btn" />
              </button>

              <div className="form-socials">
              <a href="https://www.instagram.com/evanis_homes?igsh=bGljMXdoZDR6MWtt">
              <FaInstagram className="footer-icon" />
              </a>
              <a href="">
              <IoLogoTiktok className="footer-icon" />
              </a>
              <a href="">
              <FaWhatsapp className="footer-icon" />
              </a>
              <a href="">
              <MdMailOutline className="footer-icon" />
              </a>
              </div>
            </form>
          </div>
        </div>

        <div className="Faqs">
          <h1
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="100"
            data-aos-once="true"
          >
            Frequently Asked Questions
          </h1>

          <div className="acc-wrap">
            <div className="accordion">
              <div className="left">
                <div
                  className="item"
                  data-aos="fade-up"
                  data-aos-duration="800"
                  data-aos-delay="300"
                  data-aos-once="true"
                >
                  <input type="radio" id="one" name="item" />
                  <label htmlFor="one" className="title">
                    How to place an order?  
                  </label>
                  <div className="acc-content">
                    Ordering is easy! Simply browse our collection, add items to
                    your cart, and proceed to checkout. Follow the prompts to
                    enter your shipping details and preferred payment method to
                    complete the purchase.
                  </div>
                </div>

                <div
                  className="item"
                  data-aos="fade-up"
                  data-aos-duration="800"
                  data-aos-delay="400"
                  data-aos-once="true"
                >
                  <input type="radio" id="five" name="item" />
                  <label htmlFor="five" className="title">
                    Quality and sustainability of materials
                  </label>
                  <div className="acc-content">
                    We use high-quality, sustainable materials that are both
                    stylish and comfortable. Our furnitures are carefully selected
                    for their durability, and sustainability
                    credentials. We also use eco-friendly dyes and finishing
                    processes whenever possible.
                  </div>
                </div>

                <div
                  className="item"
                  data-aos="fade-up"
                  data-aos-duration="800"
                  data-aos-delay="500"
                  data-aos-once="true"
                >
                  <input type="radio" id="three" name="item" />
                  <label htmlFor="three" className="title">
                    What is our refund policy
                  </label>
                  <div className="acc-content">
                    We want you to be delighted with your purchase. Check out
                    our Return Policy for information on returns, exchanges, and
                    how to initiate a return request.
                  </div>
                </div>
              </div>

              <div className="right">
                <div
                  className="item"
                  data-aos="fade-up"
                  data-aos-duration="800"
                  data-aos-delay="600"
                  data-aos-once="true"
                >
                  <input type="radio" id="four" name="item" />
                  <label htmlFor="four" className="title">
                    Do we offer custom designs or alterations?
                  </label>
                  <div className="acc-content">
                    Yes, we offer a variety of custom design and alteration
                    services to help you create the perfect decor.
                  </div>
                </div>

                <div
                  className="item"
                  data-aos="fade-up"
                  data-aos-duration="800"
                  data-aos-delay="700"
                  data-aos-once="true"
                >
                  <input type="radio" id="six" name="item" />
                  <label htmlFor="six" className="title">
                    How can I contact customer support?
                  </label>
                  <div className="acc-content">
                    Our dedicated support team is ready to assist you. Feel free
                    to reach out via our Contact Us page or email us at
                    support@example.com.
                  </div>
                </div>

                <div
                  className="item"
                  data-aos="fade-up"
                  data-aos-duration="800"
                  data-aos-delay="800"
                  data-aos-once="true"
                >
                  <input type="radio" id="two" name="item" />
                  <label htmlFor="two" className="title">
                    What are the shipping options available?
                  </label>
                  <div className="acc-content">
                    We offer various shipping options to suit your needs.
                    Explore our Shipping Information page for details on
                    delivery times, costs, and available services.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {showPopup && (
        <div className="popup">

          <div className="spinner">
            <div></div>   
            <div></div>    
            <div></div>    
            <div></div>    
            <div></div>    
            <div></div>    
            <div></div>    
            <div></div>    
            <div></div>    
            <div></div>    
          </div>


        </div>
      )}

      {completed && (
        <div className='checkout-popup'>


          <div className='checkout-container'>

          <div className="checkbox-wrapper">
          <input defaultChecked={false} type="checkbox" />
          <svg viewBox="0 0 35.6 35.6">
            <circle className="background" cx="17.8" cy="17.8" r="17.8"></circle>
            <circle className="stroke" cx="17.8" cy="17.8" r="14.37"></circle>
            <polyline className="check" points="11.78 18.12 15.55 22.23 25.17 12.87"></polyline>
          </svg>
                </div>

        <h1>all done!</h1>


        <p>Your message has been sent succesfully! <br /> We will get in touch soon.</p>

       <div className='buttons'>
            <button onClick={() => setCompleted(false)} className="a"> Close</button>
        </div>

          </div>
          </div>
      )}

      {notCompleted && (
        <div className='checkout-popup'>


          <div className='checkout-container'>

          <div className=" error">
         <h1>X</h1>
           </div>

        <h1>oops!</h1>


        <p>Something went wrong, your message didnt go through! <br /> Please try again.</p>

       <div className='buttons'>
            <button onClick={() => setNotCompleted(false)} className="a again"> try again</button>
        </div>

          </div>
          </div>
      )}
      </div>
    </div>
  );
}

export default Contact;
