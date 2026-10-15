import React, { useState, useEffect, useRef } from "react";
import AdminDashboard from "../AdminComponents/AdminDashboard";
import { txtdb, imgdb } from "../../firebase-config";
import { doc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { v4 } from "uuid";
import { CiSearch } from "react-icons/ci";
import { MdCancel } from "react-icons/md";
import { IoCloudUploadOutline } from "react-icons/io5";
import { FiUploadCloud, FiTrash2, FiFilter, FiChevronDown, FiCheck, FiX } from "react-icons/fi";

// Status tabs (always visible)
const STOCK_TABS = ["All", "In Stock", "Out of Stock"];

// Categories shown in the filter menu (any other category found in your products is added automatically)
const CATEGORY_LIST = [
  "Accent Chairs",
  "Bedsides",
  "Concierge Desks",
  "Console",
  "Credenza",
  "Dining",
  "Lights",
  "Room",
  "Sitting",
  "Storage",
  "Tables",
  "Vanity",
];

function Uploads() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const [selectedPost, setSelectedPost] = useState(null); 
  const [showModal, setShowModal] = useState(false); 

  const [modalImages, setModalImages] = useState([]); 
  const [isUpdating, setIsUpdating] = useState(false); 

  const dragItem = useRef();
  const dragOverItem = useRef();

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15; 

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [showModal]);

  // Close the category menu when clicking elsewhere or pressing Escape
  useEffect(() => {
    if (!isFilterOpen) return;
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false);
    };
    const handleKey = (e) => { if (e.key === "Escape") setIsFilterOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isFilterOpen]);

  // Back to page 1 whenever a filter or the search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [stockFilter, categoryFilter, appliedSearch]);

  const getData = async () => {
    const valRef = collection(txtdb, "txtData");
    const dataDb = await getDocs(valRef);
    const allData = dataDb.docs.map((val) => ({ ...val.data(), id: val.id }));
    setData(allData);
  };

  const deleteItem = async (itemId) => {
    if(window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(txtdb, "txtData", itemId));
        setData(data.filter((item) => item.id !== itemId));
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  };

  const handleSearchClick = () => {
    setAppliedSearch(searchTerm.trim());
  };

  useEffect(() => {
    setIsLoading(true); 
    getData().then(() => {
      setIsLoading(false); 
    });
  }, []);

  const handleEditClick = (post) => {
    setSelectedPost(post);
    let existingUrls = Array.isArray(post.imgUrl) ? post.imgUrl : [post.imgUrl];
    if (!existingUrls[0]) existingUrls = []; 
    const formattedImages = existingUrls.map(url => ({ url: url, file: null }));
    setModalImages(formattedImages);
    setShowModal(true);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newImages = files.map(file => ({
      url: URL.createObjectURL(file),
      file: file 
    }));
    setModalImages(prev => [...prev, ...newImages]);
    e.target.value = null; 
  };

  const handleRemoveImage = (indexToRemove) => {
    const imgToRemove = modalImages[indexToRemove];
    if (imgToRemove.file) URL.revokeObjectURL(imgToRemove.url); 
    setModalImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
    e.preventDefault();
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const imagesClone = [...modalImages];
    const tempImage = imagesClone[dragItem.current];
    imagesClone.splice(dragItem.current, 1);
    imagesClone.splice(dragOverItem.current, 0, tempImage);
    setModalImages(imagesClone);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleUpdate = async () => {
    if (modalImages.length === 0) {
      alert("A product must have at least one image.");
      return;
    }

    setIsUpdating(true);
    try {
        const finalImageUrls = await Promise.all(
          modalImages.map(async (imgObj) => {
            if (imgObj.file) {
              const imgRef = ref(imgdb, `imgs/${v4()}`);
              const snapshot = await uploadBytes(imgRef, imgObj.file);
              return await getDownloadURL(snapshot.ref);
            } else {
              return imgObj.url;
            }
          })
        );

        const postDoc = doc(txtdb, "txtData", selectedPost.id);
        await updateDoc(postDoc, {
            ...selectedPost,
            imgUrl: finalImageUrls, 
            isInStock: selectedPost.isInStock
        });

        const usersSnapshot = await getDocs(collection(txtdb, "users"));
        
        if (!usersSnapshot.empty) {
          const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
              const userId = userDoc.id;
              const productsRef = collection(txtdb, `users/${userId}/products`);
              const productSnapshot = await getDocs(productsRef);

              if (productSnapshot.empty) return;

              const productUpdatePromises = productSnapshot.docs.map(async (productDoc) => {
                  const productData = productDoc.data();
                  if (productData.productnumber === selectedPost.id) {
                      const productDocRef = doc(txtdb, `users/${userId}/products/${productDoc.id}`);
                      await updateDoc(productDocRef, {
                          txtVal: selectedPost.txtVal,
                          desc: selectedPost.desc,
                          price: selectedPost.price,
                          isInStock: selectedPost.isInStock
                      });
                  } 
              });
              await Promise.all(productUpdatePromises);
          });
          await Promise.all(updatePromises);
        }
        
        getData(); 
        closeModal();
    } catch (error) {
        console.error("Error in update process:", error);
    } finally {
        setIsUpdating(false);
    }
  };

  const closeModal = () => {
    modalImages.forEach(img => { if(img.file) URL.revokeObjectURL(img.url); });
    setShowModal(false);
  };

  // --- FILTERING (search + status + category all work together) ---
  const matchesStock = (item, stock) =>
    stock === "All" ||
    (stock === "In Stock" ? item.isInStock === true : item.isInStock === false);

  const searchedData = data.filter(
    (item) =>
      !appliedSearch ||
      (item.txtVal && item.txtVal.toLowerCase().includes(appliedSearch.toLowerCase()))
  );

  const filteredData = searchedData.filter(
    (item) =>
      matchesStock(item, stockFilter) &&
      (categoryFilter === "All" || item.category === categoryFilter)
  );

  // Counts shown on the tabs and in the category menu
  const stockCount = (stock) =>
    searchedData.filter(
      (item) =>
        matchesStock(item, stock) &&
        (categoryFilter === "All" || item.category === categoryFilter)
    ).length;

  const categoryCount = (cat) =>
    searchedData.filter(
      (item) =>
        matchesStock(item, stockFilter) && (cat === "All" || item.category === cat)
    ).length;

  const categoryOptions = Array.from(
    new Set([...CATEGORY_LIST, ...data.map((item) => item.category).filter(Boolean)])
  ).sort((a, b) => a.localeCompare(b));

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const currentData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (!showModal) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, showModal]);

  return (
    <div className="admin-layout-wrapper">
      <AdminDashboard />

      <div className="admin-page-content adminUploads">
        
        <div className="page-header">
          <div>
            <h1 className="page-title">Manage Inventory</h1>
            <p className="page-subtitle">View, edit, or remove products from your catalog.</p>
          </div>
        </div>

        <div className="inventory-controls">
          <div className="admin-search-bar">
            <CiSearch className="icon" />
            <input
              type="text"
              placeholder="Search by product name..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                if (event.target.value === "") setAppliedSearch("");
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
            />
          </div>

          <div className="filter-group">
            {/* Status tabs: always visible */}
            <div className="admin-category-tabs">
              {STOCK_TABS.map(tab => (
                <button 
                  key={tab}
                  className={stockFilter === tab ? "tab active" : "tab"}
                  onClick={() => setStockFilter(tab)}
                >
                  {tab}
                  <span className="count">{stockCount(tab)}</span>
                </button>
              ))}
            </div>

            {/* Category filter: one button, menu with every category */}
            <div className="category-filter" ref={filterRef}>
              <button
                type="button"
                className={`category-filter-btn ${categoryFilter !== "All" ? "active" : ""} ${isFilterOpen ? "open" : ""}`}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                aria-haspopup="listbox"
                aria-expanded={isFilterOpen}
              >
                <FiFilter />
                <span>{categoryFilter === "All" ? "Category" : categoryFilter}</span>
                <FiChevronDown className="chevron" />
              </button>

              {categoryFilter !== "All" && (
                <button
                  type="button"
                  className="filter-clear"
                  onClick={() => setCategoryFilter("All")}
                  aria-label="Clear category filter"
                >
                  <FiX />
                </button>
              )}

              {isFilterOpen && (
                <div className="category-filter-menu" role="listbox">
                  <div className="menu-title">Filter by category</div>

                  {["All", ...categoryOptions].map(cat => {
                    const selected = categoryFilter === cat;
                    const count = categoryCount(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        role="option"
                        aria-selected={selected}
                        className={`menu-item ${selected ? "selected" : ""} ${count === 0 && !selected ? "empty" : ""}`}
                        onClick={() => {
                          setCategoryFilter(cat);
                          setIsFilterOpen(false);
                        }}
                      >
                        <span className="menu-label">
                          <FiCheck className="menu-check" />
                          {cat === "All" ? "All Categories" : cat}
                        </span>
                        <span className="menu-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="compact-grid">
            {Array.from({ length: 15 }).map((_, idx) => (
              <div className="compact-card skeleton" key={idx}>
                <div className="skel-img"></div>
                <div className="skel-info">
                  <div className="skel-line"></div>
                  <div className="skel-line short"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="compact-grid">
              {currentData.length === 0 ? (
                <div className="no-results">
                  <p>No products match your filters.</p>
                </div>
              ) : (
                currentData.map((value) => (
                  <div className="compact-card" key={value.id}>
                    <div className="card-img-wrap">
                      <img src={Array.isArray(value.imgUrl) ? value.imgUrl[0] : value.imgUrl} alt={value.txtVal} />
                      {!value.isInStock && <span className="stock-badge out">Out of Stock</span>}
                    </div>

                    <div className="card-info">
                      <h3 className="item-name" title={value.txtVal}>{value.txtVal}</h3>
                      <p className="item-price">₦ {parseFloat(value.price).toLocaleString('en-US')}</p>
                    </div>

                    <div className="card-actions">
                      <button className="action-btn edit" onClick={() => handleEditClick(value)}>Edit</button>
                      <button className="action-btn delete" onClick={() => deleteItem(value.id)}>Delete</button>
                    </div>
                  </div>
                ))
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
          </>
        )}

      </div>

      {showModal && selectedPost && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="edit-modal-content wide" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <div className="header-text">
                <h2>Edit Product</h2>
                <p>Update inventory details, pricing, and images.</p>
              </div>
              <MdCancel className="close-icon" onClick={closeModal} />
            </div>

            <div className="modal-body horizontal-layout">
              
              <div className="modal-col images-col">
                <div className="col-header-row">
                  <label className="col-label">Product Images</label>
                  <p className="image-helper-text">Drag to reorder.</p>
                </div>
                
                <div className="image-preview-track scrollable">
                  <label className="upload-trigger-box">
                    <FiUploadCloud className="upload-icon" />
                    <span>Add</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                  </label>

                  {modalImages.map((imgObj, index) => (
                    <div 
                      key={index} 
                      className="preview-box"
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <img src={imgObj.url} alt={`Preview ${index}`} />
                      {index === 0 && <span className="main-badge">Main</span>}
                      <button className="remove-img-btn" onClick={() => handleRemoveImage(index)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-col data-col">
                <div className="input-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={selectedPost.txtVal}
                    onChange={(e) => setSelectedPost({ ...selectedPost, txtVal: e.target.value })}
                  />
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label>Price (₦)</label>
                    <input
                      type="number"
                      value={selectedPost.price}
                      onChange={(e) => setSelectedPost({ ...selectedPost, price: e.target.value })}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Status</label>
                    <div className="segmented-control">
                      <button
                        className={`seg-btn ${selectedPost.isInStock ? 'active' : ''}`}
                        onClick={() => setSelectedPost((prev) => ({ ...prev, isInStock: true }))}
                      >
                        In Stock
                      </button>
                      <button
                        className={`seg-btn ${!selectedPost.isInStock ? 'active' : ''}`}
                        onClick={() => setSelectedPost((prev) => ({ ...prev, isInStock: false }))}
                      >
                        Out of Stock
                      </button>
                    </div>
                  </div>
                </div>

                <div className="input-group flex-grow">
                  <label>Description</label>
                  <textarea
                    className="flex-grow-textarea"
                    value={selectedPost.desc}
                    onChange={(e) => setSelectedPost({ ...selectedPost, desc: e.target.value })}
                  />
                </div>
              </div>

            </div>

            <div className="form-actions">
              <button className="cancel-btn" onClick={closeModal} disabled={isUpdating}>Cancel</button>
              <button className="primary-btn upload" onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"} 
                {!isUpdating && <IoCloudUploadOutline className="icon" />}
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}

export default Uploads;