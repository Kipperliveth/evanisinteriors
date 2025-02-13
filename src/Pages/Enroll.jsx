import React from "react";
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "aos/dist/aos.css";
import AOS from "aos";
import "aos/dist/aos.js";
import { addDoc, collection, updateDoc } from "firebase/firestore";
import { txtdb } from "../firebase-config";
import emailjs from 'emailjs-com';


function Enroll() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    document.title = "Masterclass-Evanis Interiors";

    if (!hasMounted) {
      setHasMounted(true);
      AOS.init({
        delay: 200,
      });
    } else {
      AOS.refresh();
    }
  }, [hasMounted]);

  useEffect(() => {
    emailjs.init("A7nlh5ZfZyzFdJHXR");
  }, []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [interestReason, setInterestReason] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const Amount = price;

  const handlePaystackPayment = async (event) => {
    event.preventDefault();
    if (!email || !Amount || !phoneNumber || !interestReason || !fullName) {
      setError("Please fill in all fields before making payment.");
      return;
    }
  
    const paystackPublicKey = "pk_test_7f79f31587f095af7aeb39e998fc9daee664c1ed";
    // const paystackPublicKey = "pk_live_ebd855719072a4c2ac87beac3780b30f955d54c6";
  
    const handler = window.PaystackPop.setup({
      key: paystackPublicKey,
      email: email, 
      amount: Amount * 100, 
      currency: "NGN",
      callback: function(response) {
        console.log("Payment reference:", response.reference);
        handleSubmit(response.reference);
      },
      onClose: function() {
        console.warn("Payment was not completed!");
        setError("Payment was not completed. Please try again.");
      }
    });
  
    handler.openIframe();
  };
  

  const handleSubmit = async (reference) => {
      setShowPopup(true);
    setLoading(true);

  
    try {
      const docRef = await addDoc(collection(txtdb, "courseEnrollments"), {
        fullName,
        email,
        phoneNumber,
        interestReason,
        paymentReference: reference, // Store Paystack reference
        timestamp: new Date().toLocaleString(),
      });
  
      await updateDoc(docRef, { enrollmentId: docRef.id });
  
      console.log("Enrollment successful:", docRef.id);
      try {
        const response = await emailjs.send("service_u30tu6h", "template_5i66qbc", {
          to_email: email,
          userEmail: email,
          enrollmentId: docRef.id,
          paymentReference: reference,
          reply_to: "noreply",
          phoneNumber: phoneNumber,
        fullName: fullName,
        timestamp:new Date().toLocaleString(),
        interestReason: interestReason,


        });
        console.log("Email sent successfully:", response);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
  
      setSuccessMsg(true)
      setShowPopup(false);

  
      // Clear form inputs
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setInterestReason("");
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("Error submitting. Please try again.");
      setShowPopup(false);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="pagewidth">
      <div className="masterclass">
        {/*  */}
        <div className="masterclass-landing">
          <h1>Enroll Form</h1>
        </div>

        <div className="form-page">

            <div className="form-container">

            <div className="enroll-header">
            <h2>Join the Interior Design Masterclass</h2>
            <p>Transform your passion for interiors into expertise.</p>
            </div>
            
            <form onSubmit={handlePaystackPayment}>
      <input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Phone Number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Why are you interested in this course?"
        value={interestReason}
        onChange={(e) => setInterestReason(e.target.value)}
        required
      />

        <input
        type="number"
        placeholder="Enter Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <button type="button" onClick={handlePaystackPayment} disabled={loading}>
        {loading ? "Processing..." : "Proceed with payment"}
      </button>

      {error && <p style={{ color: 'red', fontSize: "12px" }}>{error}</p>}


    </form>

            </div>

            <div className="faqs">
            <h4> F.A.Q</h4>

            <div className="Faqs">

          <div className="acc-wrap">
            <div className="accordion">
              <div className="left">
                <div
                  className="item"
                  data-aos="fade-in"
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
                  data-aos="fade-in"
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
                  data-aos="fade-in"
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
                  data-aos="fade-in"
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
                  data-aos="fade-in"
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
                  data-aos="fade-in"
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

        {successMsg && (
        <div className="popup pop2">


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
                
                        <h2>Enrollment Succesful!</h2>
                
                
                        <p>A receipt of this transaction and further instructions has been sent to your email.</p>
                
                       <div className='buttons' onClick={()=> setSuccessMsg(false)}>
                            <NavLink>Continue</NavLink>
                        </div>
                
                          </div>
                          </div>
          


        </div>
      )}


    </div>

    
  );
}

export default Enroll;

