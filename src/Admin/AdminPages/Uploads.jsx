import React from "react";
import { useState, useEffect } from "react";
import AdminDashboard from "../AdminComponents/AdminDashboard";
import { txtdb } from "../../firebase-config";
import { doc, updateDoc, collection, query, where, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { CiSearch } from "react-icons/ci";
import all from "../../stock/allmain.png";
import sitting from "../../stock/couchicon.png";
// import curtains from "../../stock/curtainicon.png";
import room from "../../stock/roomicon.png";
import lights from "../../stock/lighticon.png";
import tables from "../../stock/tableicon.png";
import storageicon from "../../stock/storageicon.png";
import { IoCloudUploadOutline } from "react-icons/io5";
import { IoIosArrowBack } from "react-icons/io";

function Uploads() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [selectedPost, setSelectedPost] = useState(null); // State for selected post
  const [showModal, setShowModal] = useState(false); // State to toggle modal visibility

  const getData = async () => {
    const valRef = collection(txtdb, "txtData");
    const dataDb = await getDocs(valRef);
    const allData = dataDb.docs.map((val) => ({ ...val.data(), id: val.id }));
    setData(allData);
    setFilteredData(allData);
  };
  //

  const deleteItem = async (itemId) => {
    try {
      await deleteDoc(doc(txtdb, "txtData", itemId));
      setData(data.filter((item) => item.id !== itemId));
      setFilteredData(filteredData.filter((item) => item.id !== itemId)); // Update filteredData after deletion
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };
  //
  const handleSearchClick = () => {
    const filtered = data.filter(
      (value) =>
        value.txtVal &&
        value.txtVal.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  };
  //
  useEffect(() => {
    getData();
  }, []);
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

  useEffect(() => {
    setIsLoading(true); // Start loading before fetching data
    getData().then(() => {
      setIsLoading(false); // Stop loading after data is fetched
    });
  }, []);

  //edit
  const handleEditClick = (post) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  //updating carts

  

  

  const handleUpdate = async () => {
    try {
        console.log("Starting update process for product:", selectedPost.txtVal);

        // Update the main product document in txtData
        const postDoc = doc(txtdb, "txtData", selectedPost.id);
        await updateDoc(postDoc, {
            ...selectedPost,
            isInStock: selectedPost.isInStock
        });
        console.log("Main product document updated successfully");

        // Step 1: Fetch all users from 'userCart'
        const usersSnapshot = await getDocs(collection(txtdb, "users"));

        // Debugging: Log the number of users fetched
        console.log(`Number of users found: ${usersSnapshot.size}`);

        if (usersSnapshot.empty) {
            console.log("No users found.");
            return;
        }

        // Step 2: Iterate through each user's cart
        const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
            const userId = userDoc.id;
            console.log(`Processing cart for user: ${userId}`);

            // Step 3: Get the user's cart products
            const productsRef = collection(txtdb, `users/${userId}/products`);
            const productSnapshot = await getDocs(productsRef);

            if (productSnapshot.empty) {
                console.log(`No products found in cart for user: ${userId}`);
                return;
            }

            // Step 4: Iterate through products in the user's cart and check for matches
            const productUpdatePromises = productSnapshot.docs.map(async (productDoc) => {
                const productData = productDoc.data();
                console.log(`Checking product in cart: ${productData.txtVal} (User: ${userId})`);

                // Step 5: Compare productnumber with selectedPost.id
                if (productData.productnumber === selectedPost.id) {
                    console.log(`Match found! Updating product in cart for user: ${userId}`);

                    // Step 6: Construct path for the product and update it
                    const productDocRef = doc(txtdb, `users/${userId}/products/${productDoc.id}`);
                    await updateDoc(productDocRef, {
                        txtVal: selectedPost.txtVal,
                        desc: selectedPost.desc,
                        price: selectedPost.price,
                        isInStock: selectedPost.isInStock
                    });
                    console.log(`Product updated in cart for user: ${userId}`);
                } else {
                    console.log(`No match for product: ${productData.txtVal} in user: ${userId} cart`);
                }
            });

            // Await all product updates for this user
            await Promise.all(productUpdatePromises);
        });

        // Await all user cart updates
        await Promise.all(updatePromises);

        // Step 7: Refresh data and close the modal
        getData();
        setShowModal(false);
        console.log("Update process completed for all users' carts");
    } catch (error) {
        console.error("Error in update process:", error);
    }
};

// const checkUserCart = async () => {
//   try {
//     const usersSnapshot = await getDocs(collection(txtdb, "/users/3vjKJe9Oo9Wfl1dmAZvUPVhBam53/products"));
//     if (usersSnapshot.empty) {
//       console.log("No users found in userCart collection.");
//       return;
//     }
//     usersSnapshot.forEach((userDoc) => {
//       console.log(`User ID: ${userDoc.id}`);
//     });
//   } catch (error) {
//     console.error("Error fetching userCart:", error);
//   }
// };


  
  
  
  



  return (
    <div className="adminHome">
      <AdminDashboard />

      <h2 className="admin-current-page mobile-content">Uploads</h2>

      <div className="adminUploads adminContent">
        <h2 className="admin-current-page desktop-content">Uploads</h2>

        <div className="search-container">
          <span>
            <CiSearch className="search-icon" />
            <input
              className="searchInput"
              type="text"
              placeholder="search for an upload..."
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
            />
          </span>

          <button onClick={handleSearchClick}>Search</button>
        </div>

        <div className="categories-container">
          <h3 className="categories-header">Categories</h3>
          <div className="categories">
            <span className="category-name">
              <button onClick={() => handleCategoryClick("All")}>
                <img src={all} alt="" />
              </button>
              All
            </span>

            <span className="category-name">
              <button onClick={() => handleCategoryClick("Sitting")}>
                <img src={sitting} alt="" />
              </button>
              <p>Sitting</p>
            </span>

            {/* <span className="category-name">
              <button onClick={() => handleCategoryClick("Curtains")}>
                <img src={curtains} alt="" />
              </button>
              <p>Curtains</p>
            </span> */}

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
        ) : (
          <div className="uploads-container">
            {filteredData.length === 0 ? (
            <div className="no-results">
              No products found.
            </div>
          ) : (filteredData.map((value) => (
                        <div className="product" key={value.id}>
                          <img
                            src={value.imgUrl}
                            height="200px"
                            width="200px"
                            alt="product"
                          />

                          <div className="product-info">
                            <h2 className="product-name">{value.txtVal}</h2>

                            <p className="product-description">{value.desc}</p>

                            <p className="product-category">{value.category}</p>

                            <p className="product-price">&#8358;&nbsp;{parseFloat(value.price).toLocaleString('en-US')}</p>
                            <span>
                              <button className="edit-btn"  onClick={() => handleEditClick(value)} >Edit</button>
                             
                              <button className="delete-btn" onClick={() => deleteItem(value.id)}>Delete</button>
                            </span>
                          </div>
                        </div>
                    ) ))}
          </div>
        )}
        
      </div>


        {/* Modal Popup */}
        {showModal && selectedPost && (
  <div className="modal">
    <div className="modal-content">
      <h2>Edit Product Details</h2>

      <input
        type="text"
        value={selectedPost.txtVal}
        onChange={(e) =>
          setSelectedPost({ ...selectedPost, txtVal: e.target.value })
        }
      />
      <textarea
        value={selectedPost.desc}
        onChange={(e) =>
          setSelectedPost({ ...selectedPost, desc: e.target.value })
        }
      />
      <input
        type="number"
        value={selectedPost.price}
        onChange={(e) =>
          setSelectedPost({ ...selectedPost, price: e.target.value })
        }
      />

      {/* Stock Status Buttons */}
      <div className="stock-toggle">
        <button
          className={`stock-btn ${selectedPost.isInStock ? 'active' : ''}`}
          onClick={() => setSelectedPost((prev) => ({ ...prev, isInStock: true }))}
        >
          In Stock
        </button>
        <button
          className={`stock-btn ${!selectedPost.isInStock ? 'active' : ''}`}
          onClick={() => setSelectedPost((prev) => ({ ...prev, isInStock: false }))}
        >
          Out of Stock
        </button>
      </div>

      <div className="edit-buttons">
        <button className="close" onClick={() => setShowModal(false)}>Close</button>
        <button className="upload" onClick={handleUpdate}>Update <IoCloudUploadOutline className="icon" /> </button>
      </div>
    </div>
  </div>
)}




    </div>
  );
}

export default Uploads;
