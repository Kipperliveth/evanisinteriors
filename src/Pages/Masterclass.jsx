import React from "react";
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { BsBoxArrowUpRight } from "react-icons/bs";
import { LiaChalkboardTeacherSolid } from "react-icons/lia";
import { FaPeopleArrows, FaHelmetSafety } from "react-icons/fa6";
import { FaHandHolding } from "react-icons/fa";
import { TbBrandZoom, TbStretching2 } from "react-icons/tb";
import { TbTimeDuration30 } from "react-icons/tb";
import {
  MdOutlineAttachMoney,
  MdSchedule,
  MdOutlineAssessment,
  MdOutlineConnectWithoutContact,
} from "react-icons/md";
import { GrUserExpert } from "react-icons/gr";
import { BiSupport } from "react-icons/bi";
import "aos/dist/aos.css";
import AOS from "aos";
import "aos/dist/aos.js";

function Masterclass() {
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

  return (
    <div className="pagewidth">
      <div className="masterclass">
        {/*  */}
        <div className="masterclass-landing">
          <h1>Join our Masterclass</h1>
        </div>

        <div className="masterclass-enroll">
          <div className="enroll-left">
            <h1
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay="600"
              data-aos-once="true"
            >
              <span>Master</span> the Art of Interior <span>Design</span> with
              Our Certified Masterclass.
            </h1>
            <p
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay="600"
              data-aos-once="true"
            >
              Ready to transform your passion for design into a rewarding
              career? Our immersive masterclass welcomes everyone, from aspiring
              designers to seasoned professionals seeking to refresh their
              skills and knowledge. Whether you're dreaming of designing your
              own space or starting a design business, this comprehensive
              program equips you with the tools and guidance needed to succeed.
            </p>

            <div
              className="class-cta"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="600"
              data-aos-once="true"
            >
              <NavLink to='/masterclass/enroll'>Enroll Now</NavLink>

              <NavLink>
                <p>Login to Dashboard</p> <BsBoxArrowUpRight />
              </NavLink>
            </div>
          </div>
          <div
            className="enroll-right"
            data-aos="zoom-in-left"
            data-aos-duration="1000"
            data-aos-delay="600"
            data-aos-once="true"
          >
            {" "}
          </div>
        </div>

        <div className="masterclass-details">
          <h1
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="600"
            data-aos-once="true"
          >
            What you'll <span>Learn</span>
          </h1>

          <div className="m-learn">
            <div
              className="learn-box"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="700"
              data-aos-once="true"
            >
              <FaHandHolding className="learn-icon" />

              <h3>Hands-on Learning</h3>

              <p>
                Apply your knowledge through practical exercises and real-world
                project examples, gaining valuable experience under the expert
                guidance of our instructor.
              </p>
            </div>

            <div
              className="learn-box"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="900"
              data-aos-once="true"
            >
              <LiaChalkboardTeacherSolid className="learn-icon" />

              <h3>Modern Interior Design Principles</h3>

              <p>
                Delve into the latest trends, styles, and techniques in interior
                design, covering color theory, space planning, furniture
                selection, and sustainable design practices.
              </p>
            </div>

            <div
              className="learn-box"
              data-aos="fade-up"
              data-aos-duration="400"
              data-aos-delay="1000"
              data-aos-once="true"
            >
              <FaPeopleArrows className="learn-icon" />

              <h3>Personalized Feedback</h3>

              <p>
                Benefit from regular feedback and personalized mentoring through
                interactive Zoom meetings with your instructor, ensuring you
                grasp each concept thoroughly.
              </p>
            </div>
          </div>
        </div>

        <div className="masterclass-structure">
          <h1
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="300"
            data-aos-once="true"
          >
            Course Structure
          </h1>

          <div className="structure-container">
            <div className="structure-left">
              <div
                className="big-img"
                data-aos="zoom-in-left"
                data-aos-duration="800"
                data-aos-delay="600"
                data-aos-once="true"
              ></div>
              <span>
                <div
                  className="small-img1"
                  data-aos="zoom-in-down"
                  data-aos-duration="800"
                  data-aos-delay="600"
                  data-aos-once="true"
                ></div>
                <div
                  className="small-img2"
                  data-aos="zoom-in-up"
                  data-aos-duration="800"
                  data-aos-delay="500"
                  data-aos-once="true"
                ></div>
              </span>
            </div>
            <div className="structure-right">
              <div
                className="structure-box"
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-delay="300"
                data-aos-once="true"
              >
                <TbBrandZoom className="structure-icon" />
                <div className="structure-dets">
                  <h3>Format</h3>
                  <p>
                    Engaging and interactive Zoom meetings where you can
                    actively participate and ask questions.
                  </p>
                </div>
              </div>

              <div
                className="structure-box"
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-delay="300"
                data-aos-once="true"
              >
                <MdSchedule className="structure-icon" />
                <div className="structure-dets">
                  <h3>Schedule</h3>
                  <p>
                    Evening sessions held every day (specific timings to be
                    confirmed)
                  </p>
                </div>
              </div>
              <div
                className="structure-box"
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-delay="300"
                data-aos-once="true"
              >
                <MdOutlineAssessment className="structure-icon" />
                <div className="structure-dets">
                  <h3>Assessment</h3>
                  <p>
                    Quizzes after each session to solidify your understanding.
                  </p>
                </div>
              </div>
              <div
                className="structure-box"
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-delay="300"
                data-aos-once="true"
              >
                <MdOutlineAttachMoney className="structure-icon" />
                <div className="structure-dets">
                  <h3>Cost</h3>
                  <p>₦25,000 per month/class</p>
                </div>
              </div>

              <div
                className="structure-box"
                data-aos="fade-up"
                data-aos-duration="800"
                data-aos-delay="300"
                data-aos-once="true"
              >
                <TbTimeDuration30 className="structure-icon" />
                <div className="structure-dets">
                  <h3>Duration </h3>
                  <p>1 month</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="masterclass-benefits">
          <h1
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="300"
            data-aos-once="true"
          >
            <span>Benfits</span> you'll Enjoy
          </h1>
          <div className="benefits-container">
            <div
              className="benefit-box"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="300"
              data-aos-once="true"
            >
              <GrUserExpert className="benfit-icon" />
              <h3>Expert Instruction</h3>
              <p>
                Learn from a renowned interior design professional with
                extensive experience and industry knowledge.
              </p>
            </div>
            <div
              className="benefit-box"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="400"
              data-aos-once="true"
            >
              <TbStretching2 className="benfit-icon" />
              <h3>Flexible Learning</h3>
              <p>
                Enjoy the convenience of evening sessions that fit into your
                busy schedule.
              </p>
            </div>
            <div
              className="benefit-box"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="500"
              data-aos-once="true"
            >
              <BiSupport className="benfit-icon" />
              <h3>Personalized Support</h3>
              <p>
                Receive tailored feedback and guidance to optimize your learning
                experience.
              </p>
            </div>
            <div
              className="benefit-box"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="600"
              data-aos-once="true"
            >
              <MdOutlineConnectWithoutContact className="benfit-icon" />
              <h3>Community Connection</h3>
              <p>
                Connect with fellow students and build a network of passionate
                designers.
              </p>
            </div>
            <div
              className="benefit-box"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="700"
              data-aos-once="true"
            >
              <FaHelmetSafety className="benfit-icon" />
              <h3>Career-Ready</h3>
              <p>
                Gain the skills and confidence to pursue your design
                aspirations, whether launching your own business or landing your
                dream job.
              </p>
            </div>
          </div>
        </div>

        <div className="next-step">
          <h1
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="400"
            data-aos-once="true"
          >
            Ready to Take the <span>Next Step?</span>
          </h1>
          <p
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="500"
            data-aos-once="true"
          >
            Enroll today and embark on your journey to becoming a skilled and
            sought-after interior designer. Contact us to learn more and secure
            your spot in the next session!
          </p>
          <div
            className="next-links"
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="600"
            data-aos-once="true"
          >
            <NavLink to='/masterclass/enroll'>Enroll Here</NavLink>
            <NavLink>Contact Us</NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Masterclass;
