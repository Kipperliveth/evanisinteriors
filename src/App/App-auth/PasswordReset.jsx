import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { MdOutlineMail } from "react-icons/md";
import { NavLink } from 'react-router-dom';
import { ImSpinner8 } from "react-icons/im";
import { BsArrowLeft } from "react-icons/bs";
import { BiErrorCircle, BiCheckCircle } from "react-icons/bi";
// import './PasswordReset.scss';

function PasswordReset() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setSuccessMessage('');

    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset link sent! Check your inbox.');
      setEmail(''); // Clear input on success
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === "auth/missing-email") {
        setMessage('No account found with that email address.');
      } else {
        console.error('Error sending password reset email:', error);
        setMessage('An error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-page-flat">
      <div className="reset-container">
        
        <div className="header-text">
          <h2>Forgot password?</h2>
          <p>No worries, we'll send you reset instructions.</p>
        </div>

        {/* Alert Messages */}
        {message && (
          <div className="alert alert-error">
            <BiErrorCircle className="alert-icon" />
            <p>{message}</p>
          </div>
        )}
        
        {successMessage && (
          <div className="alert alert-success">
            <BiCheckCircle className="alert-icon" />
            <p>{successMessage}</p>
          </div>
        )}

        <form onSubmit={handlePasswordReset}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <MdOutlineMail className="input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <button type="submit" disabled={isLoading} className={isLoading ? 'loading' : ''}>
            {isLoading ? (
              <ImSpinner8 className="spinner-icon" />
            ) : (
              "Reset password"
            )}
          </button>
        </form>

        <div className="footer-link">
          <NavLink to="/login" className="back-link">
            <BsArrowLeft className="arrow-icon" />
            Back to log in
          </NavLink>
        </div>

      </div>
    </div>
  );
}

export default PasswordReset;