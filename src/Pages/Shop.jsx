import { useState, useEffect } from "react";
import React from "react";
// import UserNav from "../App-components/UserNav";
// import { storage } from "../../firebase-config";
import {
  collection,
  getDocs,
 onSnapshot
} from "firebase/firestore";
import { CiSearch } from "react-icons/ci";
import { MdCancel } from "react-icons/md";
// import { auth } from "../../firebase-config";
// import { txtdb } from "../../firebase-config";
import {auth} from "../firebase-config"
import {txtdb} from "../firebase-config"
import { NavLink } from "react-router-dom";

import { IoIosArrowBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import all from "../stock/allmain.png";
import sitting from "../stock/couchicon.png";
import curtains from "../stock/curtainicon.png";
import room from "../stock/roomicon.png";
import lights from "../stock/lighticon.png";
import tables from "../stock/tableicon.png";
import storageicon from "../stock/storageicon.png";



function Shop() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [data, setData] = useState([]);
  const [notCompleted, setNotCompleted] = useState(false)


  //getting current user
  const currentUser = auth.currentUser;

  //cart logic
  const [cartItems, setCartItems] = useState([]);

  const addToCart = () => {
    setNotCompleted(true);
  }


  //listening for changes for butuuon switch
  useEffect(() => {
    if (currentUser) {
      const userId = currentUser.uid;
      const cartRef = collection(txtdb, `userCart/${userId}/products`);
      const unsubscribe = onSnapshot(cartRef, (querySnapshot) => {
        const cartItems = querySnapshot.docs.map((doc) => doc.data());
        setCartItems(cartItems);
      });
      return () => unsubscribe(); // Unsubscribe when component unmounts
    }
  }, [currentUser]);
  //

    // Function to handle item deletion from the cart
    const removeFromCart = async () => {
      setNotCompleted(true);
    }
    
    

  //popup

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductData, setSelectedProductData] = useState(null);

  const handleProductClick = (productData) => {
    setIsProductModalOpen(true);
    setSelectedProductData(productData); // Store clicked product data
  };

  const handleCloseModal = () => {
    setIsProductModalOpen(false);
    setSelectedProductData(null); // Clear selected product on close
  };

  //get data

  const getData = async () => {
    const valRef = collection(txtdb, "txtData");
    const dataDb = await getDocs(valRef);
    const allData = dataDb.docs.map((val) => ({ ...val.data(), id: val.id }));
    setData(allData);
    setFilteredData(allData);
  }; //

  const handleSearchClick = () => {
    const filtered = data.filter(
      (value) =>
        value.txtVal &&
        value.txtVal.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  };
  //

  //

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    if (category === "All") {
      setFilteredData(data);
    } else {
      const filtered = data.filter((item) => item.category === category);
      setFilteredData(filtered);
    }
  };
  //

  //display data onload
  useEffect(() => {
    document.title = "Evanis Interiors"
    getData();
  }, []);

  //skeleton loading
  useEffect(() => {
    setIsLoading(true); // Start loading before fetching data
    getData().then(() => {
      setIsLoading(false); // Stop loading after data is fetched
    });
  }, []);

  //modal add to cart
  const [popupMessage, setPopupMessage] = useState("");

  const popupcart = (selectedProductData) => {
    setNotCompleted(true);

  }

  //buy now

  const gotocart = () => {
    navigate('/cart')
  }


  const buynow = () => {
    setNotCompleted(true);
  }
  
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  function handleColorSelect(color) {
    setSelectedColor(color);
}
function handleSizeSelect(size) {
  setSelectedSize(size);
}

const [showPopup, setShowPopup] = useState(false);
const [removedPopup, setremovedPopup] = useState(false);
const [variationPopup, setVariationPopup] = useState(false)



  return (
    <div className="theStore ">
      {/* <UserNav /> */}

      <div className="uploaded-posts-container page">
        <div className="search-container">
          <span>
            <CiSearch className="search-icon" />
            <input
              className="searchInput"
              type="text"
              placeholder="search for something..."
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
            />
          </span>

          <button onClick={handleSearchClick}>Search</button>
        </div>

        <h3 className="categories-header">Categories</h3>
        <div className="categories-container">
          <div className="categories">
            <span className="category-name">
              <button onClick={() => handleCategoryClick("All")}>
                <img src={all} alt="" />
              </button>
              <p>All</p>
            </span>

            <span className="category-name">
              <button onClick={() => handleCategoryClick("Sitting")}>
                <img src={sitting} alt="" />
              </button>
              <p>Sitting</p>
            </span>

            <span className="category-name">
              <button onClick={() => handleCategoryClick("Curtains")}>
                <img src={curtains} alt="" />
              </button>
              <p>Curtains</p>
            </span>

            <span className="category-name">
              <button onClick={() => handleCategoryClick("Tables")}>
                <img src={tables} alt="" />
              </button>
              <p>Tables</p>
            </span>

            <span className="category-name">
              <button onClick={() => handleCategoryClick("Room")}>
                <img src={room} alt="" />
              </button>
              <p>Room</p>
            </span>

            <span className="category-name">
              <button onClick={() => handleCategoryClick("Lights")}>
                <img src={lights} alt="" />
              </button>
              <p>Lights</p>
            </span>

            <span className="category-name">
              <button onClick={() => handleCategoryClick("Storage")}>
                <img src={storageicon} alt="" />
              </button>
              <p>Storage</p>
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-message">
            <div className="loading-message">
            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
              <div className="loading-text-II"></div>
            </div>

            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
              <div className="loading-text-II"></div>
            </div>

            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
              <div className="loading-text-II"></div>
            </div>

            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
              <div className="loading-text-II"></div>
            </div>

            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
              <div className="loading-text-II"></div>
            </div>

            <div className="loading-card">
              <div className="loading-img"></div>
              <div className="loading-text"></div>
              <div className="loading-text-II"></div>
            </div>
          </div>
          </div>
        ) : (
          <div className="uploaded-posts preview">
          {filteredData.length > 0 ? (
            filteredData.map((product) => {
              const isInCart = cartItems.some(
                (item) => item.productId === product.id
              );
              return (
                <div className="product" key={product.id}>
                  <img
                    src={product.imgUrl}
                    onClick={() => handleProductClick(product)}
                    height="200px"
                    width="200px"
                    alt="product"
                  />
                  <div className="product-info">
                    <h2 className="product-name">{product.txtVal}</h2>
                    <p className="product-description">{product.desc}</p>
                    <p className="product-category">{product.category}</p>
                    <span>
                      <p className="product-price">
                        &#8358;&nbsp;{parseFloat(product.price).toLocaleString('en-US')}
                      </p>
                  

                      {isInCart ? (
                        <button onClick={() => removeFromCart(product.id)}>Remove</button>
                      ) : (
                        product.txtVal === "Vybez Universe X Unifest Shorts" || product.txtVal === "Vybez Universe X Unifest Shirt" || product.txtVal === "Vybez Universe Hoodie" ? (
                          // Handle "Vybez Universe X Unifest Shorts" case (optional)
                          <button style={{ backgroundColor: 'grey' }}>Sold Out</button>
                        ) : (
                          <button onClick={() => addToCart(product)}>Add to Cart</button>
                        )
                      )}

                    </span>
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
        )}

        {filteredData.length === 0 && (
          <div className="no-results preview">No products found</div>
        )}

        <div className={`product-modal ${isProductModalOpen ? "open" : ""}`}>
          {selectedProductData && (
            
            <div className="popup-details">

              <div className="closeIcon">
                <p className="close" onClick={handleCloseModal} > <IoIosArrowBack />back to store</p>
              </div>


              <div className="container">

              <div className="left">
              {selectedProductData.imgUrl && selectedProductData.imgUrl.map((url, index) => (
                    <img key={index} src={url} alt="Product" />
                  ))}
              </div>

              <div className="right">

              <h2>{selectedProductData.txtVal}</h2>
              {/* Add image */}

              <p className="price"> &#8358; {parseFloat(selectedProductData.price).toLocaleString('en-us')}</p>
              <p>{selectedProductData.desc}</p>

              {(selectedProductData.color.length > 0 || selectedProductData.sizes.length > 0) && (
                <h5>VARIATIONS:</h5>
              )}

               {selectedProductData.color.length > 0? (
              <div className="color">
              {selectedProductData.color.map((color) => (
                <button  onClick={() => handleColorSelect(color)} className='variation' key={color}    style={{
                  border: selectedColor === color ? '2px solid black' : '1px solid gray', // Change border style based on selection
                }}>
                {color}
              </button>
              ))}
              </div>
              ) : null}

                {selectedProductData.sizes.length > 0? (
                <div className="size">
                    {selectedProductData.sizes.map((size) => (
                      <button onClick={() => handleSizeSelect(size)} className="variation" key={size}  style={{
                        border: selectedSize === size ? '2px solid black' : '1px solid gray', // Change border style based on selection
                      }}>{size}</button>
                    ))}
                </div>
              ) : null}
           
              
              {/* ... other product details ... */}
              <div className="buy-now">
               
                      {
                        selectedProductData.txtVal === "Vybez Universe X Unifest Shorts" || selectedProductData.txtVal === "Vybez Universe X Unifest Shirt" || selectedProductData.txtVal === "Vybez Universe Hoodie" ? (
                          <button style={{ backgroundColor: 'grey', color: "white" }}>Sold Out</button>
                        ) : (
                          cartItems.some(item => item.productId === selectedProductData.id) ? (
                            <button onClick={() => gotocart()}>Buy now</button>
                          ) : (
                            <button  onClick={() => buynow(selectedProductData)}>Buy Now</button>
                          )
                        )
                      }

                {cartItems.some(item => item.productId === selectedProductData.id) ? (
                        <button onClick={() => removeFromCart(selectedProductData.id)}>Remove from cart</button>
                      ) : (
                        selectedProductData.txtVal === "Vybez Universe X Unifest Shorts" || selectedProductData.txtVal === "Vybez Universe X Unifest Shirt" || selectedProductData.txtVal === "Vybez Universe Hoodie" ? (
                          <button style={{ backgroundColor: 'grey', color: "white" }}>Sold Out</button>
                        ) : (
                          <button onClick={() => popupcart(selectedProductData)}>Add to Cart</button>
                        )
                      )}
              </div>

              </div>

              </div>


            </div>
          )}
        </div>

        {showPopup && (
        <div className="popup">

          <div className="spinner" onClick={() => setShowPopup(false)}>
           <MdCancel className='icon' /> Item has been added to cart
          </div>

        </div>
      )}

    {variationPopup && (
        <div className="popup">

          <div className="spinner variation" onClick={() => setVariationPopup(false)}>
           <MdCancel className='icon' /> {popupMessage}
          </div>

        </div>
      )}

        {removedPopup && (
        <div className="popup">

          <div className="spinner removed" onClick={() => setremovedPopup(false)}>
           <MdCancel className='icon' /> Item has been removed from cart
          </div>

        </div>
      )}

      {notCompleted && (
        <div className='addNumber'>


          <div className='checkout-container'>

        <p>Please Sign-in to add this item to your cart</p>

       <div className='buttons'>
            <button onClick={() => setNotCompleted(false)} className="a">Cancel</button>
            <NavLink onClick={() => setNotCompleted(false)} to='/login' className="a again">Sign in</NavLink>
        </div>

          </div>
          </div>
      )}  


      </div>
    </div>
  );
}

export default Shop;
