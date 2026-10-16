import React, { useState, useEffect } from "react";
import UserNav from "../App-components/UserNav";
import {
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, txtdb } from "../../firebase-config";
import { NavLink, useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import { BsArrowRight } from "react-icons/bs";

function Saved() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [savedIds, setSavedIds] = useState([]);
  const [savedLoading, setSavedLoading] = useState(true);

  const [cartItems, setCartItems] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.title = "Saved - Evanis Interiors";
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Fetch the catalog so saved items always show the latest price / stock
  useEffect(() => {
    const getCatalog = async () => {
      try {
        const snapshot = await getDocs(collection(txtdb, "txtData"));
        setCatalog(snapshot.docs.map((val) => ({ ...val.data(), id: val.id })));
      } catch (error) {
        console.error("Error fetching catalog:", error);
      }
      setCatalogLoading(false);
    };
    getCatalog();
  }, []);

  // SAVED LISTENER (logged-in users only) - newest saved first
  useEffect(() => {
    if (!authReady || !currentUser) return;

    const savedRef = collection(txtdb, `users/${currentUser.uid}/saved`);
    const unsubscribe = onSnapshot(
      savedRef,
      (snapshot) => {
        const ids = snapshot.docs
          .map((d) => ({ id: d.id, savedAt: d.data().savedAt || 0 }))
          .sort((a, b) => b.savedAt - a.savedAt)
          .map((d) => d.id);
        setSavedIds(ids);
        setSavedLoading(false);
      },
      (error) => {
        console.error("Error listening to saved products:", error);
        setSavedLoading(false);
      }
    );
    return () => unsubscribe();
  }, [authReady, currentUser]);

  // CART LISTENER (so we know what's already in the cart)
  useEffect(() => {
    if (!authReady || !currentUser) return;

    const cartRef = collection(txtdb, `users/${currentUser.uid}/products`);
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      setCartItems(snapshot.docs.map((d) => ({ ...d.data(), cartDocId: d.id })));
    });
    return () => unsubscribe();
  }, [authReady, currentUser]);

  const isInCart = (product) =>
    cartItems.some(
      (item) => item.productId === product.id || item.productnumber === product.id
    );

  const hasVariations = (product) =>
    product.color?.length > 0 || product.sizes?.length > 0;

  // UNSAVE
  const removeSaved = async (productId) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(txtdb, `users/${currentUser.uid}/saved/${productId}`));
    } catch (error) {
      console.error("Error removing saved product:", error);
      return;
    }

    setMessage("Removed from saved");
    setTimeout(() => setMessage(""), 3000);
  };

  // ADD TO CART FROM SAVED -> always leaves the /saved page
  const handleAddToCart = async (product) => {
    if (!currentUser) return;

    // Already in cart: just take them to the cart
    if (isInCart(product)) {
      navigate("/cart");
      return;
    }

    // Needs a color/size: send them to the product popup to choose
    if (hasVariations(product)) {
      navigate(`/store/${product.id}`);
      return;
    }

    const newItem = {
      imgUrl: product.imgUrl,
      txtVal: product.txtVal,
      desc: product.desc,
      category: product.category,
      price: product.price,
      quantity: 1,
      color: null,
      size: null,
      productnumber: product.id,
      productId: product.id,
      isInStock: true,
    };

    try {
      const productRef = collection(txtdb, `users/${currentUser.uid}/products`);
      const docRef = await addDoc(productRef, newItem);
      await updateDoc(doc(txtdb, `users/${currentUser.uid}/products/${docRef.id}`), {
        productId: docRef.id,
      });
    } catch (error) {
      console.error("Error adding saved product to cart:", error);
      return;
    }

    navigate("/cart");
  };

  const savedProducts = savedIds
    .map((id) => catalog.find((product) => product.id === id))
    .filter(Boolean);

  const isLoading = !authReady || savedLoading || catalogLoading;

  const getButton = (product) => {
    if (!product.isInStock) {
      return <button className="pill-btn sold-out" disabled>Sold Out</button>;
    }
    if (hasVariations(product)) {
      return (
        <button className="pill-btn view" onClick={() => handleAddToCart(product)}>
          Choose Options
        </button>
      );
    }
    if (isInCart(product)) {
      return (
        <button className="pill-btn view" onClick={() => navigate("/cart")}>
          Go to Cart
        </button>
      );
    }
    return (
      <button className="pill-btn add" onClick={() => handleAddToCart(product)}>
        Add to Cart
      </button>
    );
  };

  return (
    <div className="editorial-store-wrapper">
      {currentUser && <UserNav />}

      <div className="store-main-container saved-page page">
        <div className="saved-header">
          <h1 className="saved-title">
            Saved Items
            {savedProducts.length > 0 && (
              <span className="saved-count">({savedProducts.length})</span>
            )}
          </h1>
          <p className="saved-subtitle">Pieces you've saved for later.</p>
        </div>

        {authReady && !currentUser ? (
          <div className="saved-empty">
            <div className="saved-empty-icon">
              <FaRegHeart />
            </div>
            <h2>Log in to see your saved items</h2>
            <p>
              You need an account to save products. Log in and the pieces you save will be waiting
              here whenever you come back.
            </p>
            <NavLink to="/login" className="saved-shop-btn">
              Log in <BsArrowRight />
            </NavLink>
          </div>
        ) : isLoading ? (
          <div className="editorial-grid">
            {Array.from({ length: 4 }).map((_, idx) => (
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
        ) : savedProducts.length === 0 ? (
          <div className="saved-empty">
            <div className="saved-empty-icon">
              <FaRegHeart />
            </div>
            <h2>Nothing saved yet</h2>
            <p>
              Tap the heart on any product to save it here, so you can come back and add it to
              your cart when you're ready.
            </p>
            <NavLink to="/store" className="saved-shop-btn">
              Browse the Store <BsArrowRight />
            </NavLink>
          </div>
        ) : (
          <div className="editorial-grid">
            {savedProducts.map((product) => (
              <div className="editorial-product-card" key={product.id}>
                <div className="card-image-box" onClick={() => navigate(`/store/${product.id}`)}>
                  <img
                    src={Array.isArray(product.imgUrl) ? product.imgUrl[0] : product.imgUrl}
                    alt={product.txtVal}
                  />
                  <button
                    className="save-btn active"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSaved(product.id);
                    }}
                    title="Remove from saved"
                    aria-label="Remove from saved"
                  >
                    <FaHeart />
                  </button>
                </div>

                <div className="card-details">
                  <h2 className="product-name" onClick={() => navigate(`/store/${product.id}`)}>
                    {product.txtVal}
                  </h2>
                  <p className="product-description">{product.desc}</p>

                  <div className="card-bottom">
                    <p className="product-price">
                      &#8358;&nbsp;{parseFloat(product.price).toLocaleString("en-US")}
                    </p>
                    {getButton(product)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {message && (
        <div className="status-toast success">
          <div className="toast-content" onClick={() => setMessage("")}>
            <FaHeart className="icon" /> {message}
          </div>
        </div>
      )}
    </div>
  );
}

export default Saved;