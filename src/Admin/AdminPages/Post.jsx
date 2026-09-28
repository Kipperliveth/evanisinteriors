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
import { FiUploadCloud, FiTrash2 } from "react-icons/fi";

function Post() {
  const [txt, setTxt] = useState("");
  const [desc, setDescTxt] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
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

  const handleColor = (event) => {
    const options = event.target.options;
    const selectedColor = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedColor.push(options[i].value);
      }
    }
    setColor(selectedColor);
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
    setColor("");
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

            <div className="input-row">
              <div className="input-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Sitting">Sitting</option>
                  <option value="Room">Room</option>
                  <option value="Tables">Tables</option>
                  <option value="Lights">Lights</option>
                  <option value="Storage">Storage</option>
                </select>
              </div>

              <div className="input-group">
                <label>Available Colors (Hold Ctrl/Cmd to multi-select)</label>
                <select
                  value={color}
                  onChange={handleColor}
                  multiple
                  className="multi-select"
                >
                  <option value="White">White</option>
                  <option value="Black">Black</option>
                  <option value="Red">Red</option>
                  <option value="Purple">Purple</option>
                  <option value="Pink">Pink</option>
                  <option value="Blue">Blue</option>
                  <option value="Brown">Brown</option>
                  <option value="Beige">Beige</option>
                </select>
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