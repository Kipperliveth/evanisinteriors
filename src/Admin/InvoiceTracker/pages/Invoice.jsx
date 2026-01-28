import React, { useState, useMemo, useEffect, useRef } from "react";
import Navigation from "../components/Navigation";
import { CiSearch } from "react-icons/ci";
import { MdOutlineNoteAdd } from "react-icons/md";
import { txtdb } from "../../../firebase-config";
import { IoIosArrowBack } from "react-icons/io";
import { IoAdd } from "react-icons/io5";
import { IoCloseOutline } from "react-icons/io5";
import { Timestamp } from "firebase/firestore";
import { collection, addDoc, doc, updateDoc, getDocs, deleteDoc, query, where } from "firebase/firestore";
import { CiMenuKebab } from "react-icons/ci";
import html2canvas from 'html2canvas';
import logo from "../../../stock/logonew-removebg-preview.png"


function Invoice() {

  const [filter, setFilter] = useState("all");
  const [isEditing, setIsEditing] = useState(false); // New state to track mode
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  
  const statusColor = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "status paid";
      case "unpaid":
        return "status unpaid";
      case "overdue":
        return "status overdue";
      case "partial-payment":
        return "status partial-payment";
      case "draft":
        return "status draft";
      default:
        return "status";
    }
  };

  //real form ends

  const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
    client: "",
    contact: "",
    address: "",
    created: "",
    due: "",
    amount: "",
    discount: "",
    paid: "",
    outstanding: "",
    status: "Paid",
  });

  const [items, setItems] = useState([{ name: "", quantity: 1, rate: 0 }]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangee = (index, key, value) => {
    const newItems = [...items];
    newItems[index][key] = value;
    setItems(newItems);
  };

  const addItemField = () => setItems([...items, { name: "", quantity: 1 }]);
  const removeItemField = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const resetFormAndState = () => {
    setFormData({
      client: "",
      contact: "",
      address: "",
      created: "",
      due: "",
      amount: "",
      discount: "",
      paid: "",
      outstanding: "",
      status: "Paid",
    });
    setItems([{ name: "", quantity: 1 }]);
    setShowForm(false);
    setIsEditing(false); // Reset edit state
    setEditingInvoiceId(null); // Clear the ID
};


//invoice total calculator
const itemsTotal = useMemo(() => {
  return items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );
}, [items]);

useEffect(() => {
  setFormData(prev => ({
    ...prev,
    amount: itemsTotal
  }));
}, [itemsTotal]);

//
// New function to handle client creation/update
const saveClientData = async (clientData, items) => {
  const clientsRef = collection(txtdb, "clients");
  const clientContact = clientData.contact; // Use contact as the unique key for search

  // 1. Check if client exists using their contact info
  const q = query(clientsRef, where("contact", "==", clientContact));
  const querySnapshot = await getDocs(q);
  
  let clientDocId;
  let clientDocData = {
    name: clientData.client,
    contact: clientData.contact,
    address: clientData.address,
    lastOrderDate: Timestamp.now(),
  };

  if (querySnapshot.empty) {
    // 2. Client DOES NOT exist: CREATE new client
    clientDocData = {
      ...clientDocData,
      createdAt: Timestamp.now(),
      totalInvoices: 1,
      // items: items // Optional: Keep track of all items ever purchased
    };
    const newDocRef = await addDoc(clientsRef, clientDocData);
    clientDocId = newDocRef.id;
  } else {
    // 3. Client EXISTS: UPDATE existing client record
    const existingDoc = querySnapshot.docs[0];
    clientDocId = existingDoc.id;
    
    // Increment invoice count and update last order date
    const updatedCount = (existingDoc.data().totalInvoices || 0) + 1;
    
    await updateDoc(doc(clientsRef, clientDocId), {
      ...clientDocData,
      totalInvoices: updatedCount,
    });
  }

  // Return the stable Firestore ID of the client document
  return clientDocId;
};


// Refactored handleSubmit (focus on the CREATE block)
const handleSubmit = async (e) => {
  e.preventDefault();

      if (Number(formData.paid) > Number(formData.amount)) {
    alert("Amount paid cannot be more than total amount");
    return;
  }

    const cleanData = {
    ...formData,
    amount: Number(formData.amount || 0),
    discount: Number(formData.discount || 0),
    paid: Number(formData.paid || 0),
    outstanding: Number(formData.outstanding || 0),
  };

  const dataToSave = {
    ...cleanData,
    // amount: Number(formData.amount),
    // ... (rest of your dataToSave object)
    items,
    created: Timestamp.fromDate(new Date(formData.created)),
    due: Timestamp.fromDate(new Date(formData.due)),
  };
  
  try {
    if (isEditing && editingInvoiceId) {
      // 🟢 UPDATE EXISTING INVOICE:
      // When updating, we usually don't need to re-save the client unless their details changed. 
      // For simplicity, we skip client update on invoice edit here.
      const invoiceRef = doc(txtdb, "invoices", editingInvoiceId);
      await updateDoc(invoiceRef, {
        ...dataToSave,
        updatedAt: Timestamp.now(),
      });
      alert("Invoice updated successfully!");
    } else {
      // 🟢 CREATE NEW INVOICE:
      
      // 1. Create or Update the Client Record
      const clientDocId = await saveClientData(formData, items); // Pass formData and items
      
      // 2. Prepare Invoice Data
      const image = `https://api.dicebear.com/9.x/adventurer/svg?seed=${formData.client.replace(/\s+/g, "")}`;
      
      // 3. Save the Invoice linked to the client
      const invoiceRef = await addDoc(collection(txtdb, "invoices"), {
        ...dataToSave,
        client_id: clientDocId, // 📌 KEY: Link invoice to the client document
        image,
        createdAt: Timestamp.now(),
      });
      const invoiceNo = invoiceRef.id.slice(0, 6).toUpperCase();

      // 🔥 Update the same document
      await updateDoc(invoiceRef, {
        invoiceNo,
      });
      alert("Invoice added successfully!");
    }

    // 4. Reset Form and State 
    resetFormAndState();
    // 5. Re-fetch data 
    await fetchInvoices(); 
    
  } catch (error) {
    console.error("Error saving invoice:", error);
    alert(`Failed to save invoice. Details: ${error.message}`);
  }
};

  //fetch invoices
  const [invoices, setInvoices] = useState([]);
// const [filteredInvoices, setFilteredInvoices] = useState([]);

//actions on invoices

const [openMenu, setOpenMenu] = useState(null);
const [selectedInvoice, setSelectedInvoice] = useState(null);
const [showDetails, setShowDetails] = useState(false);
const [showEdit, setShowEdit] = useState(false);

const toggleMenu = (id) => {
  setOpenMenu(openMenu === id ? null : id);
};

//view all

const viewInvoice = (inv) => {
  setSelectedInvoice(inv);
  setShowDetails(true);
  setOpenMenu(null);
};


// ✅ NEW: Reusable fetch function
const fetchInvoices = async () => {
  try {
    const q = collection(txtdb, "invoices");
    const querySnapshot = await getDocs(q);

    const list = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Ensure data is properly converted to Date objects
      created: doc.data().created.toDate(), 
      due: doc.data().due.toDate(),
    }));

    setInvoices(list);
    // Note: The filter useEffect will run automatically because 'invoices' changed
  } catch (error) {
    console.error("Error fetching invoices:", error);
  }
};

// Update useEffect to call the new function
useEffect(() => {
  fetchInvoices();
}, []); // Runs once on component mount

  // --- Updated Filtering Logic (Handles Tabs + Search) ---
// --- Updated Filtering & Sorting Logic ---
  const filteredInvoices = useMemo(() => {
    const filtered = invoices.filter((inv) => {
      // 1. Search Logic
      const searchLower = searchTerm.toLowerCase();
      const invoiceNo = inv.invoiceNo || inv.id.slice(0, 6).toUpperCase();
      const dateStr = new Date(inv.created).toLocaleDateString();
      
      const matchesSearch = 
        inv.client.toLowerCase().includes(searchLower) ||
        invoiceNo.toLowerCase().includes(searchLower) ||
        inv.status.toLowerCase().includes(searchLower) ||
        dateStr.includes(searchLower);

      if (!matchesSearch) return false;

      // 2. Tab Filter Logic
      if (filter === "all") return true;
      if (filter === "paid") return inv.status === "Paid";
      if (filter === "unpaid") return inv.status === "Unpaid";
      if (filter === "partial-payment") return inv.status === "Partial-Payment";
      if (filter === "draft") return inv.status === "Draft";

      return true;
    });

    // 3. Sorting Logic (Newest to Oldest)
    return filtered.sort((a, b) => {
      // Sort by 'created' date timestamp
      return b.created.getTime() - a.created.getTime();
    });

  }, [invoices, filter, searchTerm]);

// edit invoice function
const editInvoice = (inv) => {
  setFormData({
    client: inv.client,
    contact: inv.contact,
    address: inv.address,
    created: inv.created.toISOString().split("T")[0],
    due: inv.due.toISOString().split("T")[0],
    amount: inv.amount,
    discount: inv.discount,
    paid: inv.paid,
    outstanding: inv.outstanding,
    status: inv.status,
  });

  setItems(inv.items);
  
  // 💡 NEW: Set the editing state and the ID
  setEditingInvoiceId(inv.id); 
  setIsEditing(true); 

  setShowEdit(true);
  setShowForm(true);
  setOpenMenu(null);
};

// Refactored deleteInvoice
const deleteInvoice = async (id) => {
  if (!window.confirm("Are you sure you want to delete this invoice?")) return;

  try {
    await deleteDoc(doc(txtdb, "invoices", id));
    
    // 📌 CRITICAL: Re-fetch the data to update the UI
    await fetchInvoices(); 
    
    alert("Invoice deleted successfully!");
  } catch (error) {
    console.error("Error deleting invoice:", error);
    alert("Failed to delete invoice.");
  } finally {
    setOpenMenu(null);
  }
};

const [isGeneratingImage, setIsGeneratingImage] = useState(false);

// Function to generate and download image for sharing
const shareInvoice = async (inv) => {
  console.log("Share Invoice clicked for:", inv);
  
  setSelectedInvoice(inv);
  setIsGeneratingImage(true);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    const element = document.getElementById("image-content");
    if (!element) {
      console.error("Image content element not found");
      return;
    }
    
    void element.offsetHeight;
    
    console.log("Image innerHTML:", element.innerHTML);
    console.log("Image dimensions:", element.clientWidth, "x", element.clientHeight);
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      windowHeight: 1123,
      scrollX: 0,
      scrollY: 0,
    });
    
    const image = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.download = `Invoice-${inv.invoiceNo || inv.id.slice(0, 6).toUpperCase()}.png`;
    link.href = image;
    link.click();
    
    console.log("Image generation complete");
    
  } catch (error) {
    console.error("Image export error:", error);
    alert("Failed to generate image: " + error.message);
  } finally {
    setIsGeneratingImage(false);
    setSelectedInvoice(null);
  }
};


//invoices count
const invoiceCounts = useMemo(() => {
  const counts = {
    all: invoices.length,
    paid: 0,
    unpaid: 0,
    'partial-payment': 0,
    draft: 0,
  };

  invoices.forEach(inv => {
    switch (inv.status) {
      case "Paid":
        counts.paid++;
        break;
      case "Unpaid":
        counts.unpaid++;
        break;
      case "Partial-Payment":
        counts['partial-payment']++;
        break;
      case "Draft":
        counts.draft++;
        break;
      // No default case needed, as 'all' is already set to invoices.length
    }
  });

  return counts;
}, [invoices]); // Recalculate only when the main invoices list changes


// Located around line 652 in your code
useEffect(() => {
  const amount = itemsTotal;
  const paid = Number(formData.paid || 0);
  // 1. Get the discount value
  const discount = Number(formData.discount || 0); 
  
  // 2. Calculate the actual Total Paybale (Subtotal - Discount)
  const totalPayable = amount - discount;

  if (formData.status === "Paid") {
    setFormData(prev => ({
      ...prev,
      // 3. Set paid to the calculated payable amount, not just the subtotal
      paid: totalPayable > 0 ? totalPayable : 0, 
      outstanding: 0,
    }));
  }

  if (formData.status === "Unpaid") {
    setFormData(prev => ({
      ...prev,
      paid: 0,
      // Optional: This ensures Unpaid also respects the discount
      outstanding: totalPayable > 0 ? totalPayable : 0, 
    }));
  }

  if (formData.status === "Partial-Payment") {
    setFormData(prev => ({
      ...prev,
      // Optional: This ensures Partial logic respects the discount
      outstanding: (totalPayable - paid) > 0 ? (totalPayable - paid) : 0, 
    }));
  }

// 4. IMPORTANT: Add formData.discount to the dependency array below
}, [formData.status, formData.paid, itemsTotal, formData.discount]);



//invoice modal open and close
// const [showDetails, setShowDetails] = useState(false);
const [isOpen, setIsOpen] = useState(false);

const openModal = () => {
  setShowDetails(true);
  setTimeout(() => setIsOpen(true), 10);
};

const closeModal = () => {
  setIsOpen(false);
  setTimeout(() => setShowDetails(false), 300);
};

//share popup
const menuRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (e) => {
    // Check if the clicked element is inside a .menu-wrapper
    if (!e.target.closest(".menu-wrapper")) {
      setOpenMenu(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

// --- PAGINATION LOGIC ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset to page 1 whenever Filter or Search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  // This will now take the first 5 of the SORTED list
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);

  // Logic to change pages
  const paginateNext = () => setCurrentPage((prev) => prev + 1);
  const paginatePrev = () => setCurrentPage((prev) => prev - 1);
  // --- PAGINATION LOGIC END ---


  //
  // commas where neccessary
// Adds commas for display (e.g., 1000 -> "1,000")
  const formatNumber = (num) => {
    if (num === "" || num === null || num === undefined) return "";
    // Convert to string, remove existing commas, then format
    const clean = num.toString().replace(/,/g, "");
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Removes commas for calculation (e.g., "1,000" -> 1000)
  const cleanNumber = (str) => {
    return String(str).replace(/,/g, "");
  };

  // --- 2. Handlers with formatting logic ---

  // Handle Changes for main Form Data (Money fields)
  const handleMoneyChange = (e) => {
    const { name, value } = e.target;
    // Strip commas to save the raw number in state
    const rawValue = cleanNumber(value);

    // Prevent non-numeric input (allow empty string)
    if (rawValue && isNaN(rawValue)) return;

    setFormData((prev) => ({ ...prev, [name]: rawValue }));
  };

  // Handle Changes for Items (Rate/Qty)
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    
    if (field === "rate" || field === "quantity") {
       const rawValue = cleanNumber(value);
       if (rawValue && isNaN(rawValue)) return;
       newItems[index][field] = rawValue;
    } else {
       newItems[index][field] = value;
    }
    setItems(newItems);
  };

  // Auto-calculate Totals whenever Items, Discount, or Paid changes
  useEffect(() => {
    const totalAmount = items.reduce((acc, item) => {
      return acc + (item.quantity || 0) * (item.rate || 0);
    }, 0);

    const discount = parseFloat(formData.discount || 0);
    const paid = parseFloat(formData.paid || 0);
    const outstanding = (totalAmount - discount) - paid;

    setFormData(prev => ({
        ...prev,
        amount: totalAmount, // Auto-update Subtotal
        outstanding: outstanding > 0 ? outstanding : 0 // Auto-update Balance
    }));
  }, [items, formData.discount, formData.paid, setFormData]);


  
  
  return (
    <div className='layout'>

        <Navigation />

        <div className="invoice">

           <div className="invoice-container">

               <div className="invoice-header">
                      <p>Invoices</p>
          
                      <div className="search">
                          <CiSearch className='icon'/>
                        <input 
                        type="search" 
                        placeholder='Inv. Numbers, Client, Status, Date'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      </div>
            
              </div>

                     <div className="mobile-search">
                                <div className="search">
                                        <CiSearch className='icon'/>
                                     <input 
                                type="search" 
                                placeholder='Search Name or Contact' 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                                    </div>
                      </div>

            <div className="invoices">

        <div className="invoice-table-container">
          {/* Filter Tabs */}
          <div className="filters-tabs">
            <button onClick={()=> setShowForm(true)} className="create"> <MdOutlineNoteAdd className="icon"/> <p>Create Invoice</p></button>
            
            {/* All - Should always show the count */}
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All ({invoiceCounts.all})
            </button>
            
            {/* Paid - Only show count if > 0 */}
            <button
              className={filter === "paid" ? "active" : ""}
              onClick={() => setFilter("paid")}
            >
              Paid {invoiceCounts.paid > 0 && `(${invoiceCounts.paid})`}
            </button>
            
            {/* Unpaid - Only show count if > 0 */}
            <button
              className={filter === "unpaid" ? "active" : ""}
              onClick={() => setFilter("unpaid")}
            >
              Unpaid {invoiceCounts.unpaid > 0 && `(${invoiceCounts.unpaid})`}
            </button>
            
            {/* Partial - Only show count if > 0 */}
            <button
              className={filter === "partial-payment" ? "active" : ""}
              onClick={() => setFilter("partial-payment")}
            >
              Partial {invoiceCounts['partial-payment'] > 0 && `(${invoiceCounts['partial-payment']})`}
            </button>
            
            {/* Draft - Only show count if > 0 */}
            <button
              className={filter === "draft" ? "active" : ""}
              onClick={() => setFilter("draft")}
            >
              Draft {invoiceCounts.draft > 0 && `(${invoiceCounts.draft})`}
            </button>
          </div>

          {/* Table */}
        {/* Table */}
        <table className="invoice-table">
          <thead>
            <tr>
              <th>Client</th>
              <th className="not-mobile">Created</th>
              <th className="not-mobile">Due</th>
              <th className="not-mobile">Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          {/* 🛑 Start of Conditional Rendering 🛑 */}
          {filteredInvoices.length > 0 ? (
            <tbody>
              {currentInvoices.map((inv) => (
                <tr key={inv.id}>
                  {/* ... existing table row content ... */}
                  <td>
                    <div className="client-info">
                      <img src={inv.image} alt={inv.client} className="client-avatar" />
                      <div>
                        <p className="client-name">#{inv.invoiceNo || inv.id.slice(0, 6).toUpperCase()}</p>
                        <span className="client-contact">{inv.client}</span>
                      </div>
                    </div>
                  </td>
                  <td className="not-mobile">{new Date(inv.created).toLocaleDateString()}</td>
                  <td className="not-mobile">{new Date(inv.due).toLocaleDateString()}</td>
               <td className="not-mobile">
                  &#8358;{Number(inv.amount).toLocaleString()}
                </td>

               <td>
                <span className={statusColor(inv.status)}>
                  {inv.status === "Partial-Payment" ? "Partial" : inv.status}
                </span>
              </td>
                  {/* actions (menu wrapper) */}
                <td className="actions">
                 <div className="menu-wrapper" >
                    <button 
                      className="menu-btn"
                      onClick={() => toggleMenu(inv.id)}
                    >
                   <CiMenuKebab className="menu-icon"/>
                    </button>

                    {openMenu === inv.id && (
                      <div className="menu-dropdown">
                        <p
                        onClick={() => {
                          viewInvoice(inv);
                          openModal();
                        }}
                      >
                        View
                      </p>
                        <p onClick={() => editInvoice(inv)}>Edit</p>
                        <p onClick={() => shareInvoice(inv)}>Share Invoice</p>
                        <p className="delete" onClick={() => deleteInvoice(inv.id)}>Delete</p>
                      </div>
                    )}
                  </div>
                </td>

                </tr>
              ))}
            </tbody>
          ) : (
            // 🛑 Dynamic Placeholder Row 🛑
            <tbody>
              <tr>
                {/*
                  colspan="6" spans the content across all 6 table columns 
                  (Client, Created, Due, Amount, Status, Actions)
                */}
                <td colSpan="6" className="no-data-cell"> 
                  <div className="no-data-content">
                    <h3>No {filter === 'all' ? '' : filter} Invoices Found</h3>
                    <p>It looks like there are no invoices matching the status filter you selected.</p>
                    {filter === 'all' && (
                        <p>Click "Create Invoice" to add your first entry.</p>
                    )}
                    {filter !== 'all' && (
                        <p>Try switching the filter to "All" or adding a new invoice.</p>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          )}
        </table>

          {/* Pagination (static mockup) */}
      {/* Dynamic Pagination */}
          {filteredInvoices.length > 0 && (
            <div className="pagination">
              {/* Previous Button: Only shows if we have clicked Next (page > 1) */}
              {currentPage > 1 ? (
                <button onClick={paginatePrev}>Previous</button>
              ) : (
                /* Empty div to keep spacing if using flexbox, or remove if not needed */
                <div></div>
              )}

              {/* Page Indicator (Optional, but helpful) */}
              <div className="pages">
                <p>
                  Page {currentPage} of {Math.ceil(filteredInvoices.length / itemsPerPage)}
                </p>
              </div>

              {/* Next Button: Only shows if there are more items beyond the current page */}
              {filteredInvoices.length > indexOfLastItem ? (
                <button onClick={paginateNext}>Next</button>
              ) : (
                 <div></div>
              )}
            </div>
          )}
        </div>

            </div>


           </div>

           
     

        </div>

       {showDetails && (
        <div
          className={`modal ${isOpen ? "show" : ""}`}
          onClick={closeModal}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >

          <div className="modal-container-details">

            <button className="close-modal-btn" onClick={closeModal}>
          <IoCloseOutline />
        </button>

          {/* Header */}
          <div className="invoice-header">
            <div className="brand">
              <h2>Evanis Interiors & Furnitures</h2>
              <p>www.evanisinteriors.com</p>
            </div>

            <div className="company-address">
              <p>20, Furniture Avenue</p>
              <p>Jakande gate Bus stop,</p>
              <p>Oke-Afa, Isolo Lagos</p>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="invoice-info">
            <div>
              <h4>Invoice Details</h4>
              <p><b>Invoice No:</b> {selectedInvoice.invoiceNo || "—"}</p>
              <p>
                <b>Issued:</b>{" "}
                {selectedInvoice.created.toLocaleDateString()}
              </p>
              <p>
                <b>Due:</b>{" "}
                {selectedInvoice.due.toLocaleDateString()}
              </p>
            </div>

            <div>
              <h4>Billed To</h4>
              <p>{selectedInvoice.client}</p>
              <p>{selectedInvoice.contact}</p>
              <p>{selectedInvoice.address}</p>
            </div>
          </div>

          {/* Items */}
          <div className="invoice-items">
            <div className="items-header">
              <span>Item</span>
              <span>Qty</span>
              <span>Rate</span>
              <span>Amount</span>
            </div>

            {selectedInvoice.items.map((item, i) => (
              <div className="item-row" key={i}>
                <span>{item.name}</span>
                <span>{item.quantity}</span>
                <span>₦{item.rate?.toLocaleString() || "—"}</span>
                <span>
                  ₦
                  {(
                    (item.rate || 0) * item.quantity
                  ).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="invoice-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>
                ₦{selectedInvoice.amount.toLocaleString()}
              </span>
            </div>

            <div className="summary-row">
              <span>Paid</span>
              <span>
                ₦{selectedInvoice.paid.toLocaleString()}
              </span>
            </div>

            <div className="summary-row">
              <span>Outstanding</span>
              <span className="total">
                ₦{selectedInvoice.outstanding.toLocaleString()}
              </span>
            </div>
          </div>
        </div>



          </div>

              
              <div className="modal-box">
                <h2>Invoice Details</h2>

                <p><b>Client:</b> {selectedInvoice.client}</p>
                <p><b>Contact:</b> {selectedInvoice.contact}</p>
                <p><b>Address:</b> {selectedInvoice.address}</p>

                <p><b>Created:</b> {selectedInvoice.created.toLocaleDateString()}</p>
                <p><b>Due:</b> {selectedInvoice.due.toLocaleDateString()}</p>

                <h3>Items</h3>
                {selectedInvoice.items.map((item, i) => (
                  <p key={i}>{item.name} — {item.quantity}</p>
                ))}

                <p><b>Amount:</b> ₦{selectedInvoice.amount}</p>
                <p><b>Paid:</b> ₦{selectedInvoice.paid}</p>
                <p><b>Outstanding:</b> ₦{selectedInvoice.outstanding}</p>

                <button onClick={() => setShowDetails(false)}>Close</button>
              </div>
              
            </div>
          )}


          {/* Image content for generation */}
{isGeneratingImage && selectedInvoice && (
  <div
    id="image-content"
    style={{
      position: isGeneratingImage ? 'fixed' : 'absolute',
      top: isGeneratingImage ? '0' : '-9999px',
      left: isGeneratingImage ? '0' : '-9999px',
      width: '210mm',
      minHeight: '297mm',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: '13px',
      boxSizing: 'border-box',
      padding: '15mm 20mm',
      visibility: 'visible',
      zIndex: isGeneratingImage ? 9999 : -1,
    }}
  >
    <div style={{ width: '100%', lineHeight: '1.4' }}>
      
      {/* 1. TOP HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '50px' }}>
        <div style={{ width: '200px' }}>
          {/* Logo Placeholder - Replace src with your actual logo path */}
          <img src={logo} alt="evanis-interiors-logo" style={{ maxWidth: '100%', height: 'auto' }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: '400', color: '#333' }}>Invoice</h2>
          <h3 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>EVANIS INTERIORS & FURNITURES</h3>
          <p style={{ margin: '5px 0 0 0', color: '#555' }}>20 Furniture Avenue Jakande St</p>
          <p style={{ margin: '2px 0 0 0', color: '#555' }}>+2347038065509</p>
          <p style={{ margin: '2px 0 0 0', color: '#555' }}>evanisinteriors@gmail.com</p>
        </div>
      </div>

      {/* 2. GREY BILLING BAR */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        backgroundColor: '#f1f4f8', 
        padding: '20px', 
        marginBottom: '40px' 
      }}>
        <div>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>Bill To</p>
          <p style={{ margin: '0', fontSize: '14px' }}>{selectedInvoice.client || 'Mrs Diamond Ikebudu'}</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '14px' }}>{selectedInvoice.contact || '07026615513'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '5px' }}>
            <span style={{ fontWeight: 'bold', width: '100px' }}>Invoice #</span>
            <span>{selectedInvoice.invoiceNo || '221'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontWeight: 'bold', width: '100px' }}>Date</span>
            <span>{selectedInvoice.created ? new Date(selectedInvoice.created).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '23 Sep 2025'}</span>
          </div>
        </div>
      </div>

      {/* 3. ITEMS TABLE */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee' }}>
            <th style={{ padding: '12px 0', textAlign: 'left', fontSize: '14px' }}>Item</th>
            <th style={{ padding: '12px 0', textAlign: 'right', fontSize: '14px', width: '100px' }}>Quantity</th>
            <th style={{ padding: '12px 0', textAlign: 'right', fontSize: '14px', width: '120px' }}>Price</th>
            <th style={{ padding: '12px 0', textAlign: 'right', fontSize: '14px', width: '120px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(selectedInvoice.items || []).map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f1f1f1' }}>
              <td style={{ padding: '15px 0', fontWeight: 'bold' }}>{item.name}</td>
              <td style={{ padding: '15px 0', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: '15px 0', textAlign: 'right' }}>₦{(item.rate || 0).toLocaleString()}</td>
              <td style={{ padding: '15px 0', textAlign: 'right', fontWeight: 'bold' }}>₦{(item.rate * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. PAYMENT & TOTALS SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '50px' }}>
        <div>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '14px' }}>Payment Instructions</p>
          <p style={{ margin: '0', color: '#666' }}>Naira</p>
          <p style={{ margin: '2px 0', color: '#666' }}>1305981744</p>
          <p style={{ margin: '2px 0', color: '#666' }}>EVANIS INTERIORS</p>
          <p style={{ margin: '2px 0', color: '#666' }}>PROVIDUS BANK</p>
        </div>
        <div style={{ width: '250px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#666' }}>Subtotal</span>
            <span>₦{(selectedInvoice.amount || 0).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '10px' }}>
            <span>Paid</span>
            <span>₦{(selectedInvoice.paid || 0).toLocaleString()}</span>
          </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '10px' }}>
            <span>Outstanding</span>
            <span>₦{(selectedInvoice.outstanding || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 5. AMOUNT DUE HIGHLIGHT */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' }}>
        <div style={{ backgroundColor: '#f1f4f8', padding: '15px 30px', textAlign: 'right' }}>
          <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>Amount Due</p>
          <h2 style={{ margin: '5px 0 0 0', fontSize: '28px', fontWeight: 'bold' }}>
            ₦{(selectedInvoice.amount || 0).toLocaleString()}
          </h2>
        </div>
      </div>

      {/* 6. SIGNATURE SECTION */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <p style={{ fontSize: '11px', color: '#444', marginBottom: '20px' }}>
          By signing this document, the customer agrees to the services and conditions described in this document.
        </p>
        <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>EVANIS INTERIORS & FURNITURES</p>
        <div style={{ height: '40px' }}>
          {/* If you have a signature image, put it here */}
          <div style={{ borderBottom: '1px solid #ccc', width: '200px' }}></div>
        </div>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>23 Sep 2025</p>
      </div>

    </div>
  </div>
)}


        {showForm && (
        <div className="invoice-form">
          <div className="add-invoice-form">
            
            {/* Header / Cancel */}
            <div className="cancel" onClick={() => setShowForm(false)}>
              <IoIosArrowBack className="icon" />
              <p>Back to Invoices</p>
            </div>
            
            <h2>{isEditing ? "Edit Invoice" : "Create New Invoice"}</h2>

            <form onSubmit={handleSubmit}>
              
              {/* --- SECTION 1: CLIENT DETAILS --- */}
              <div className="form-section">
                <h3>Client Information</h3>
                <div className="client-dets">
                  <div className="input-group">
                    <label>Client Name</label>
                    <input
                      type="text"
                      name="client"
                      placeholder="e.g. John Doe"
                      value={formData.client}
                      onChange={(e) => setFormData({...formData, client: e.target.value})}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Contact (Phone/Email)</label>
                    <input
                      type="text"
                      name="contact"
                      placeholder="e.g. 08012345678"
                      value={formData.contact}
                      onChange={(e) => setFormData({...formData, contact: e.target.value})}
                      required
                    />
                  </div>

                  <div className="input-group full-width">
                    <label>Billing Address</label>
                    <input
                      type="text"
                      name="address"
                      placeholder="e.g. 123 Main Street, Lagos"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* --- SECTION 2: DATES --- */}
              <div className="form-section">
                <h3>Dates</h3>
                <div className="date-dets">
                  <div className="input-group">
                    <label>Invoice Date</label>
                    <input
                      type="date"
                      name="created"
                      value={formData.created}
                      onChange={(e) => setFormData({...formData, created: e.target.value})}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      name="due"
                      value={formData.due}
                      onChange={(e) => setFormData({...formData, due: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* --- SECTION 3: ITEMS --- */}
              <div className="form-section">
                <h3>Item Details</h3>
                
                {/* Labels Header - clearer than repeating labels */}
                <div className="items-header">
                   <span className="lbl-item">Item Name</span>
                   <span className="lbl-qty">Qty</span>
                   <span className="lbl-rate">Price (₦)</span>
                   <span className="lbl-total">Total (₦)</span>
                   <span className="lbl-action"></span>
                </div>

                <div className="items-dets">
                  {items.map((item, index) => (
                    <div key={index} className="item-input">
                      {/* Name */}
                      <input
                        className="inp-item"
                        type="text"
                        placeholder="Description"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, "name", e.target.value)}
                        required
                      />

                      {/* Quantity */}
                      <input
                        className="inp-qty"
                        type="text" // Changed to text for formatting control
                        placeholder="0"
                        value={formatNumber(item.quantity)}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        required
                      />

                      {/* Rate */}
                      <input
                        className="inp-rate"
                        type="text"
                        placeholder="0.00"
                        value={formatNumber(item.rate)}
                        onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                        required
                      />

                      {/* Auto-Calculated Total Row */}
                      <input
                        className="inp-total"
                        type="text"
                        value={formatNumber((item.quantity * item.rate) || 0)}
                        readOnly
                        disabled
                      />

                      {/* Remove Button */}
                      <div className="inp-action">
                        {items.length > 1 && (
                          <button
                            className="close-btn"
                            type="button"
                            onClick={() => {
                                const newItems = items.filter((_, i) => i !== index);
                                setItems(newItems);
                            }}
                          >
                             {/* Use 'X' or your Icon here */}
                             &times; 
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button className="add-btn" type="button" onClick={() => setItems([...items, { name: "", quantity: "", rate: "" }])}>
                     + Add Another Item
                  </button>
                </div>
              </div>

              {/* --- SECTION 4: PAYMENT STATUS & TOTALS --- */}
              <div className="form-section">
                <h3>Payment Details</h3>
                
                <div className="status-group">
                   <label>Payment Status</label>
                   <select
                    name="status"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Partial-Payment">Partial Payment</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="money-dets">
                  
                  <div className="input-group">
                    <label>Subtotal (₦)</label>
                    <input
                      type="text"
                      name="amount"
                      value={formatNumber(formData.amount)}
                      readOnly // This is now auto-calculated
                      className="readonly-input"
                    />
                  </div>

                  <div className="input-group">
                    <label>Discount (₦)</label>
                    <input
                      type="text"
                      name="discount"
                      placeholder="0"
                      value={formatNumber(formData.discount)}
                      onChange={handleMoneyChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Amount Paid (₦)</label>
                    <input
                      type="text"
                      name="paid"
                      placeholder="0"
                      value={formatNumber(formData.paid)}
                      onChange={handleMoneyChange}
                      disabled={formData.status === "Unpaid"}
                    />
                  </div>

                  <div className="input-group">
                    <label>Balance Due (₦)</label>
                    <input
                      type="text"
                      name="outstanding"
                      value={formatNumber(formData.outstanding)}
                      readOnly
                      className="readonly-input bold-balance"
                    />
                  </div>
                </div>
              </div>

              <button className="submit-btn" type="submit">
                 {isEditing ? "Update Invoice" : "Generate Invoice"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default Invoice