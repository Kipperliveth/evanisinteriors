import React, { useEffect, useState } from "react";
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

function Post() {
  const [txt, setTxt] = useState("");
  const [imgs, setImgs] = useState("");
  const [desc, setDescTxt] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [sizes, setSize] = useState("");
  const [price, setPrice] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);


  const [errorMessage, setErrorMessage] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);

  //
  const [data, setData] = useState([]);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const uploadPromises = files.map((file) => {
      const imgRef = ref(imgdb, `imgs/${v4()}`);
      return uploadBytes(imgRef, file).then((snapshot) =>
        getDownloadURL(snapshot.ref)
      );
    });

    Promise.all(uploadPromises)
      .then((urls) => {
        setImgs(urls);
      })
      .catch((error) => {
        console.error("Error uploading images: ", error);
      });
  };

   const handleSizing = (event) => {
    const options = event.target.options;
    const selectedSizes = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedSizes.push(options[i].value);
      }
    }
    setSize(selectedSizes);
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

  const handleClick = async () => {
    setIsLoggedIn(true);

    setUploadInProgress(true);

    if (!txt || !desc || !category || !price || imgs.length === 0) {
      setIsLoggedIn(false);
      setErrorMessage("Please fill in all fields before uploading.");
      return;
    }
    // Clear any previous error message
    setErrorMessage("");

    try {
      const valRef = collection(txtdb, "txtData");
      await addDoc(valRef, { txtVal: txt, desc, category, color, sizes, price, imgUrl: imgs });
      setUploadSuccess(true);
      setIsLoggedIn(false);
      
    } catch (error) {
      console.error("Error uploading data: ", error);
      setIsLoggedIn(false);
      setErrorMessage("An error occurred while uploading. Please try again.");
    }

    setUploadInProgress(false);
  };

  const getData = async () => {
    const valRef = collection(txtdb, "txtData");
    const dataDb = await getDocs(valRef);
    const allData = dataDb.docs.map((val) => ({ ...val.data(), id: val.id }));
    setData(allData);
  };

  useEffect(() => {
    getData();
  }, []);

  //validation

  //close logic

  const handleClose = () => {
    setUploadSuccess(false)
    setTxt("");
    setImgs("");
    setDescTxt("");
    setCategory("");
    setPrice("");
  }

  return (
    <div className="adminHome">
      <AdminDashboard />

      <h2 className="admin-current-page mobile-content">Upload a Product</h2>

      <div className="adminContent adminPost">

      <h2 className="admin-current-page desktop-content">Upload a Product</h2>


        <div style={{ display: uploadSuccess ? "none" : "block" }}>
          <div className="post-container">
            <input
              type="file"
              multiple
              onChange={handleUpload}
              placeholder="browse"
              // value={img}
            />

            <input
              type="text"
              name="name"
              placeholder="product name"
               value={txt}
              onChange={(e) => setTxt(e.target.value)}
              required
            />

            <input
              type="text"
              name="description"
              placeholder="product description"
                value={desc}
              onChange={(e) => setDescTxt(e.target.value)}
              required
            />
       
            <select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select Category</option>
              <option value="Sitting">Sitting</option>
              <option value="Room">Room</option>
              <option value="Tables">Tables</option>
              <option value="Lights">Lights</option>
              <option value="Storage">storage</option>
            </select>

            {/* <select
              name="Size"
              value={sizes}
              onChange={handleSizing}
              multiple
            >
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
              <option value="XXX" >XXXL</option>
            </select> */}

              <select
              name="Color"
              value={color}
              onChange={handleColor}
              multiple
            >
              <option value="White">White</option>
              <option value="Black">Black</option>
              <option value="Red">Red</option>
              <option value="Purple">Purple</option>
              <option value="Pink" >Pink</option>
              <option value="Blue" >Blue</option>
              <option value="Brown" >Brown</option>
              <option value="Biege" >Biege</option>
            </select>



            <input
              type="number"
              name="price"
              placeholder="product price (without commas)"
                value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />

            <span>
              <button onClick={handleClick}>
                {isLoggedIn ? (
                  <ImSpinner8 className="load-spinner" />
                ) : (
                  "Upload Product"
                )}
              </button>
              {errorMessage && <p className="error-message">{errorMessage}</p>}
            </span>
          </div>
        </div>

        {uploadSuccess && (
          <div className="success-message">
            <div className="close">
           <MdClose className="icon" onClick={handleClose}/>
            </div>

            <FaCloud className="success-icon" />

            <div className="msg">
              <p>Product Successfully uploaded!</p>
              <FaCheckDouble />
            </div>

            <NavLink to="/uploads">Go to Uploads</NavLink>
          </div>
        )}
      </div>
      
    </div>
  );
}

export default Post;
