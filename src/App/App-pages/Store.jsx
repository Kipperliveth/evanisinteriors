import { useState, useEffect, useRef } from "react";
import React from "react";
import UserNav from "../App-components/UserNav";
import {
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc, updateDoc, setDoc,
  onSnapshot, query, where
} from "firebase/firestore";
import { CiSearch } from "react-icons/ci";

import { auth, txtdb } from "../../firebase-config";
import { onAuthStateChanged } from "firebase/auth";
import { IoIosArrowBack, IoIosArrowForward, IoIosArrowUp } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";
import { MdCancel, MdClose } from "react-icons/md";
import { FaRegShareFromSquare, FaHeart, FaRegHeart } from "react-icons/fa6";


// Order of the category filter in the store (these are the categories admins can pick in Post.jsx).
// All of them always show, even before any products have been uploaded to a category.
const STORE_CATEGORIES = [
  "Sitting",
  "Accent Chairs",
  "Dining",
  "Tables",
  "Console",
  "Credenza",
  "Storage",
  "Bedsides",
  "Room",
  "Vanity",
  "Concierge Desks",
  "Lights",
];

function Store() {
  const { productId } = useParams();

  const [showPopup, setShowPopup] = useState(false);
  const [removedPopup, setremovedPopup] = useState(false);
  const [variationPopup, setVariationPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categoryRailRef = useRef(null);
  const [railArrows, setRailArrows] = useState({ left: false, right: false });

  const [data, setData] = useState([]);

  // Pagination & History State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20; 
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Modal & Selection State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  
  // Image states and Loading Tracking
  const [mainImage, setMainImage] = useState("");
  const [mainImageLoading, setMainImageLoading] = useState(true);
  const [thumbLoadingStats, setThumbLoadingStats] = useState({});

  // HYBRID CART STATE
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // SAVED PRODUCTS STATE (list of saved product ids)
  const [savedIds, setSavedIds] = useState([]);
  const [savedMessage, setSavedMessage] = useState("");
  const [loginPrompt, setLoginPrompt] = useState(false);

  // Load recently viewed from local storage on mount
  useEffect(() => {
    const storedRecent = localStorage.getItem('evanis_recently_viewed');
    if (storedRecent) {
      setRecentlyViewed(JSON.parse(storedRecent));
    }
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isProductModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isProductModalOpen]);

  // HYBRID CART LISTENER (Auth + Firebase / LocalStorage)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);
      
      if (user) {
        // Logged-in User: Listen to Firebase Cart
        const cartRef = collection(txtdb, `users/${user.uid}/products`);
        const unsubscribeCart = onSnapshot(cartRef, (snapshot) => {
          setCartItems(snapshot.docs.map((doc) => ({ ...doc.data(), cartDocId: doc.id })));
        });
        return () => unsubscribeCart();
      } else {
        // Guest: Read from LocalStorage
        const fetchGuestCart = () => {
          const guestCart = JSON.parse(localStorage.getItem("evanis_guest_cart")) || [];
          setCartItems(guestCart);
        };
        fetchGuestCart();
        
        // Listen to cross-tab updates to keep the store instantly in sync
        window.addEventListener('storage', fetchGuestCart);
        return () => window.removeEventListener('storage', fetchGuestCart);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // SAVED LISTENER (logged-in users only)
  useEffect(() => {
    if (!currentUser) {
      setSavedIds([]);
      return;
    }

    // saved products live at users/{uid}/saved/{productId}
    const savedRef = collection(txtdb, `users/${currentUser.uid}/saved`);
    const unsubscribeSaved = onSnapshot(savedRef, (snapshot) => {
      setSavedIds(snapshot.docs.map((d) => d.id));
    });
    return () => unsubscribeSaved();
  }, [currentUser]);

  // SAVE / UNSAVE TOGGLE (requires login)
  const toggleSaved = async (productId) => {
    if (!authChecked) return; // still finding out whether someone is logged in

    if (!currentUser) {
      setLoginPrompt(true);
      setTimeout(() => setLoginPrompt(false), 4000);
      return;
    }

    const alreadySaved = savedIds.includes(productId);
    const savedDocRef = doc(txtdb, `users/${currentUser.uid}/saved/${productId}`);

    try {
      if (alreadySaved) {
        await deleteDoc(savedDocRef);
      } else {
        await setDoc(savedDocRef, { productId, savedAt: Date.now() });
      }
    } catch (error) {
      console.error("Error updating saved products:", error);
      return;
    }

    setSavedMessage(alreadySaved ? "Removed from saved" : "Saved for later");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  // HYBRID ADD TO CART LOGIC
  const handleAddToCartLogic = async (productData, colorVal, sizeVal, navigateAfter = false) => {
    // Variations Validation
    if (productData.color?.length > 0 && !colorVal) {
      handleProductClick(productData);
      setPopupMessage("Please choose a color");
      setVariationPopup(true);
      setTimeout(() => setVariationPopup(false), 3000);
      return;
    }

    if (productData.sizes?.length > 0 && !sizeVal) {
      handleProductClick(productData);
      setPopupMessage("Please choose a size");
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
      productId: productData.id,
      isInStock: true
    };

    if (currentUser) {
      // FIREBASE (LOGGED IN USER)
      const userId = currentUser.uid;
      const existingItem = cartItems.find(item => 
        (item.productnumber === productData.id || item.productId === productData.id) &&
        (item.color || null) === (colorVal || null) &&
        (item.size || null) === (sizeVal || null)
      );

      try {
        if (existingItem) {
          const itemRef = doc(txtdb, `users/${userId}/products/${existingItem.cartDocId || existingItem.productId}`);
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
      // LOCALSTORAGE (GUEST USER)
      let guestCart = JSON.parse(localStorage.getItem("evanis_guest_cart")) || [];
      const existingIndex = guestCart.findIndex(item => 
        (item.productnumber === productData.id || item.productId === productData.id) &&
        (item.color || null) === (colorVal || null) &&
        (item.size || null) === (sizeVal || null)
      );

      if (existingIndex >= 0) {
        guestCart[existingIndex].quantity += 1;
      } else {
        guestCart.push(newItem);
      }
      
      localStorage.setItem("evanis_guest_cart", JSON.stringify(guestCart));
      setCartItems([...guestCart]); 
      window.dispatchEvent(new Event('storage')); // Force navbar update
    }

    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
    if (navigateAfter) navigate('/cart');
  };

  // HYBRID REMOVE FROM CART LOGIC
  const removeFromCart = async (catalogProductId, colorVal = undefined, sizeVal = undefined) => {
    if (currentUser) {
      // FIREBASE (LOGGED IN USER)
      const userId = currentUser.uid;
      const cartRef = collection(txtdb, `users/${userId}/products`);
      try {
        const querySnapshot = await getDocs(cartRef);
        querySnapshot.forEach((document) => {
          const data = document.data();
          const matchId = data.productnumber === catalogProductId || data.productId === catalogProductId;
          const matchColor = colorVal !== undefined ? (data.color || null) === (colorVal || null) : true;
          const matchSize = sizeVal !== undefined ? (data.size || null) === (sizeVal || null) : true;

          if (matchId && matchColor && matchSize) {
            deleteDoc(document.ref);
          }
        });
      } catch (error) {
        console.error("Error removing product from Firebase:", error);
      }
    } else {
      // LOCALSTORAGE (GUEST USER)
      let guestCart = JSON.parse(localStorage.getItem("evanis_guest_cart")) || [];
      guestCart = guestCart.filter(item => {
        const matchId = item.productnumber === catalogProductId || item.productId === catalogProductId;
        const matchColor = colorVal !== undefined ? (item.color || null) === (colorVal || null) : true;
        const matchSize = sizeVal !== undefined ? (item.size || null) === (sizeVal || null) : true;
        return !(matchId && matchColor && matchSize);
      });
      
      localStorage.setItem("evanis_guest_cart", JSON.stringify(guestCart));
      setCartItems([...guestCart]);
      window.dispatchEvent(new Event('storage')); // Force navbar update
    }

    setremovedPopup(true);
    setTimeout(() => setremovedPopup(false), 3000);
  };
    
  const handleProductClick = (productData) => {
    setIsProductModalOpen(true);
    setSelectedProductData(productData); 
    
    // Reset Loading states
    setMainImageLoading(true);
    setThumbLoadingStats({});
    
    const initialImg = Array.isArray(productData.imgUrl) ? productData.imgUrl[0] : productData.imgUrl;
    setMainImage(initialImg);
    setSelectedColor(null);
    setSelectedSize(null);

    setRecentlyViewed(prev => {
      const filteredList = prev.filter(item => item.id !== productData.id);
      const updatedList = [productData, ...filteredList].slice(0, 10);
      localStorage.setItem('evanis_recently_viewed', JSON.stringify(updatedList));
      return updatedList;
    });

    window.history.pushState(null, '', `/store/${productData.id}`);
  };

  const handleCloseModal = () => {
    setIsProductModalOpen(false);
    setSelectedProductData(null); 
    window.history.pushState(null, '', `/store`);
  };

  const getData = async () => {
    const valRef = collection(txtdb, "txtData");
    const dataDb = await getDocs(valRef);
    const allData = dataDb.docs.map((val) => ({ ...val.data(), id: val.id }));
    setData(allData);
    setFilteredData(allData);
  };

  useEffect(() => {
    document.title = "Store - Evanis Interiors";
    setIsLoading(true); 
    getData().then(() => {
      setIsLoading(false); 
    });
  }, []);

  // Search + category work together, so results always reflect both filters
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = data.filter((item) => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesSearch =
        !term ||
        (item.txtVal && item.txtVal.toLowerCase().includes(term)) ||
        (item.category && item.category.toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [data, searchTerm, selectedCategory]);

  const handleCategoryClick = (category, e) => {
    setSelectedCategory(category);
    // Keep the chosen chip in view when the row is scrolled
    e?.currentTarget?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
  };

  // Category row: show the arrows only when there is more to scroll to
  const updateRailArrows = () => {
    const el = categoryRailRef.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setRailArrows((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  };

  const scrollRail = (direction) => {
    categoryRailRef.current?.scrollBy({ left: direction * 280, behavior: "smooth" });
  };

  useEffect(() => {
    updateRailArrows();
    window.addEventListener("resize", updateRailArrows);
    return () => window.removeEventListener("resize", updateRailArrows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isLoading]);

  // Every category is always listed; counts show how many products each has right now
  const categoryCounts = data.reduce((acc, item) => {
    if (item.category) acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const allCategories = [
    ...STORE_CATEGORIES,
    ...Object.keys(categoryCounts).filter((c) => !STORE_CATEGORIES.includes(c)),
  ];

  function handleColorSelect(color) {
    setSelectedColor(color);
  }
  function handleSizeSelect(size) {
    setSelectedSize(size);
  }

  // Opens popup on direct URL visit
  useEffect(() => {
    if (productId && data.length > 0) {
      const product = data.find((item) => item.id === productId);
      if (product) {
        setSelectedProductData(product);
        setMainImageLoading(true);
        setThumbLoadingStats({});
        const initialImg = Array.isArray(product.imgUrl) ? product.imgUrl[0] : product.imgUrl;
        setMainImage(initialImg);
        setIsProductModalOpen(true); 
      }
    }
  }, [productId, data]);

  const [buttonText, setButtonText] = useState("Copy Link"); 
  const shareLink = window.location.href; 

  const handleShare = () => {
    navigator.clipboard.writeText(shareLink) 
      .then(() => {
        setButtonText("Copied!"); 
        setTimeout(() => {
          setButtonText("Copy Link");
        }, 3000);
      })
      .catch((err) => {
        console.error('Failed to copy the link', err);
      });
  };

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if(!isProductModalOpen){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="editorial-store-wrapper">
      {/* RENDER USERNAV ONLY IF LOGGED IN */}
      {currentUser && <UserNav />}

      <div className="store-main-container page">

        <div className="store-hero-section">
          <div className="editorial-search">
            <CiSearch className="search-icon" />
            <input
              className="searchInput"
              type="text"
              placeholder="Search furniture, lighting, decor..."
              aria-label="Search products"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setSearchTerm("")}
            />
            {searchTerm && (
              <button className="search-clear-btn" onClick={() => setSearchTerm("")} aria-label="Clear search">
                <MdClose />
              </button>
            )}
          </div>

          <div className={`category-rail ${railArrows.left ? "has-left" : ""} ${railArrows.right ? "has-right" : ""}`}>
            {railArrows.left && (
              <button className="rail-arrow left" onClick={() => scrollRail(-1)} aria-label="Scroll categories left">
                <IoIosArrowBack />
              </button>
            )}

            <div className="editorial-categories" ref={categoryRailRef} onScroll={updateRailArrows}>
              {["All", ...allCategories].map((cat) => {
                const count = cat === "All" ? data.length : categoryCounts[cat] || 0;
                const isEmpty = !isLoading && count === 0;
                return (
                  <button
                    key={cat}
                    className={`category-pill ${selectedCategory === cat ? "active" : ""} ${isEmpty ? "empty" : ""}`}
                    aria-pressed={selectedCategory === cat}
                    onClick={(e) => handleCategoryClick(cat, e)}
                  >
                    {cat}
                    {!isLoading && !isEmpty && <span className="count">{count}</span>}
                  </button>
                );
              })}
            </div>

            {railArrows.right && (
              <button className="rail-arrow right" onClick={() => scrollRail(1)} aria-label="Scroll categories right">
                <IoIosArrowForward />
              </button>
            )}
          </div>
        </div>

        <div className="collection-heading">
          <h2 className="collection-title">{selectedCategory === "All" ? "All Pieces" : selectedCategory}</h2>
          {!isLoading && (
            <>
              <span className="divider" />
              <span className="collection-meta">
                {filteredData.length} {filteredData.length === 1 ? "piece" : "pieces"}
                {searchTerm.trim() && <> for &ldquo;{searchTerm.trim()}&rdquo;</>}
              </span>
            </>
          )}
          {(searchTerm.trim() || selectedCategory !== "All") && (
            <button className="clear-filters-btn" onClick={clearFilters}>Clear filters</button>
          )}
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
                  // Check if item exists in hybrid cart
                  const isInCart = cartItems.some((item) => item.productId === product.id || item.productnumber === product.id);
                  const isSaved = savedIds.includes(product.id);
                  
                  return (
                    <div className="editorial-product-card" key={product.id}>
                      <div className="card-image-box" onClick={() => handleProductClick(product)}>
                        <img src={Array.isArray(product.imgUrl) ? product.imgUrl[0] : product.imgUrl} alt="product" />
                        <button
                          className={`save-btn ${isSaved ? "active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaved(product.id);
                          }}
                          title={isSaved ? "Remove from saved" : "Save for later"}
                          aria-label={isSaved ? "Remove from saved" : "Save for later"}
                        >
                          {isSaved ? <FaHeart /> : <FaRegHeart />}
                        </button>
                      </div>
                      
                      <div className="card-details">
                        <h2 className="product-name" onClick={() => handleProductClick(product)}>
                          {product.txtVal}
                        </h2>
                        <p className="product-description">{product.desc}</p>
                        
                        <div className="card-bottom">
                          <p className="product-price">
                            &#8358;&nbsp;{parseFloat(product.price).toLocaleString('en-US')}
                          </p>
                          
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
                  <p>
                    {searchTerm.trim()
                      ? "No products found matching your search."
                      : `No ${selectedCategory} pieces yet. New items are added regularly, so check back soon.`}
                  </p>
                  <button className="clear-filters-btn" onClick={clearFilters}>View all pieces</button>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <button 
                  className="page-nav-btn" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`page-num-btn ${currentPage === pageNum ? "active" : ""}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button 
                  className="page-nav-btn" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}

            {recentlyViewed.length > 0 && (
              <div className="recently-viewed-section">
                <h3 className="section-title">Recently Viewed</h3>
                <div className="recently-viewed-track">
                  {recentlyViewed.map(product => (
                    <div className="recent-card" key={`recent-${product.id}`} onClick={() => handleProductClick(product)}>
                      <div className="recent-img-box">
                        <img src={Array.isArray(product.imgUrl) ? product.imgUrl[0] : product.imgUrl} alt={product.txtVal} />
                      </div>
                      <div className="recent-info">
                        <p className="recent-name">{product.txtVal}</p>
                        <p className="recent-price">&#8358;&nbsp;{parseFloat(product.price).toLocaleString('en-US')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="back-to-top-container">
              <button className="back-to-top-btn" onClick={scrollToTop}>
                Back to top <IoIosArrowUp className="icon" />
              </button>
            </div>
          </>
        )}

        {/* MODAL */}
        <div className={`product-modal ${isProductModalOpen ? "open" : ""}`}>
          {selectedProductData && (
            <div className="popup-details">

              <div className="modal-header">
                <button className="close-btn" onClick={handleCloseModal}>
                  <IoIosArrowBack /> Back
                </button>
              </div>

              <div className="modal-body-container">
                
                <div className="modal-top-row">
                  
                  <div className="modal-left-gallery">
                    <div className="main-image">
                      {mainImageLoading && <div className="modal-img-skeleton"></div>}
                      <img 
                        src={mainImage} 
                        alt={selectedProductData.txtVal} 
                        onLoad={() => setMainImageLoading(false)}
                        style={{ display: mainImageLoading ? 'none' : 'block' }}
                      />
                    </div>
                    {selectedProductData.imgUrl && Array.isArray(selectedProductData.imgUrl) && selectedProductData.imgUrl.length > 1 && (
                      <div className="thumbnail-row">
                        {selectedProductData.imgUrl.map((url, index) => (
                          <div 
                            className={`thumb-box ${mainImage === url ? 'active' : ''}`} 
                            key={index}
                            onClick={() => {
                              if (mainImage !== url) {
                                setMainImageLoading(true);
                                setMainImage(url);
                              }
                            }}
                          >
                            {!thumbLoadingStats[index] && <div className="thumb-img-skeleton"></div>}
                            <img 
                              src={url} 
                              alt={`View ${index + 1}`} 
                              onLoad={() => setThumbLoadingStats(prev => ({...prev, [index]: true}))}
                              style={{ display: thumbLoadingStats[index] ? 'block' : 'none' }}
                            />
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
                       <div className="header-icon-group">
                         <button
                           className={`save-btn-icon ${savedIds.includes(selectedProductData.id) ? "active" : ""}`}
                           onClick={() => toggleSaved(selectedProductData.id)}
                           title={savedIds.includes(selectedProductData.id) ? "Remove from saved" : "Save for later"}
                         >
                           {savedIds.includes(selectedProductData.id) ? <FaHeart /> : <FaRegHeart />}
                         </button>
                         <button className="share-btn-icon" onClick={handleShare} title={buttonText}>
                           <FaRegShareFromSquare />
                         </button>
                       </div>
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
                            <h4>{selectedProductData.color.length} Colors Available</h4>
                            <div className="variation-group">
                              {selectedProductData.color.map((color) => (
                                <button  
                                  onClick={() => handleColorSelect(color)} 
                                  className={`variation-pill ${selectedColor === color ? 'active' : ''}`} 
                                  key={color}
                                >
                                  {color}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedProductData.sizes?.length > 0 && (
                          <div className="variation-block">
                            <h4>Sizes Available</h4>
                            <div className="variation-group">
                              {selectedProductData.sizes.map((size) => (
                                <button 
                                  onClick={() => handleSizeSelect(size)} 
                                  className={`variation-pill ${selectedSize === size ? 'active' : ''}`} 
                                  key={size}
                                >
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
                            <p className="cart-subtle-text">
                              <span>✓</span> Already in cart 
                              {selectedColor ? ` in ${selectedColor}` : ""} 
                              {selectedSize ? ` (Size: ${selectedSize})` : ""}
                              . Go to cart to adjust quantity.
                            </p>
                          )}

                          <div className="modal-actions-row">
                            {selectedProductData.isInStock ? (
                              <>
                                {isCurrentVariationInCart ? (
                                  <button className="action-btn buy-now full-width" onClick={() => navigate('/cart')}>Go to Cart</button>
                                ) : (
                                  <>
                                    <button className="action-btn buy-now" onClick={() => handleAddToCartLogic(selectedProductData, selectedColor, selectedSize, true)}>Buy Now</button>
                                    <button className="action-btn add-to-cart" onClick={() => handleAddToCartLogic(selectedProductData, selectedColor, selectedSize, false)}>Add to Cart</button>
                                  </>
                                )}
                              </>
                            ) : (
                              <button className="action-btn sold-out full-width" disabled>Sold Out</button>
                            )}

                            {isCurrentVariationInCart && (
                              <button className="action-btn remove-cart" onClick={() => removeFromCart(selectedProductData.id, selectedColor, selectedSize)}>Remove from Cart</button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>

                <div className="modal-bottom-related">
                  <h3>Recommended for You</h3>
                  <div className="related-grid">
                    {data
                      .filter(item => item.category === selectedProductData.category && item.id !== selectedProductData.id)
                      .slice(0, 4)
                      .map(related => (
                        <div className="related-card" key={related.id} onClick={() => handleProductClick(related)}>
                          <div className="related-img">
                            <img src={Array.isArray(related.imgUrl) ? related.imgUrl[0] : related.imgUrl} alt={related.txtVal} />
                          </div>
                          <p className="r-title">{related.txtVal}</p>
                          <p className="r-price">&#8358; {parseFloat(related.price).toLocaleString('en-US')}</p>
                        </div>
                    ))}
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

        {savedMessage && (
          <div className="status-toast success">
            <div className="toast-content" onClick={() => setSavedMessage("")}>
              <FaHeart className='icon' /> {savedMessage}
            </div>
          </div>
        )}

        {loginPrompt && (
          <div className="status-toast">
            <div className="toast-content" onClick={() => { setLoginPrompt(false); navigate('/login'); }}>
              <FaRegHeart className='icon' /> Please log in to save products
              <span className="toast-action">Log in</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Store;