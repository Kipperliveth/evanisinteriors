import React, { useEffect, useState, useRef } from "react";
import AdminDashboard from "../AdminComponents/AdminDashboard";
import { imgdb, txtdb } from "../../firebase-config";
import { v4 } from "uuid";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { ImSpinner8 } from "react-icons/im";
import { FaCloud } from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { FaCheckDouble } from "react-icons/fa6";
import { MdClose } from "react-icons/md";
import { FiUploadCloud, FiTrash2, FiCheck } from "react-icons/fi";

// Categories shown in the picker (alphabetical)
const CATEGORIES = [
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

// Colors shown in the checklist (the hex is only used for the little swatch)
const COLORS = [
  { name: "White", hex: "#ffffff" },
  { name: "Cream", hex: "#f5ecd7" },
  { name: "Beige", hex: "#d9c7a5" },
  { name: "Tan", hex: "#c19a6b" },
  { name: "Brown", hex: "#7b4a2d" },
  { name: "Grey", hex: "#9ca3af" },
  { name: "Charcoal", hex: "#374151" },
  { name: "Black", hex: "#111111" },
  { name: "Silver", hex: "#c0c0c0" },
  { name: "Gold", hex: "#c9a227" },
  { name: "Yellow", hex: "#f2c230" },
  { name: "Orange", hex: "#e8710a" },
  { name: "Red", hex: "#c62828" },
  { name: "Burgundy", hex: "#6d1a2b" },
  { name: "Pink", hex: "#e58aa8" },
  { name: "Purple", hex: "#6a3fa0" },
  { name: "Blue", hex: "#1e66d0" },
  { name: "Navy", hex: "#14213d" },
  { name: "Teal", hex: "#14797a" },
  { name: "Green", hex: "#2e7d32" },
  { name: "Olive", hex: "#6b6b2a" },
];

function Post() {
  const [txt, setTxt] = useState("");
  const [desc, setDescTxt] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState([]);
  const [sizes, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [isInStock, setIsInStock] = useState(true);

  // New Image Handling States
  const [selectedFiles, setSelectedFiles] = useState([]); // Stores actual file objects
  const [imagePreviews, setImagePreviews] = useState([]); // Stores blob URLs for UI rendering

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Drag and Drop Ref
  const dragItem = useRef();
  const dragOverItem = useRef();

  // Handle Initial File Selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Create preview URLs for the UI
    const newPreviews = files.map(file => URL.createObjectURL(file));

    setSelectedFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    
    // Reset file input so you can select the same file again if needed
    e.target.value = null; 
  };

  // Remove a specific image
  const handleRemoveImage = (indexToRemove) => {
    URL.revokeObjectURL(imagePreviews[indexToRemove]); // Clean up memory
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Handle Drag and Drop Reordering
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

    // Reorder Previews
    const previewClone = [...imagePreviews];
    const tempPreview = previewClone[dragItem.current];
    previewClone.splice(dragItem.current, 1);
    previewClone.splice(dragOverItem.current, 0, tempPreview);
    setImagePreviews(previewClone);

    // Reorder Actual Files
    const filesClone = [...selectedFiles];
    const tempFile = filesClone[dragItem.current];
    filesClone.splice(dragItem.current, 1);
    filesClone.splice(dragOverItem.current, 0, tempFile);
    setSelectedFiles(filesClone);

    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Tick / untick a color in the checklist
  const toggleColor = (name) => {
    setColor(prev => (prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]));
  };

  // Main Upload Function
  const handleClick = async () => {
    setIsLoggedIn(true);

    if (!txt || !desc || !category || !price || selectedFiles.length === 0) {
      setIsLoggedIn(false);
      setErrorMessage("Please fill in all fields and select at least one image.");
      return;
    }
    setErrorMessage("");

    try {
      // 1. Upload all currently selected & ordered files to Firebase Storage
      const uploadPromises = selectedFiles.map((file) => {
        const imgRef = ref(imgdb, `imgs/${v4()}`);
        return uploadBytes(imgRef, file).then((snapshot) =>
          getDownloadURL(snapshot.ref)
        );
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // 2. Save product document to Firestore with the URLs array
      const valRef = collection(txtdb, "txtData");
      await addDoc(valRef, { 
        txtVal: txt, 
        desc, 
        category, 
        color, 
        sizes, 
        price, 
        imgUrl: uploadedUrls, // Array of URLs maintaining the sorted order
        isInStock: isInStock 
      });

      setUploadSuccess(true);
      setIsLoggedIn(false);
      
    } catch (error) {
      console.error("Error uploading data: ", error);
      setIsLoggedIn(false);
      setErrorMessage("An error occurred while uploading. Please try again.");
    }
  };

  const handleClose = () => {
    setUploadSuccess(false);
    setTxt("");
    setDescTxt("");
    setCategory("");
    setPrice("");
    setColor([]);
    setSize("");
    setSelectedFiles([]);
    
    // Clean up blob URLs
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews([]);
  };

  return (
    <div className="admin-layout-wrapper">
      <AdminDashboard />

      <div className="admin-page-content adminPost">
        
        <div className="page-header">
          <div>
            <h1 className="page-title">Upload a Product</h1>
            <p className="page-subtitle">Add a new item to your store catalog.</p>
          </div>
        </div>

        <div style={{ display: uploadSuccess ? "none" : "block" }}>
          <div className="post-container">
            
            {/* --- IMAGE UPLOAD & PREVIEW SECTION --- */}
            <div className="image-upload-section">
              <label className="section-label">Product Images</label>
              <p className="section-subtext">The first image will be used as the main store thumbnail. Drag and drop to reorder.</p>
              
              <div className="image-preview-track">
                {imagePreviews.map((url, index) => (
                  <div 
                    key={index} 
                    className="preview-box"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <img src={url} alt={`Preview ${index}`} />
                    {index === 0 && <span className="main-badge">Main</span>}
                    <button className="remove-img-btn" onClick={() => handleRemoveImage(index)}>
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
                
                <label className="upload-trigger-box">
                  <FiUploadCloud className="upload-icon" />
                  <span>Add Images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            {/* --- PRODUCT DETAILS SECTION --- */}
            <div className="form-section">
              <span className="section-label">Product Details</span>
              <p className="section-subtext">The name, price and description customers will see in the store.</p>

              <div className="section-fields">
                <div className="input-row">
                  <div className="input-group">
                    <label>Product Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Modern Oak Dining Table"
                      value={txt}
                      onChange={(e) => setTxt(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Price (₦)</label>
                    <input
                      type="number"
                      placeholder="Without commas"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    rows="4"
                    placeholder="Detailed description of the product..."
                    value={desc}
                    onChange={(e) => setDescTxt(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* --- CATEGORY SECTION --- */}
            <div className="form-section">
              <span className="section-label">Category</span>
              <p className="section-subtext">Pick the one that fits best.</p>

              <div className="category-chips" role="radiogroup" aria-label="Category">
                {CATEGORIES.map(c => (
                  <button
                    type="button"
                    key={c}
                    role="radio"
                    aria-checked={category === c}
                    className={`category-chip ${category === c ? "selected" : ""}`}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* --- COLORS SECTION --- */}
            <div className="form-section no-divider">
              <div className="section-head">
                <span className="section-label">Available Colors</span>
                <span className="selected-info">
                  {color.length > 0 ? `${color.length} selected` : "None selected"}
                  {color.length > 0 && (
                    <button type="button" className="clear-link" onClick={() => setColor([])}>Clear</button>
                  )}
                </span>
              </div>
              <p className="section-subtext">Tick every color this product comes in.</p>

              <div className="color-grid">
                {COLORS.map(c => {
                  const checked = color.includes(c.name);
                  return (
                    <label key={c.name} className={`color-option ${checked ? "checked" : ""}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleColor(c.name)}
                      />
                      <span className="color-swatch" style={{ backgroundColor: c.hex }} />
                      <span className="color-name">{c.name}</span>
                      <FiCheck className="color-check" />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="form-actions">
              {errorMessage && <p className="error-message">{errorMessage}</p>}
              
              <button className="primary-btn" onClick={handleClick} disabled={isLoggedIn}>
                {isLoggedIn ? <ImSpinner8 className="load-spinner" /> : "Upload Product"}
              </button>
            </div>

          </div>
        </div>

        {uploadSuccess && (
          <div className="success-message">
            <div className="close">
              <MdClose className="icon" onClick={handleClose}/>
            </div>

            <FaCloud className="success-icon" />

            <div className="msg">
              <p>Product successfully uploaded!</p>
              <FaCheckDouble />
            </div>

            <NavLink to="/store" className="view-btn">View in Store</NavLink>
            <button onClick={handleClose} className="upload-another-btn">Upload Another</button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Post;