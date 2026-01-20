import React, { useState, useMemo, useEffect } from "react";
import Navigation from "../components/Navigation";
import { AiOutlineUsergroupAdd } from "react-icons/ai";
import { CiSearch } from "react-icons/ci";
import { collection, getDocs, where, query } from "firebase/firestore";
import { txtdb } from "../../../firebase-config";

function Clients() {
 const [filter, setFilter] = useState("all");
  const [clients, setClients] = useState([]); // State for all clients
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [selectedClient, setSelectedClient] = useState(null); // State for modal view
  const [clientInvoices, setClientInvoices] = useState([]); // State for client's order history

  //search
  const [searchTerm, setSearchTerm] = useState("");


// --- 1. Fetch Clients Data ---
 const fetchClients = async () => {
    setIsLoading(true);
    try {
        const clientsRef = collection(txtdb, "clients");
        const querySnapshot = await getDocs(clientsRef);

        const clientsListPromises = querySnapshot.docs.map(async (doc) => {
            const clientData = doc.data();
            const clientId = doc.id;
            
            // 💡 Get the calculated status for the client
            const overallStatus = await getClientOverallStatus(clientId);

            return {
                id: clientId,
                ...clientData,
                status: overallStatus, // 📌 Store the calculated status here
                date: clientData.lastOrderDate?.toDate().toISOString().split("T")[0] || null, 
            };
        });

        // Resolve all status calculations concurrently
        const clientsList = await Promise.all(clientsListPromises);

        setClients(clientsList);
    } catch (error) {
        console.error("Error fetching clients:", error);
    } finally {
        setIsLoading(false);
    }
};

  useEffect(() => {
    fetchClients();
  }, []);


  // --- 2. Filter Logic (Updated) ---
const filteredClients = useMemo(() => {
    const now = new Date();
    const days28Ago = new Date();
    days28Ago.setDate(now.getDate() - 28);

    return clients.filter((client) => {
      // Search Logic
      const matchesSearch = 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      
      // Filter Tabs Logic
      if (filter === "all") return true;

      if (filter === "last28") {
        if (!client.date) return false;
        const clientDate = new Date(client.date);
        return clientDate >= days28Ago && clientDate <= now;
      }

      if (filter === "owing") {
        return client.status === "Owing";
      }

      if (filter === "due") {
        return client.status === "Owing";
      }

      if (filter === "completed") {
        return client.status === "Completed";
      }

      return true;
    });
    // ⬇️ searchTerm added here so the list updates as you type
  }, [filter, clients, searchTerm]);

  // --- 3. View Details/Order History Logic ---

  const viewClientDetails = async (client) => {
    setSelectedClient(client);
    setClientInvoices([]);

    // Fetch all invoices belonging to this client using client_id
    try {
      const invoicesRef = collection(txtdb, "invoices");
      const q = query(invoicesRef, where("client_id", "==", client.id));
      const querySnapshot = await getDocs(q);

      const history = querySnapshot.docs.map(doc => ({
        invoiceId: doc.id,
        ...doc.data(),
        // Convert Timestamps for display
        created: doc.data().created.toDate(),
        due: doc.data().due.toDate(),
        status: doc.data().status || 'Draft',
      }));
      setClientInvoices(history);
      
    } catch (error) {
      console.error("Error fetching client invoices:", error);
      setClientInvoices([]);
    }
  };

  const getOverallClientStatus = (invoices) => {
  if (invoices.length === 0) return 'No Invoices';

  // Check if ANY invoice is Unpaid or Partial-Payment
  const isOwing = invoices.some(inv => 
    inv.status === "Unpaid" || inv.status === "Partial-Payment"
  );
  
  if (isOwing) {
    return 'Owing';
  }

  // Check if ALL invoices are Paid
  const allPaid = invoices.every(inv => inv.status === "Paid");

  if (allPaid) {
    return 'Completed';
  }
  
  // If there are invoices but none are Paid/Unpaid/Partial (e.g., all Drafts)
  return 'Review'; 
};

// A function to fetch invoices and determine a single client's overall status
const getClientOverallStatus = async (clientId) => {
    const invoicesRef = collection(txtdb, "invoices");
    const q = query(invoicesRef, where("client_id", "==", clientId));
    const querySnapshot = await getDocs(q);
    const invoices = querySnapshot.docs.map(doc => doc.data());

    if (invoices.length === 0) return 'No Orders';

    // Check for Owing status first (Unpaid or Partial)
    const isOwing = invoices.some(inv => 
        inv.status === "Unpaid" || inv.status === "Partial-Payment"
    );
    
    if (isOwing) {
        return 'Owing';
    }

    // Check for Completed status (all are Paid)
    const allPaid = invoices.every(inv => inv.status === "Paid");

    if (allPaid) {
        return 'Completed';
    }
    
    // Default for cases like only drafts or mixed statuses that don't fit above
    return 'Review'; 
};

  const getClientStatusClass = (status) => {
  switch (status) {
    case "Completed":
      return "complete";
    case "Owing":
      return "pending";
    case "Review":
      return "pending";
    case "No Orders":
      return "canceled";
    default:
      return "pending";
  }
};

//client details popup
const [isClientModalOpen, setIsClientModalOpen] = useState(false);

const openClientModal = (client) => {
  setSelectedClient(client);
  requestAnimationFrame(() => {
    setIsClientModalOpen(true);
  });
};

  return (
    <div className="layout">
      <Navigation />

      <div className="clients">
        
        <div className="clients-header">
          <p>Clients</p>

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

        <div className="client-table-container">
          <div className="filters">
            <button
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All Clients
            </button>
            <button
              className={filter === "last28" ? "active" : ""}
              onClick={() => setFilter("last28")}
            >
              Last 28 Days
            </button>
            <button
              className={filter === "owing" ? "active" : ""}
              onClick={() => setFilter("owing")}
            >
              Owing (Overdue)
            </button>
            <button
              className={filter === "due" ? "active" : ""}
              onClick={() => setFilter("due")}
            >
              Due Payments
            </button>
            <button
              className={filter === "completed" ? "active" : ""}
              onClick={() => setFilter("completed")}
            >
              Completed
            </button>
          </div>

        <table className="client-table">
          {/* ... <thead> ... */}
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="empty">
                  Loading client data...
                </td>
              </tr>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client, index) => (
                // 👇 Add onClick to the row to view details 👇
                <tr key={client.id} onClick={() => viewClientDetails(client)} className="client-row-clickable">
                  <td>{index + 1}</td>
                  <td>{client.name}</td>
                  <td className="not-mobile">{client.contact}</td>
                  <td className="not-mobile">{client.address}</td>
                  {/* Use the new 'date' field from the fetched data */}
                  <td className="not-mobile">{client.date ? new Date(client.date).toLocaleDateString() : 'N/A'}</td> 
                  {/* Use the real data: totalInvoices */}
                  <td className="not-mobile">{client.totalInvoices || 0}</td> 
                  <td>
                  {/* 🟢 This now uses the pre-calculated and correct status */}
                <span className={`status ${getClientStatusClass(client.status)}`}>
                    {client.status}
                  </span>
                </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty">
                  No clients found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Client Details Modal/Panel */}
{selectedClient && (
  <div className="client-drawer-overlay" onClick={() => setSelectedClient(null)}>
    <aside 
      className={`drawer-content ${selectedClient ? "open" : ""}`} 
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <header className="drawer-header">
        <div className="header-main">
          <h2>{selectedClient.name}</h2>
          <span className={`status-pill ${getOverallClientStatus(clientInvoices).toLowerCase()}`}>
             {getOverallClientStatus(clientInvoices)}
          </span>
        </div>
        <button className="close-btn" onClick={() => setSelectedClient(null)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </header>

      <div className="drawer-body">
        {/* Primary Info Section */}
        <section className="info-section">
          <div className="info-grid">
            <div className="info-item">
              <label>Contact</label>
              <p>{selectedClient.contact}</p>
            </div>
            <div className="info-item">
              <label>Last Order</label>
              <p>{selectedClient.date ? new Date(selectedClient.date).toLocaleDateString() : "N/A"}</p>
            </div>
            <div className="info-item full-width">
              <label>Address</label>
              <p>{selectedClient.address}</p>
            </div>
          </div>
        </section>

        {/* Order History Section */}
        <section className="history-section">
          <div className="section-title">
            <h3>Order History</h3>
            <span className="count-badge">{clientInvoices.length}</span>
          </div>

          {clientInvoices.length > 0 ? (
            <div className="history-list">
              {clientInvoices.map((inv) => (
                <div key={inv.invoiceId} className="history-card">
                  <div className="card-left">
                    <span className="inv-id">#{inv.invoiceId.slice(0, 6)}</span>
                    <span className="inv-date">Due: {inv.due.toLocaleDateString()}</span>
                  </div>
                  <div className="card-right">
                    <span className="inv-amount">₦{inv.amount.toLocaleString()}</span>
                    <span className={`inv-status ${inv.status.toLowerCase()}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No invoices found for this client.</div>
          )}
        </section>
      </div>
    </aside>
  </div>
)}

      
    </div>
  );
}

export default Clients;
