import React from "react";
import { useState, useEffect } from "react";
import AdminDashboard from "../AdminComponents/AdminDashboard";
import { txtdb } from "../../firebase-config";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
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

  const handleUpdate = async () => {
    try {
      const postDoc = doc(txtdb, "txtData", selectedPost.id);
      await updateDoc(postDoc, selectedPost);
      getData(); // Refresh data after update
      setShowModal(false); // Close modal
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };



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
