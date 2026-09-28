import React, { useState, useEffect } from "react";
import UserNav from "../App-components/UserNav";
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, onSnapshot, query, where } from "firebase/firestore";
import { auth, txtdb } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { CiSearch } from "react-icons/ci";
import { MdCancel } from "react-icons/md";
import { BiGridAlt, BiCabinet } from "react-icons/bi";
import { MdOutlineChair, MdOutlineBed, MdOutlineTableBar, MdOutlineLightbulb } from "react-icons/md";
import { IoIosArrowBack, IoIosArrowUp } from "react-icons/io";
import { FaRegShareFromSquare, FaLink } from "react-icons/fa6";
import { useNavigate, useParams, useLocation } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function Shop() {
  const queryParam = useQuery();
  const initialCategory = queryParam.get("category") || "All";
  const { productId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Pagination & History
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Auth & Cart State
  const [currentUser, setCurrentUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  // Modal & Selection
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [mainImage, setMainImage] = useState("");

  // Toasts
  const [showPopup, setShowPopup] = useState(false);
  const [removedPopup, setremovedPopup] = useState(false);
  const [variationPopup, setVariationPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [buttonText, setButtonText] = useState("Copy Link");

  // 1. Listen for Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Catalog Data
  const getData = async () => {
    const valRef = collection(txtdb, "txtData");
    const dataDb = await getDocs(valRef);
    const allData = dataDb.docs.map((val) => ({ ...val.data(), id: val.id }));
    setData(allData);
    
    if (initialCategory === "All") {
      setFilteredData(allData);
    } else {
      setFilteredData(allData.filter(item => item.category.toLowerCase() === initialCategory.toLowerCase()));
    }
  };

  useEffect(() => {
    document.title = "Shop - Evanis Interiors";
    setIsLoading(true);
    getData().then(() => setIsLoading(false));
    
    const storedRecent = localStorage.getItem('evanis_recently_viewed');
    if (storedRecent) setRecentlyViewed(JSON.parse(storedRecent));
  }, []);

  // 3. HYBRID CART LISTENER
  useEffect(() => {
    if (currentUser) {
      // User is logged in: Listen to Firebase Cart
      const cartRef = collection(txtdb, `users/${currentUser.uid}/products`);
      const unsubscribe = onSnapshot(cartRef, (snapshot) => {
        setCartItems(snapshot.docs.map((doc) => ({ ...doc.data(), cartDocId: doc.id })));
      });
      return () => unsubscribe();
    } else {
      // Guest: Read from LocalStorage
      const guestCart = JSON.parse(localStorage.getItem("evanis_guest_cart")) || [];
      setCartItems(guestCart);
    }
  }, [currentUser]);

  // 4. HYBRID ADD TO CART LOGIC
  const handleAddToCartLogic = async (productData, colorVal, sizeVal, navigateAfter = false) => {
    // Variation Validation
    if (productData.color?.length > 0 && !colorVal) {
      handleProductClick(productData);
      setPopupMessage("Please select a color before adding to cart");
      setVariationPopup(true);
      setTimeout(() => setVariationPopup(false), 3000);
      return;
    }

    if (productData.sizes?.length > 0 && !sizeVal) {
      handleProductClick(productData);
      setPopupMessage("Please select a size before adding to cart");
      setVariationPopup(true);
      setTimeout(() => setVariationPopup(false), 3000);
      return;
    }

    const newItem = {
      imgUrl: productData.imgUrl,
      txtVal: productData.txtVal,
      desc: productData.desc,
      category: productData.category,
      price: productData.price,
      quantity: 1,
      color: colorVal || null,
      size: sizeVal || null,
      productnumber: productData.id,
      productId: productData.id, // for consistency
      isInStock: true
    };

    if (currentUser) {
      // LOGGED IN: Save to Firebase
      const userId = currentUser.uid;
      const existingItem = cartItems.find(item => 
        item.productnumber === productData.id && item.color === (colorVal || null) && item.size === (sizeVal || null)
      );

      try {
        if (existingItem) {
          const itemRef = doc(txtdb, `users/${userId}/products/${existingItem.cartDocId}`);
          await updateDoc(itemRef, { quantity: (existingItem.quantity || 1) + 1 });
        } else {
          const productRef = collection(txtdb, `users/${userId}/products`);
          const docRef = await addDoc(productRef, newItem);
          await updateDoc(doc(txtdb, `users/${userId}/products/${docRef.id}`), { productId: docRef.id });
        }
      } catch (error) {
        console.error("Error adding to Firebase cart:", error);
      }
    } else {
      // GUEST: Save to LocalStorage
      let guestCart = JSON.parse(localStorage.getItem("evanis_guest_cart")) || [];
      const existingIndex = guestCart.findIndex(item => 
        item.productnumber === productData.id && item.color === (colorVal || null) && item.size === (sizeVal || null)
      );

      if (existingIndex >= 0) {
        guestCart[existingIndex].quantity += 1;
      } else {
        guestCart.push(newItem);
      }
      localStorage.setItem("evanis_guest_cart", JSON.stringify(guestCart));
      setCartItems([...guestCart]); // Trigger re-render
    }

    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
    if (navigateAfter) navigate('/cart');
  };

  // 5. HYBRID REMOVE FROM CART LOGIC
  const removeFromCart = async (catalogProductId, colorVal = undefined, sizeVal = undefined) => {
    if (currentUser) {
      // LOGGED IN: Remove from Firebase
      const cartRef = collection(txtdb, `users/${currentUser.uid}/products`);
      const querySnapshot = await getDocs(cartRef);
      querySnapshot.forEach((document) => {
        const d = document.data();
        if ((d.productnumber === catalogProductId || d.productId === catalogProductId) &&
            (colorVal === undefined || d.color === colorVal) &&
            (sizeVal === undefined || d.size === sizeVal)) {
          deleteDoc(document.ref);
        }
      });
    } else {
      // GUEST: Remove from LocalStorage
      let guestCart = JSON.parse(localStorage.getItem("evanis_guest_cart")) || [];
      guestCart = guestCart.filter(item => {
        const isMatch = (item.productnumber === catalogProductId || item.productId === catalogProductId) &&
                        (colorVal === undefined || item.color === colorVal) &&
                        (sizeVal === undefined || item.size === sizeVal);
        return !isMatch; // Keep items that don't match
      });
      localStorage.setItem("evanis_guest_cart", JSON.stringify(guestCart));
      setCartItems([...guestCart]);
    }
    setremovedPopup(true);
    setTimeout(() => setremovedPopup(false), 3000);
  };

  // Search & Filtering
  const handleSearchClick = () => {
    const filtered = data.filter((value) => value.txtVal && value.txtVal.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    if (category === "All") {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter((item) => item.category === category));
    }
    setCurrentPage(1);
  };

  // Modal Handling
  const handleProductClick = (productData) => {
    setIsProductModalOpen(true);
    setSelectedProductData(productData);
    setMainImage(Array.isArray(productData.imgUrl) ? productData.imgUrl[0] : productData.imgUrl);
    setSelectedColor(null);
    setSelectedSize(null);

    setRecentlyViewed(prev => {
      const filtered = prev.filter(item => item.id !== productData.id);
      const updated = [productData, ...filtered].slice(0, 10);
      localStorage.setItem('evanis_recently_viewed', JSON.stringify(updated));
      return updated;
    });
    window.history.pushState(null, '', `/shop/${productData.id}`);
  };

  const handleCloseModal = () => {
    setIsProductModalOpen(false);
    setSelectedProductData(null);
    window.history.pushState(null, '', `/shop`);
  };

  useEffect(() => {
    if (productId && data.length > 0) {
      const product = data.find((item) => item.id === productId);
      if (product) handleProductClick(product);
    }
  }, [productId, data]);

  // UI Helpers
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setButtonText("Copied!");
      setTimeout(() => setButtonText("Copy Link"), 3000);
    });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="editorial-store-wrapper">
      <UserNav />

      <div className="store-main-container page">
        <div className="store-hero-section">
          <div className="editorial-search">
            <CiSearch className="search-icon" />
            <input
              className="searchInput"
              type="text"
              placeholder="Search for premium furniture..."
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
            />
            <button className="search-action-btn" onClick={handleSearchClick}>Search</button>
          </div>

          <div className="editorial-categories">
            {[
              { name: "All", icon: <BiGridAlt /> },
              { name: "Sitting", icon: <MdOutlineChair /> },
              { name: "Tables", icon: <MdOutlineTableBar /> },
              { name: "Room", icon: <MdOutlineBed /> },
              { name: "Lights", icon: <MdOutlineLightbulb /> },
              { name: "Storage", icon: <BiCabinet /> }
            ].map((cat) => (
              <button 
                key={cat.name} 
                className={`category-pill ${selectedCategory === cat.name ? "active" : ""}`}
                onClick={() => handleCategoryClick(cat.name)}
              >
                <span className="icon">{cat.icon}</span>
                <p>{cat.name}</p>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="editorial-grid">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div className="editorial-product-card skeleton" key={idx}>
                <div className="card-image-box skeleton-img"></div>
                <div className="card-details">
                  <div className="skeleton-text title"></div>
                  <div className="skeleton-text desc"></div>
                  <div className="card-bottom">
                    <div className="skeleton-text price"></div>
                    <div className="skeleton-btn"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="editorial-grid">
              {currentData.length > 0 ? (
                currentData.map((product) => {
                  const isInCart = cartItems.some(item => item.productnumber === product.id || item.productId === product.id);
                  
                  return (
                    <div className="editorial-product-card" key={product.id}>
                      <div className="card-image-box" onClick={() => handleProductClick(product)}>
                        <img src={Array.isArray(product.imgUrl) ? product.imgUrl[0] : product.imgUrl} alt={product.txtVal} />
                      </div>
                      
                      <div className="card-details">
                        <h2 className="product-name" onClick={() => handleProductClick(product)}>{product.txtVal}</h2>
                        <p className="product-description">{product.desc}</p>
                        
                        <div className="card-bottom">
                          <p className="product-price">&#8358;&nbsp;{parseFloat(product.price).toLocaleString('en-US')}</p>
                          
                          {isInCart ? (
                            <button className="pill-btn remove" onClick={() => removeFromCart(product.id)}>Remove</button>
                          ) : product.isInStock ? (
                            <button className="pill-btn add" onClick={() => handleAddToCartLogic(product, null, null, false)}>Add to Cart</button>
                          ) : (
                            <button className="pill-btn sold-out" disabled>Sold Out</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-results">
                  <p>No products found matching your search.</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <button className="page-nav-btn" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Prev</button>
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button key={pageNum} className={`page-num-btn ${currentPage === pageNum ? "active" : ""}`} onClick={() => setCurrentPage(pageNum)}>
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button className="page-nav-btn" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
              </div>
            )}
          </>
        )}

        {/* PRODUCT MODAL */}
        <div className={`product-modal ${isProductModalOpen ? "open" : ""}`}>
          {selectedProductData && (
            <div className="popup-details">
              <div className="modal-header">
                <button className="close-btn" onClick={handleCloseModal}>
                  <IoIosArrowBack /> Back to Store
                </button>
              </div>

              <div className="modal-body-container">
                <div className="modal-top-row">
                  <div className="modal-left-gallery">
                    <div className="main-image">
                      <img src={mainImage} alt={selectedProductData.txtVal} />
                    </div>
                    {Array.isArray(selectedProductData.imgUrl) && selectedProductData.imgUrl.length > 1 && (
                      <div className="thumbnail-row">
                        {selectedProductData.imgUrl.map((url, index) => (
                          <div className={`thumb-box ${mainImage === url ? 'active' : ''}`} key={index} onClick={() => setMainImage(url)}>
                            <img src={url} alt={`View ${index + 1}`} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="modal-right-info">
                    <div className="breadcrumbs">
                      Home / {selectedProductData.category} / <span>{selectedProductData.txtVal}</span>
                    </div>

                    <div className="header-actions">
                       <h2 className="modal-title">{selectedProductData.txtVal}</h2>
                       <button className="share-btn-icon" onClick={handleShare} title={buttonText}><FaRegShareFromSquare /></button>
                    </div>
                    
                    <p className="modal-price">&#8358; {parseFloat(selectedProductData.price).toLocaleString('en-us')}</p>

                    <div className="modal-desc-box">
                      <h4>Description</h4>
                      <p>{selectedProductData.desc}</p>
                    </div>

                    {(selectedProductData.color?.length > 0 || selectedProductData.sizes?.length > 0) && (
                      <div className="variations-wrapper">
                        {selectedProductData.color?.length > 0 && (
                          <div className="variation-block">
                            <h4>Colors</h4>
                            <div className="variation-group">
                              {selectedProductData.color.map((color) => (
                                <button onClick={() => setSelectedColor(color)} className={`variation-pill ${selectedColor === color ? 'active' : ''}`} key={color}>
                                  {color}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedProductData.sizes?.length > 0 && (
                          <div className="variation-block">
                            <h4>Sizes</h4>
                            <div className="variation-group">
                              {selectedProductData.sizes.map((size) => (
                                <button onClick={() => setSelectedSize(size)} className={`variation-pill ${selectedSize === size ? 'active' : ''}`} key={size}>
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
               
                    {(() => {
                      const isCurrentVariationInCart = cartItems.some(item => 
                        (item.productnumber === selectedProductData.id || item.productId === selectedProductData.id) &&
                        (item.color || null) === (selectedColor || null) &&
                        (item.size || null) === (selectedSize || null)
                      );

                      return (
                        <div className="modal-actions-container">
                          {isCurrentVariationInCart && (
                            <p className="cart-subtle-text"><span>✓</span> Added to cart. Go to cart to adjust quantity.</p>
                          )}

                          <div className="modal-actions-row">
                            {selectedProductData.isInStock ? (
                              isCurrentVariationInCart ? (
                                <button className="action-btn buy-now full-width" onClick={() => navigate('/cart')}>Go to Cart</button>
                              ) : (
                                <>
                                  <button className="action-btn buy-now" onClick={() => handleAddToCartLogic(selectedProductData, selectedColor, selectedSize, true)}>Buy Now</button>
                                  <button className="action-btn add-to-cart" onClick={() => handleAddToCartLogic(selectedProductData, selectedColor, selectedSize, false)}>Add to Cart</button>
                                </>
                              )
                            ) : (
                              <button className="action-btn sold-out full-width" disabled>Sold Out</button>
                            )}

                            {isCurrentVariationInCart && (
                              <button className="action-btn remove-cart" onClick={() => removeFromCart(selectedProductData.id, selectedColor, selectedSize)}>Remove</button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TOASTS */}
        {showPopup && (
          <div className="status-toast success">
            <div className="toast-content" onClick={() => setShowPopup(false)}>
              <MdCancel className='icon' /> Item added to cart
            </div>
          </div>
        )}

        {variationPopup && (
          <div className="status-toast warning">
            <div className="toast-content" onClick={() => setVariationPopup(false)}>
              <MdCancel className='icon' /> {popupMessage}
            </div>
          </div>
        )}

        {removedPopup && (
          <div className="status-toast error">
            <div className="toast-content" onClick={() => setremovedPopup(false)}>
              <MdCancel className='icon' /> Item removed from cart
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Shop;