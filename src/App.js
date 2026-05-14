import React, { useState, useEffect, useCallback, useRef } from 'react';

const App = () => {
  // --- State Management ---
  const [gasLevel, setGasLevel] = useState(85);
  const [balance, setBalance] = useState(75.50);
  const [showNotification, setShowNotification] = useState(null);
  const [activeSection, setActiveSection] = useState("home");
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- Screen Orientation State ---
  const [orientation, setOrientation] = useState(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024
  });

  // --- Dynamic Kit Options Data ---
  const [kitOptions, setKitOptions] = useState([
    {
      id: "6kg",
      name: "Family Starter",
      nameFull: "Family Starter Kit",
      size: "6kg",
      cylinderSize: "6kg Cylinder",
      cookerType: "2-Burner Cooker",
      price: "FREE",
      deliveryFee: "FREE",
      recommendedFor: "1-3 people",
      icon: "🏠",
      features: ["Smart IoT Meter", "Free Installation", "30-day trial"],
      popular: true,
      monthlyPayment: "from KES 500/month"
    },
    {
      id: "13kg",
      name: "Family Plus",
      nameFull: "Family Plus Kit",
      size: "13kg",
      cylinderSize: "13kg Cylinder",
      cookerType: "3-Burner Cooker",
      price: "FREE",
      deliveryFee: "FREE",
      recommendedFor: "4-6 people",
      icon: "👨‍👩‍👧‍👦",
      features: ["Smart IoT Meter", "Free Installation", "Priority Support", "Extra Gas Hose"],
      popular: false,
      monthlyPayment: "from KES 800/month"
    },
    {
      id: "commercial",
      name: "Commercial",
      nameFull: "Commercial Kit",
      size: "50kg",
      cylinderSize: "50kg Double Cylinder",
      cookerType: "6-Burner Industrial",
      price: "FREE",
      deliveryFee: "FREE",
      recommendedFor: "Restaurants & Hotels",
      icon: "🏪",
      features: ["Smart IoT Meter", "Free Installation", "24/7 Support", "Backup Cylinder", "Priority Delivery"],
      popular: false,
      monthlyPayment: "from KES 2,500/month"
    }
  ]);

  const [selectedKit, setSelectedKit] = useState(kitOptions[0]);
  
  // --- Form Data ---
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    kitId: "6kg",
    preferredDeliveryDate: "",
    specialInstructions: "",
    hearAboutUs: ""
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [locationAddress, setLocationAddress] = useState("");
  
  // --- Map Integration ---
  const [mapLoaded, setMapLoaded] = useState(false);
  const [useSimpleMap, setUseSimpleMap] = useState(false);
  const mapContainerRef = useRef(null);
  const [coordinates, setCoordinates] = useState({ lat: -1.286389, lng: 36.817223 });
  const [showSummary, setShowSummary] = useState(false);

  // --- Listen to Screen Orientation Changes ---
  useEffect(() => {
    const handleResize = () => {
      const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      setOrientation(newOrientation);
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // --- Load Map (Free OpenStreetMap) ---
  useEffect(() => {
    if (showSignUpModal && !useSimpleMap && !mapLoaded) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    }
  }, [showSignUpModal, useSimpleMap, mapLoaded]);

  // Initialize Map
  useEffect(() => {
    if (mapLoaded && !useSimpleMap && showSignUpModal && mapContainerRef.current && !window.mapInitialized) {
      window.mapInitialized = true;
      
      const map = window.L.map(mapContainerRef.current).setView([coordinates.lat, coordinates.lng], 13);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      const marker = window.L.marker([coordinates.lat, coordinates.lng], { draggable: true }).addTo(map);
      
      marker.on('dragend', function(e) {
        const pos = marker.getLatLng();
        setCoordinates({ lat: pos.lat, lng: pos.lng });
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`)
          .then(res => res.json())
          .then(data => {
            if (data.display_name) {
              setLocationAddress(data.display_name);
              setFormData(prev => ({ ...prev, location: data.display_name }));
            }
          });
      });
      
      map.on('click', function(e) {
        marker.setLatLng(e.latlng);
        setCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
          .then(res => res.json())
          .then(data => {
            if (data.display_name) {
              setLocationAddress(data.display_name);
              setFormData(prev => ({ ...prev, location: data.display_name }));
            }
          });
      });
      
      window.currentMap = map;
      window.currentMarker = marker;
    }
  }, [mapLoaded, useSimpleMap, showSignUpModal, coordinates]);

  // --- Notification System ---
  const showMessage = (message, type = "success") => {
    setShowNotification({ message, type });
    setTimeout(() => setShowNotification(null), 3000);
  };

  // --- Form Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleKitSelection = (kit) => {
    setSelectedKit(kit);
    setFormData(prev => ({ ...prev, kitId: kit.id }));
    setShowSummary(true);
    setTimeout(() => setShowSummary(false), 3000);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Full name is required";
    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^(\+254|0)[17]\d{8}$/.test(formData.phone)) errors.phone = "Enter a valid Kenyan phone number";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Enter a valid email address";
    if (!formData.location && !locationAddress) errors.location = "Please select a delivery location";
    if (!formData.kitId) errors.kitId = "Please select a kit option";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showMessage("Please fix the errors in the form", "error");
      return;
    }
    
    setIsSubmitting(true);
    setTimeout(() => {
      const selectedKitOption = kitOptions.find(k => k.id === formData.kitId);
      showMessage(`✅ Thank you ${formData.name}! Your ${selectedKitOption.nameFull} kit will be delivered soon!`, "success");
      setIsSubmitting(false);
      setShowSignUpModal(false);
      setFormData({ name: "", phone: "", email: "", location: "", kitId: "6kg", preferredDeliveryDate: "", specialInstructions: "", hearAboutUs: "" });
      setLocationAddress("");
      setSelectedKit(kitOptions[0]);
    }, 2000);
  };

  const openSignUpModal = () => {
    setShowSignUpModal(true);
    setFormErrors({});
    window.mapInitialized = false;
  };

  // --- Navigation Handlers ---
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTopUp = () => {
    setBalance(prev => parseFloat((prev + 100).toFixed(2)));
    showMessage(`✅ KES 100 added! New balance: KES ${(balance + 100).toFixed(2)}`, "success");
  };

  const handleCheckBalance = () => {
    showMessage(`💰 Your current balance is KES ${balance.toFixed(2)}`, "success");
  };

  // --- Theme Colors ---
  const theme = {
    primary: "#2A9D8F",
    primaryDark: "#1E6B61",
    secondary: "#E9C46A",
    accent: "#F4A261",
    dark: "#264653",
    light: "#F8F9FA",
    gray: "#6C757D",
    danger: "#E76F51"
  };

  // --- Responsive Styles ---
  const responsiveStyles = {
    container: {
      maxWidth: screenSize.isMobile ? "100%" : (screenSize.isTablet ? "90%" : "1280px"),
      margin: "0 auto",
      padding: screenSize.isMobile ? "2rem 1rem" : "4rem 2rem"
    },
    gridColumns: {
      display: "grid",
      gridTemplateColumns: screenSize.isMobile ? "1fr" : (orientation === 'landscape' && screenSize.isTablet ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(280px, 1fr))"),
      gap: "1.5rem"
    },
    twoColumnLayout: {
      display: "grid",
      gridTemplateColumns: screenSize.isMobile ? "1fr" : (orientation === 'landscape' && screenSize.isMobile ? "repeat(2, 1fr)" : "1fr 1fr"),
      gap: screenSize.isMobile ? "1.5rem" : "3rem",
      alignItems: "center"
    },
    heading: {
      fontSize: screenSize.isMobile ? (orientation === 'landscape' ? "1.8rem" : "2rem") : (screenSize.isTablet ? "2.5rem" : "3.5rem"),
      fontWeight: "800",
      color: theme.dark
    },
    subheading: {
      fontSize: screenSize.isMobile ? (orientation === 'landscape' ? "1.1rem" : "1.2rem") : "1.5rem",
      fontWeight: "500",
      color: theme.primary
    }
  };

  // --- Components ---
  const NotificationBanner = () => {
    if (!showNotification) return null;
    return (
      <div style={{
        position: "fixed",
        top: "80px",
        right: screenSize.isMobile ? "10px" : "20px",
        left: screenSize.isMobile ? "10px" : "auto",
        backgroundColor: showNotification.type === "error" ? theme.danger : theme.primary,
        color: "white",
        padding: screenSize.isMobile ? "0.75rem 1rem" : "1rem 1.5rem",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        zIndex: 1001,
        animation: "slideIn 0.3s ease",
        fontWeight: "500",
        textAlign: "center"
      }}>
        {showNotification.message}
      </div>
    );
  };

  const Button = ({ children, onClick, primary = true, danger = false, small = false, disabled = false, fullWidth = false }) => (
    <button onClick={onClick} disabled={disabled} style={{
      backgroundColor: danger ? theme.danger : (primary ? theme.primary : "white"),
      color: danger ? "white" : (primary ? "white" : theme.primary),
      border: danger ? "none" : (primary ? "none" : `2px solid ${theme.primary}`),
      padding: small ? "0.5rem 1rem" : (screenSize.isMobile ? "0.6rem 1.2rem" : "0.75rem 1.8rem"),
      borderRadius: "50px",
      fontWeight: "600",
      fontSize: small ? "0.85rem" : (screenSize.isMobile ? "0.9rem" : "1rem"),
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.2s",
      margin: "0.25rem",
      opacity: disabled ? 0.6 : 1,
      width: fullWidth ? "100%" : "auto"
    }}>
      {children}
    </button>
  );

  // --- Sign-Up Modal (Responsive) ---
  const SignUpModal = () => {
    if (!showSignUpModal) return null;

    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: screenSize.isMobile ? "0.5rem" : "1rem",
        overflowY: "auto"
      }} onClick={() => setShowSignUpModal(false)}>
        <div style={{
          backgroundColor: "white",
          borderRadius: screenSize.isMobile ? "20px" : "28px",
          maxWidth: screenSize.isMobile ? "100%" : (orientation === 'landscape' && screenSize.isTablet ? "95%" : "1100px"),
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: screenSize.isMobile ? "1rem" : "2rem",
          position: "relative"
        }} onClick={(e) => e.stopPropagation()}>
          
          <button onClick={() => setShowSignUpModal(false)} style={{
            position: "absolute",
            top: screenSize.isMobile ? "0.5rem" : "1rem",
            right: screenSize.isMobile ? "0.5rem" : "1rem",
            background: "none",
            border: "none",
            fontSize: screenSize.isMobile ? "1.2rem" : "1.5rem",
            cursor: "pointer",
            color: theme.gray,
            zIndex: 1
          }}>✕</button>

          <h2 style={{ fontSize: screenSize.isMobile ? "1.5rem" : "1.8rem", color: theme.dark, marginBottom: "0.5rem", paddingRight: "2rem" }}>Get Your Free Kit 🎁</h2>
          <p style={{ color: theme.gray, marginBottom: screenSize.isMobile ? "1rem" : "2rem", fontSize: screenSize.isMobile ? "0.85rem" : "1rem" }}>Choose your kit and schedule delivery</p>

          {/* Dynamic Kit Selection - Responsive Grid */}
          <div style={{ marginBottom: screenSize.isMobile ? "1rem" : "2rem" }}>
            <h3 style={{ fontSize: screenSize.isMobile ? "1rem" : "1.2rem", marginBottom: "0.75rem" }}>Step 1: Select Your Kit</h3>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: screenSize.isMobile ? "1fr" : (orientation === 'landscape' && screenSize.isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(260px, 1fr))"),
              gap: screenSize.isMobile ? "0.75rem" : "1.5rem"
            }}>
              {kitOptions.map((kit) => (
                <div
                  key={kit.id}
                  onClick={() => handleKitSelection(kit)}
                  style={{
                    border: `2px solid ${selectedKit.id === kit.id ? theme.primary : "#e0e0e0"}`,
                    borderRadius: "16px",
                    padding: screenSize.isMobile ? "1rem" : "1.5rem",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    backgroundColor: selectedKit.id === kit.id ? `${theme.primary}08` : "white",
                    position: "relative"
                  }}
                >
                  {kit.popular && (
                    <span style={{
                      position: "absolute",
                      top: "-8px",
                      right: "10px",
                      backgroundColor: theme.accent,
                      color: "white",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "20px",
                      fontSize: "0.7rem",
                      fontWeight: "bold"
                    }}>🔥 POPULAR</span>
                  )}
                  <div style={{ fontSize: screenSize.isMobile ? "2rem" : "2.5rem", marginBottom: "0.25rem" }}>{kit.icon}</div>
                  <h3 style={{ fontSize: screenSize.isMobile ? "1.1rem" : "1.3rem", color: theme.primary, marginBottom: "0.2rem" }}>{kit.nameFull}</h3>
                  <p style={{ fontSize: "0.75rem", color: theme.gray, marginBottom: "0.25rem" }}>{kit.recommendedFor}</p>
                  <div style={{ fontSize: screenSize.isMobile ? "1rem" : "1.2rem", fontWeight: "bold", color: theme.dark }}>
                    {kit.price}
                  </div>
                  <p style={{ fontSize: "0.7rem", color: theme.primary }}>{kit.monthlyPayment}</p>
                  {!screenSize.isMobile && (
                    <ul style={{ listStyle: "none", padding: 0, fontSize: "0.8rem", marginTop: "0.5rem" }}>
                      {kit.features.slice(0, 2).map((feature, idx) => (
                        <li key={idx} style={{ marginBottom: "0.2rem" }}>✓ {feature}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          {showSummary && (
            <div style={{
              backgroundColor: theme.light,
              padding: screenSize.isMobile ? "0.75rem" : "1rem",
              borderRadius: "12px",
              marginBottom: screenSize.isMobile ? "1rem" : "1.5rem",
              animation: "slideIn 0.3s ease",
              fontSize: screenSize.isMobile ? "0.85rem" : "1rem"
            }}>
              ✓ {selectedKit.nameFull} selected! Includes {selectedKit.cylinderSize}, {selectedKit.cookerType}.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: screenSize.isMobile ? "1rem" : "1.2rem", marginBottom: "0.75rem" }}>Step 2: Your Information</h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: screenSize.isMobile ? "1fr" : (orientation === 'landscape' && screenSize.isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(280px, 1fr))"),
              gap: screenSize.isMobile ? "0.75rem" : "1.5rem"
            }}>
              
              {/* Form Fields */}
              <div>
                <div style={{ marginBottom: screenSize.isMobile ? "0.75rem" : "1rem" }}>
                  <label style={{ fontSize: screenSize.isMobile ? "0.85rem" : "0.9rem", fontWeight: "600", color: theme.dark }}>Full Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., John Mwangi"
                    style={{ width: "100%", padding: "0.6rem", border: `1px solid ${formErrors.name ? theme.danger : "#ddd"}`, borderRadius: "12px", fontSize: screenSize.isMobile ? "0.85rem" : "1rem" }} />
                  {formErrors.name && <p style={{ color: theme.danger, fontSize: "0.7rem", marginTop: "0.2rem" }}>{formErrors.name}</p>}
                </div>

                <div style={{ marginBottom: screenSize.isMobile ? "0.75rem" : "1rem" }}>
                  <label style={{ fontSize: screenSize.isMobile ? "0.85rem" : "0.9rem", fontWeight: "600", color: theme.dark }}>Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="0712345678"
                    style={{ width: "100%", padding: "0.6rem", border: `1px solid ${formErrors.phone ? theme.danger : "#ddd"}`, borderRadius: "12px", fontSize: screenSize.isMobile ? "0.85rem" : "1rem" }} />
                  {formErrors.phone && <p style={{ color: theme.danger, fontSize: "0.7rem", marginTop: "0.2rem" }}>{formErrors.phone}</p>}
                </div>

                <div style={{ marginBottom: screenSize.isMobile ? "0.75rem" : "1rem" }}>
                  <label style={{ fontSize: screenSize.isMobile ? "0.85rem" : "0.9rem", fontWeight: "600", color: theme.dark }}>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com"
                    style={{ width: "100%", padding: "0.6rem", border: `1px solid #ddd`, borderRadius: "12px", fontSize: screenSize.isMobile ? "0.85rem" : "1rem" }} />
                </div>

                <div style={{ marginBottom: screenSize.isMobile ? "0.75rem" : "1rem" }}>
                  <label style={{ fontSize: screenSize.isMobile ? "0.85rem" : "0.9rem", fontWeight: "600", color: theme.dark }}>Preferred Delivery Date</label>
                  <input type="date" name="preferredDeliveryDate" value={formData.preferredDeliveryDate} onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ width: "100%", padding: "0.6rem", border: `1px solid #ddd`, borderRadius: "12px", fontSize: screenSize.isMobile ? "0.85rem" : "1rem" }} />
                </div>

                <div style={{ marginBottom: screenSize.isMobile ? "0.75rem" : "1rem" }}>
                  <label style={{ fontSize: screenSize.isMobile ? "0.85rem" : "0.9rem", fontWeight: "600", color: theme.dark }}>How did you hear about us?</label>
                  <select name="hearAboutUs" value={formData.hearAboutUs} onChange={handleInputChange}
                    style={{ width: "100%", padding: "0.6rem", border: `1px solid #ddd`, borderRadius: "12px", fontSize: screenSize.isMobile ? "0.85rem" : "1rem" }}>
                    <option value="">Select an option</option>
                    <option value="social">Social Media</option>
                    <option value="friend">Friend/Family</option>
                    <option value="radio">Radio/Advertisement</option>
                    <option value="agent">OKOA Agent</option>
                  </select>
                </div>
              </div>

              {/* Map & Location */}
              <div>
                <label style={{ fontSize: screenSize.isMobile ? "0.85rem" : "0.9rem", fontWeight: "600", color: theme.dark }}>Delivery Location *</label>
                
                <div ref={mapContainerRef} style={{
                  width: "100%",
                  height: screenSize.isMobile ? "200px" : "250px",
                  borderRadius: "12px",
                  border: `2px solid ${formErrors.location ? theme.danger : theme.primary}`,
                  marginBottom: "0.5rem",
                  backgroundColor: "#f0f0f0"
                }}>
                  {!mapLoaded && !useSimpleMap && (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                      <p style={{ fontSize: "0.8rem" }}>Loading map...</p>
                      <Button small onClick={() => setUseSimpleMap(true)}>Enter Address Manually →</Button>
                    </div>
                  )}
                </div>
                
                {useSimpleMap && (
                  <input type="text" placeholder="Enter your delivery address" value={locationAddress}
                    onChange={(e) => { setLocationAddress(e.target.value); setFormData(prev => ({ ...prev, location: e.target.value })); }}
                    style={{ width: "100%", padding: "0.6rem", border: `1px solid ${formErrors.location ? theme.danger : "#ddd"}`, borderRadius: "12px", marginBottom: "0.5rem", fontSize: screenSize.isMobile ? "0.85rem" : "1rem" }} />
                )}
                
                {locationAddress && !useSimpleMap && (
                  <div style={{ backgroundColor: "#e8f5e9", padding: "0.5rem", borderRadius: "8px", marginTop: "0.5rem", fontSize: "0.75rem" }}>
                    <strong>📍 Location:</strong><br />
                    {locationAddress.substring(0, 80)}...
                  </div>
                )}
                
                <button type="button" onClick={() => {
                  if (navigator.geolocation && !useSimpleMap) {
                    navigator.geolocation.getCurrentPosition((position) => {
                      setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
                      if (window.currentMap && window.currentMarker) {
                        window.currentMap.setView([position.coords.latitude, position.coords.longitude], 15);
                        window.currentMarker.setLatLng([position.coords.latitude, position.coords.longitude]);
                      }
                      showMessage("📍 Location updated!", "success");
                    });
                  }
                }} style={{
                  marginTop: "0.5rem",
                  padding: "0.5rem",
                  backgroundColor: theme.accent,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  width: "100%",
                  fontSize: screenSize.isMobile ? "0.8rem" : "0.9rem"
                }}>
                  📍 Use My Current Location
                </button>

                <div style={{ marginTop: "0.75rem" }}>
                  <label style={{ fontSize: screenSize.isMobile ? "0.85rem" : "0.9rem", fontWeight: "600", color: theme.dark }}>Special Instructions</label>
                  <textarea name="specialInstructions" value={formData.specialInstructions} onChange={handleInputChange}
                    placeholder="Gate code, landmark, etc."
                    rows="2" style={{ width: "100%", padding: "0.6rem", border: `1px solid #ddd`, borderRadius: "12px", fontSize: screenSize.isMobile ? "0.85rem" : "1rem", resize: "vertical" }} />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div style={{
              marginTop: screenSize.isMobile ? "1rem" : "1.5rem",
              padding: screenSize.isMobile ? "0.75rem" : "1rem",
              backgroundColor: theme.light,
              borderRadius: "16px"
            }}>
              <h4 style={{ fontSize: screenSize.isMobile ? "0.9rem" : "1rem", marginBottom: "0.5rem" }}>📋 Order Summary</h4>
              <div style={{ display: "grid", gridTemplateColumns: screenSize.isMobile ? "1fr" : "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.5rem", fontSize: screenSize.isMobile ? "0.8rem" : "0.9rem" }}>
                <div><strong>Kit:</strong> {selectedKit.nameFull}</div>
                <div><strong>Cylinder:</strong> {selectedKit.cylinderSize}</div>
                <div><strong>Cooker:</strong> {selectedKit.cookerType}</div>
                <div><strong>Upfront:</strong> {selectedKit.price}</div>
                <div><strong>Delivery:</strong> FREE</div>
                <div><strong>Installation:</strong> FREE</div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ marginTop: screenSize.isMobile ? "1rem" : "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Button onClick={() => setShowSignUpModal(false)} primary={false}>Cancel</Button>
              <button type="submit" disabled={isSubmitting} style={{
                backgroundColor: theme.primary, color: "white", border: "none", padding: screenSize.isMobile ? "0.6rem 1.5rem" : "0.75rem 2rem",
                borderRadius: "50px", fontWeight: "600", fontSize: screenSize.isMobile ? "0.9rem" : "1rem", cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1
              }}>
                {isSubmitting ? "Processing..." : "Confirm & Get Free Kit →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- Header (Responsive) ---
  const Header = () => (
    <header style={{ 
      backgroundColor: "white", 
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      padding: screenSize.isMobile ? "0.75rem 1rem" : "1rem 2rem",
      position: "sticky",
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: screenSize.isMobile ? "0.5rem" : "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => scrollToSection("home")}>
          <span style={{ fontSize: screenSize.isMobile ? "1.5rem" : "1.8rem" }}>🔥</span>
          <span style={{ fontWeight: "bold", fontSize: screenSize.isMobile ? "1.2rem" : "1.5rem", color: theme.dark }}>OKOA GAS</span>
        </div>
        
        <nav style={{ display: "flex", gap: screenSize.isMobile ? "0.75rem" : "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => scrollToSection("home")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: screenSize.isMobile ? "0.85rem" : "1rem", fontWeight: "500", color: theme.dark }}>Home</button>
          {!screenSize.isMobile && (
            <>
              <button onClick={() => scrollToSection("promise")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: "500", color: theme.dark }}>How It Works</button>
              <button onClick={() => scrollToSection("safety")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: "500", color: theme.dark }}>Safety</button>
            </>
          )}
          <Button onClick={openSignUpModal} small>Get Free Kit →</Button>
        </nav>
      </div>
    </header>
  );

  // --- Footer (Responsive) ---
  const Footer = () => (
    <footer style={{
      backgroundColor: theme.dark,
      color: "#94a3b8",
      padding: screenSize.isMobile ? "2rem 1rem 1rem" : "3rem 2rem 1.5rem"
    }}>
      <div style={{
        maxWidth: "1280px",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: screenSize.isMobile ? "1fr" : (screenSize.isTablet ? "repeat(2, 1fr)" : "repeat(4, 1fr)"),
        gap: screenSize.isMobile ? "1.5rem" : "2rem",
        marginBottom: "1.5rem"
      }}>
        <div>
          <h3 style={{ color: "white", marginBottom: "0.75rem", fontSize: screenSize.isMobile ? "1rem" : "1.2rem" }}>OKOA GAS</h3>
          <p style={{ fontSize: screenSize.isMobile ? "0.8rem" : "0.9rem" }}>Clean cooking for every home.</p>
        </div>
        <div>
          <h3 style={{ color: "white", marginBottom: "0.75rem", fontSize: screenSize.isMobile ? "1rem" : "1.2rem" }}>Quick Links</h3>
          <button onClick={openSignUpModal} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "block", marginBottom: "0.5rem", fontSize: screenSize.isMobile ? "0.8rem" : "0.9rem" }}>Get Free Kit</button>
          <button onClick={handleCheckBalance} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "block", fontSize: screenSize.isMobile ? "0.8rem" : "0.9rem" }}>Check Balance</button>
        </div>
        <div>
          <h3 style={{ color: "white", marginBottom: "0.75rem", fontSize: screenSize.isMobile ? "1rem" : "1.2rem" }}>Contact</h3>
          <p style={{ fontSize: screenSize.isMobile ? "0.8rem" : "0.9rem" }}>📞 +254717052939</p>
          <p style={{ fontSize: screenSize.isMobile ? "0.8rem" : "0.9rem" }}>✉️ hello@okoagas.com</p>
        </div>
        {!screenSize.isMobile && (
          <div>
            <h3 style={{ color: "white", marginBottom: "0.75rem" }}>Kit Options</h3>
            {kitOptions.map(kit => <p key={kit.id} style={{ fontSize: "0.8rem" }}>{kit.icon} {kit.nameFull}</p>)}
          </div>
        )}
      </div>
      <div style={{ textAlign: "center", paddingTop: "1rem", borderTop: "1px solid #3a5a6b", fontSize: screenSize.isMobile ? "0.7rem" : "0.85rem" }}>
        © {new Date().getFullYear()} OKOA GAS. All rights reserved.
      </div>
    </footer>
  );

  // --- Main Content Data ---
  const heroData = { title: "Clean Cooking for Every Home.", sub: "Pay as you go from KES 1.", description: "No cylinders to buy. No deposit. Just clean LPG delivered to your stove." };
  const promiseData = { title: "The \"Zero Upfront\" Promise", items: [
    { name: "Free Starter Cylinder", desc: "6kg or 13kg cylinder. Zero upfront cost.", icon: "🫙" },
    { name: "Included Cooker", desc: "High-quality 2-3 burner cooker included.", icon: "🍳" },
    { name: "Smart IoT Meter", desc: "Real-time tracking. Only pay for what you use.", icon: "📡" }
  ]};
  const safetyData = { title: "Safety First, Always.", features: [
    { name: "Automatic Leak Detection", desc: "High-precision sensors monitor air continuously." },
    { name: "Emergency Valve Shutoff", desc: "Immediate mechanical shutoff when leak detected." }
  ]};

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", backgroundColor: theme.light, overflowX: "hidden" }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        * { box-sizing: border-box; }
        input, button, select, textarea { font-family: inherit; }
        @media (max-width: 768px) {
          input, select, textarea { font-size: 16px !important; }
        }
      `}</style>
      
      <NotificationBanner />
      <Header />
      <SignUpModal />

      {/* Hero Section */}
      <div id="home" style={responsiveStyles.container}>
        <div style={{ textAlign: "center" }}>
          <h1 style={responsiveStyles.heading}>{heroData.title}</h1>
          <p style={responsiveStyles.subheading}>{heroData.sub}</p>
          <p style={{ fontSize: screenSize.isMobile ? "0.9rem" : "1rem", maxWidth: "600px", margin: "1rem auto", color: theme.gray }}>{heroData.description}</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Button onClick={openSignUpModal}>Get Your Free Kit →</Button>
            <Button onClick={handleCheckBalance} primary={false}>Check Balance</Button>
          </div>
        </div>
      </div>

      {/* Promise Section */}
      <div id="promise" style={{ backgroundColor: "white", padding: screenSize.isMobile ? "2rem 1rem" : "4rem 2rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <h2 style={{ fontSize: screenSize.isMobile ? "1.5rem" : "2.2rem", textAlign: "center", color: theme.dark }}>{promiseData.title}</h2>
          <div style={responsiveStyles.gridColumns}>
            {promiseData.items.map((item, idx) => (
              <div key={idx} style={{ textAlign: "center", padding: screenSize.isMobile ? "1rem" : "1.8rem" }}>
                <div style={{ fontSize: screenSize.isMobile ? "2rem" : "3rem" }}>{item.icon}</div>
                <h3 style={{ fontSize: screenSize.isMobile ? "1.1rem" : "1.3rem", color: theme.primary }}>{item.name}</h3>
                <p style={{ fontSize: screenSize.isMobile ? "0.85rem" : "1rem", color: theme.gray }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Meter Section */}
      <div style={responsiveStyles.container}>
        <div style={responsiveStyles.twoColumnLayout}>
          <div>
            <h2 style={{ fontSize: screenSize.isMobile ? "1.3rem" : "2rem", color: theme.dark }}>Monitor & Control</h2>
            <p style={{ color: theme.gray, margin: "0.75rem 0" }}>See live gas level, top up via M-PESA.</p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <Button onClick={handleTopUp}>Top Up KES 100</Button>
              <Button onClick={handleCheckBalance} primary={false}>Check Balance</Button>
            </div>
          </div>
          <div style={{ background: theme.dark, borderRadius: "20px", padding: screenSize.isMobile ? "1rem" : "1.8rem", color: "white" }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: screenSize.isMobile ? "0.9rem" : "1rem" }}>Gas Level: {gasLevel}%</div>
              <div style={{ height: "8px", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "4px", marginTop: "0.5rem" }}>
                <div style={{ width: `${gasLevel}%`, height: "100%", backgroundColor: theme.secondary, borderRadius: "4px", transition: "width 0.3s" }}></div>
              </div>
            </div>
            <div style={{ fontSize: screenSize.isMobile ? "1rem" : "1.2rem", fontWeight: "bold" }}>Balance: KES {balance.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Safety Section */}
      <div id="safety" style={{ backgroundColor: theme.dark, padding: screenSize.isMobile ? "2rem 1rem" : "4rem 2rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <h2 style={{ fontSize: screenSize.isMobile ? "1.5rem" : "2.2rem", textAlign: "center", color: "white" }}>{safetyData.title}</h2>
          <div style={{ display: "grid", gridTemplateColumns: screenSize.isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
            {safetyData.features.map((feature, idx) => (
              <div key={idx} style={{ backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "20px", padding: screenSize.isMobile ? "1rem" : "2rem" }}>
                <h3 style={{ fontSize: screenSize.isMobile ? "1.1rem" : "1.3rem", color: theme.secondary }}>{feature.name}</h3>
                <p style={{ fontSize: screenSize.isMobile ? "0.85rem" : "1rem", color: "#e2e8f0" }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default App;