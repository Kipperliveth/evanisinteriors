import React from 'react';
import { NavLink } from 'react-router-dom';
import { Armchair, ArrowLeft } from 'lucide-react';

function NotFound() {
  return (
    <div className="furniture-404-wrapper">
      <div className="furniture-404-content">
        
        <div className="icon-wrapper">
          <Armchair size={56} strokeWidth={1} />
        </div>
        
        <h1>404</h1>
        <h2>This room is completely empty.</h2>
        <p>
          We couldn't find the piece you're looking for. The page might have been moved, 
          deleted, or perhaps it's just out of stock.
        </p>
        
        <NavLink to="/" className="showroom-btn">
          <ArrowLeft size={18} strokeWidth={1.5} />
          Back to Showroom
        </NavLink>
        
      </div>
    </div>
  );
}

export default NotFound;