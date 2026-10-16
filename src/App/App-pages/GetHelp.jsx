import React, { useState, useEffect } from "react";
import UserNav from "../App-components/UserNav";
import { FaInstagram, FaWhatsapp, FaTiktok } from "react-icons/fa";
import { MdMailOutline } from "react-icons/md";
import {
  FiSearch,
  FiChevronDown,
  FiChevronRight,
  FiHelpCircle,
  FiX,
} from "react-icons/fi";

const MAIN_INSTAGRAM_URL = "https://www.instagram.com/evanis_interiors";
const STUDIO_INSTAGRAM_URL = "https://www.instagram.com/evanisdesigns";
const TIKTOK_URL = "https://www.tiktok.com/@evanis___interiors";

const WHATSAPP_NUMBER = "2347038065509";
const WHATSAPP_MESSAGE =
  "Hello Evanis Interiors, I'm reaching out from your website and would like to make an inquiry regarding your furniture collection / custom builds.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

const CATEGORY_TABS = [
  { value: "all", label: "All" },
  { value: "shipping", label: "Orders & Shipping" },
  { value: "custom", label: "Custom & Care" },
  { value: "policy", label: "Policies" },
];

const SUGGESTED_FAQS = [
  {
    id: "s1",
    category: "custom",
    categoryLabel: "Custom & Care",
    question: "What is the estimated delivery time for custom pieces?",
    answer:
      "Bespoke and custom-built furniture typically requires a lead time of 4 to 6 weeks for manufacturing, quality assurance, and preparation for dispatch.",
  },
  {
    id: "s2",
    category: "shipping",
    categoryLabel: "Orders & Shipping",
    question: "What are your shipping options and range?",
    answer:
      "We offer nationwide shipping across Nigeria. While our primary operations span Port Harcourt and Lagos, our logistics network ensures your bespoke pieces are delivered securely to your doorstep. Freight and white-glove delivery fees are calculated separately during checkout.",
  },
  {
    id: "s3",
    category: "policy",
    categoryLabel: "Policies",
    question: "What is your return and refund policy?",
    answer:
      "Due to the highly personalized and bespoke nature of our furniture, we do not offer refunds or returns once an order has been processed, built, or delivered.",
  },
];

const ALL_FAQS = [
  {
    id: "a1",
    category: "shipping",
    categoryLabel: "Orders & Shipping",
    question: "How do I place an order?",
    answer:
      "Simply browse our online collection, add your desired pieces to the cart, and proceed to checkout. You will be prompted to enter your shipping details and complete your payment.",
  },
  {
    id: "a2",
    category: "custom",
    categoryLabel: "Custom & Care",
    question: "Do you offer custom designs or dimension alterations?",
    answer:
      "Yes, we specialize in custom furniture builds and spatial planning. If you need specific dimensions or unique fabrics, please reach out to our support team before placing your order.",
  },
  {
    id: "a3",
    category: "shipping",
    categoryLabel: "Orders & Shipping",
    question: "How do I track my order status?",
    answer:
      "Once your order moves into the production phase, and subsequently to shipping, you can track its progress directly from the 'Order History' tab in your Account Dashboard.",
  },
  {
    id: "a4",
    category: "custom",
    categoryLabel: "Custom & Care",
    question: "How should I care for my furniture?",
    answer:
      "We use high-quality, sustainable materials. A detailed digital care guide covering fabric maintenance, wood polishing, and general upkeep is provided with every purchase.",
  },
  {
    id: "a5",
    category: "policy",
    categoryLabel: "Policies",
    question: "Can I modify my order after payment?",
    answer:
      "Order modifications (such as changing a fabric color or dimension) can only be accommodated within 24 hours of payment. After this window, production begins and changes cannot be made.",
  },
];

const POPULAR_TOPICS = [
  { label: "Tracking", targetId: "a3" },
  { label: "Refunds", targetId: "s3" },
  { label: "Custom Orders", targetId: "a2" },
  { label: "Shipping Range", targetId: "s2" },
];

const CONTACT_CHANNELS = [
  {
    key: "instagram",
    label: "Main Instagram • Fastest Reply",
    title: "@evanis_interiors",
    preview:
      "Send us a DM for the fastest response on orders, custom furniture builds, and inquiries",
    href: MAIN_INSTAGRAM_URL,
    external: true,
    Icon: FaInstagram,
  },
  {
    key: "instagram-studio",
    label: "Design Studio Instagram",
    title: "@evanisdesigns",
    preview:
      "Explore our interior architecture portfolio, spatial planning, and studio installations",
    href: STUDIO_INSTAGRAM_URL,
    external: true,
    Icon: FaInstagram,
  },
  {
    key: "whatsapp",
    label: "WhatsApp Support",
    title: "+234 703 806 5509",
    preview:
      "Direct messaging for custom dimensions, fabric swatches, and delivery quotes",
    href: WHATSAPP_URL,
    external: true,
    Icon: FaWhatsapp,
  },
  {
    key: "email",
    label: "Email Support",
    title: "evanisinteriors@gmail.com",
    preview:
      "For order inquiries, official invoices, and bespoke project consultations",
    href: "mailto:evanisinteriors@gmail.com",
    external: false,
    Icon: MdMailOutline,
  },
  {
    key: "tiktok",
    label: "TikTok",
    title: "@evanis___interiors",
    preview: "Watch spatial transformations and furniture craftsmanship",
    href: TIKTOK_URL,
    external: true,
    Icon: FaTiktok,
  },
];

function GetHelp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [openFaq, setOpenFaq] = useState("s1");

  useEffect(() => {
    document.title = "Support - Evanis Interiors";
  }, []);

  const toggleFaq = (id) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  // Smooth scroll & auto-open for popular topics
  const handleTopicClick = (faqId) => {
    setSearchQuery("");
    setCategoryFilter("all");
    setOpenFaq(faqId);

    setTimeout(() => {
      const element = document.getElementById(faqId);
      if (element) {
        const yOffset = -120;
        const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 100);
  };

  // --- FILTERING ---
  const combinedFaqs = [...SUGGESTED_FAQS, ...ALL_FAQS];
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesSearch = (faq) => {
    if (!normalizedQuery) return true;
    return (
      faq.question.toLowerCase().includes(normalizedQuery) ||
      faq.answer.toLowerCase().includes(normalizedQuery) ||
      faq.categoryLabel.toLowerCase().includes(normalizedQuery)
    );
  };

  const matchesCategory = (faq, cat) => cat === "all" || faq.category === cat;

  const categoryCount = (cat) =>
    combinedFaqs.filter((f) => matchesCategory(f, cat) && matchesSearch(f)).length;

  const visibleSuggested = SUGGESTED_FAQS.filter(
    (f) => matchesCategory(f, categoryFilter) && matchesSearch(f)
  );
  const visibleAll = ALL_FAQS.filter(
    (f) => matchesCategory(f, categoryFilter) && matchesSearch(f)
  );
  const visibleCombined = combinedFaqs.filter(
    (f) => matchesCategory(f, categoryFilter) && matchesSearch(f)
  );

  // --- RENDER ONE FAQ ROW ---
  const renderFaqRow = (faq) => {
    const isOpen = openFaq === faq.id;

    return (
      <div
        key={faq.id}
        id={faq.id}
        className={`faq-item ${isOpen ? "open" : ""}`}
      >
        <button
          type="button"
          className="faq-row-btn"
          onClick={() => toggleFaq(faq.id)}
          aria-expanded={isOpen}
        >
          <span className="faq-main">
            <span className="faq-cat">{faq.categoryLabel}</span>
            <span className="faq-question">{faq.question}</span>
          </span>

          <span className="faq-end">
            <FiChevronDown className="faq-chevron" />
          </span>
        </button>

        <div className="faq-answer-grid" aria-hidden={!isOpen}>
          <div className="faq-answer-inner">
            <p className="faq-answer">{faq.answer}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="user-help-wrapper">
      <UserNav />

      <div className="help-page">
        <div className="help-container page">
          
          {/* --- PAGE HEADER --- */}
          <div className="help-header">
            <div>
              <h1>Help & Support</h1>
              <p className="help-subtitle">
                Answers to common questions about bespoke orders, nationwide delivery, and care.
              </p>
            </div>

            <a
              href={MAIN_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="header-contact-btn"
            >
              <FaInstagram />
              <span>Contact Us Faster</span>
            </a>
          </div>

          {/* --- TABS + SEARCH BAR --- */}
          <div className="help-controls">
            <div className="help-tabs">
              {CATEGORY_TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.value}
                  className={categoryFilter === tab.value ? "help-tab active" : "help-tab"}
                  onClick={() => setCategoryFilter(tab.value)}
                >
                  {tab.label}
                  <span className="count">{categoryCount(tab.value)}</span>
                </button>
              ))}
            </div>

            <div className="help-search">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search shipping, refunds, care..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>

          {/* --- POPULAR TOPICS --- */}
          <div className="popular-topics-bar">
            <span className="topics-label">Popular topics:</span>
            <div className="topics-list">
              {POPULAR_TOPICS.map((topic) => (
                <button
                  type="button"
                  key={topic.targetId}
                  className="topic-chip"
                  onClick={() => handleTopicClick(topic.targetId)}
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* --- FAQ SECTIONS --- */}
          {visibleCombined.length === 0 ? (
            <div className="empty-help">
              <FiHelpCircle className="empty-icon" />
              <h3>No matching questions</h3>
              <p>
                We couldn't find any articles matching "{searchQuery}". Try another keyword or reach out to our support team below.
              </p>
              <button
                type="button"
                className="reset-btn"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                }}
              >
                Reset filters
              </button>
            </div>
          ) : categoryFilter === "all" && !normalizedQuery ? (
            <>
              {visibleSuggested.length > 0 && (
                <div className="help-section">
                  <h2 className="help-section-title">Suggested Questions</h2>
                  <div className="faq-list">{visibleSuggested.map(renderFaqRow)}</div>
                </div>
              )}

              {visibleAll.length > 0 && (
                <div className="help-section">
                  <h2 className="help-section-title">All Questions</h2>
                  <div className="faq-list">{visibleAll.map(renderFaqRow)}</div>
                </div>
              )}
            </>
          ) : (
            <div className="help-section">
              <h2 className="help-section-title">
                {normalizedQuery ? `Search Results (${visibleCombined.length})` : CATEGORY_TABS.find((t) => t.value === categoryFilter)?.label}
              </h2>
              <div className="faq-list">{visibleCombined.map(renderFaqRow)}</div>
            </div>
          )}

          {/* --- DIRECT CONTACT CHANNELS --- */}
          <div className="help-section contact-section">
            <h2 className="help-section-title">Direct Contact Channels</h2>
            <div className="contact-list">
              {CONTACT_CHANNELS.map(({ key, label, title, preview, href, external, Icon }) => (
                <a
                  href={href}
                  key={key}
                  className={`contact-row ${key}`}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <span className="row-icon">
                    <Icon />
                  </span>
                  <span className="row-main">
                    <span className="row-status">{label}</span>
                    <span className="row-title">{title}</span>
                    <span className="row-preview">{preview}</span>
                  </span>
                  <span className="row-end">
                    <FiChevronRight className="row-chevron" />
                  </span>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default GetHelp;