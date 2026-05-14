import React, { useState, useEffect, useRef } from 'react';

// ============================================
// ✅ RELIABLE ONLINE IMAGE URLs
// ============================================
const images = {
  // Hero & Main Images
  gasHero: 'https://images.unsplash.com/photo-1513281362764-6f858a0e5c4b?w=1200&h=600&fit=crop',
  gasStove: 'https://images.unsplash.com/photo-1583267746897-2cf415887172?w=800&h=500&fit=crop',
  
  // Service Images
  deliveryTruck: 'https://placehold.co/600x400/2A9D8F/white?text=Quick+Delivery',
  mobilePayment: 'https://placehold.co/600x400/2A9D8F/white?text=M-PESA+Payment',
  smartMeters: 'https://placehold.co/600x400/2A9D8F/white?text=Smart+Tracking',
  gasRefills: 'https://placehold.co/600x400/264653/white?text=Gas+Refills',
  cylinderKits: 'https://placehold.co/600x400/2A9D8F/white?text=New+Cylinder+Kits',
  compositeCylinders: 'https://placehold.co/600x400/E9C46A/white?text=Composite+Cylinders',
  lpgAccessories: 'https://placehold.co/600x400/F4A261/white?text=LPG+Accessories',
  
  // Step Images
  stepOrder: 'https://placehold.co/600x400/2A9D8F/white?text=1.+Order+Online',
  stepInstallation: 'https://placehold.co/600x400/2A9D8F/white?text=2.+Delivery+%26+Installation',
  stepTopup: 'https://placehold.co/600x400/2A9D8F/white?text=3.+Top+Up+%26+Track',
};

// Image Component with automatic fallback
const SafeImage = ({ src, alt, style, className, onClick }) => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    // Emoji fallback based on alt text
    let fallbackEmoji = '🔥';
    if (alt === 'Gas Refills') fallbackEmoji = '🫙';
    else if (alt === 'Cylinder Kits') fallbackEmoji = '🎁';
    else if (alt === 'Smart Tracking') fallbackEmoji = '📡';
    else if (alt === 'Secure Payment' || alt === 'M-PESA Payment') fallbackEmoji = '💰';
    else if (alt === 'Quick Delivery') fallbackEmoji = '🚚';
    
    return (
      <div style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0fdf4',
        color: '#2A9D8F',
        fontSize: '3rem'
      }}>
        {fallbackEmoji}
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      style={style}
      className={className}
      onClick={onClick}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
};

const App = () => {
  // --- State ---
  const [gasLevel] = useState(85);
  const [balance, setBalance] = useState(75.50);
  const [showNotification, setShowNotification] = useState(null);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [screenSize, setScreenSize] = useState({
    isMobile: window.innerWidth < 768,
    width: window.innerWidth
  });
  
  // --- Payment State ---
  const [paymentDetails, setPaymentDetails] = useState({
    phoneNumber: '',
    amount: '100',
    checkoutRequestID: null
  });
  
  // --- API Base URL ---
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // --- Kit Options ---
  const [kitOptions] = useState([
    { id: "6kg", name: "Family Starter", fullName: "Family Starter Kit", size: "6kg", cooker: "2-Burner", price: "FREE", icon: "🏠", popular: true, monthly: "from KES 500" },
    { id: "13kg", name: "Family Plus", fullName: "Family Plus Kit", size: "13kg", cooker: "3-Burner", price: "FREE", icon: "👨‍👩‍👧‍👦", popular: false, monthly: "from KES 800" },
    { id: "commercial", name: "Commercial", fullName: "Commercial Kit", size: "50kg", cooker: "6-Burner", price: "FREE", icon: "🏪", popular: false, monthly: "from KES 2,500" }
  ]);
  
  const [selectedKit, setSelectedKit] = useState(kitOptions[0]);
  
  // --- Form State ---
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", location: "", kitId: "6kg", instructions: "" });
  const [formErrors, setFormErrors] = useState({});
  const [locationAddress, setLocationAddress] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  
  // --- Map State ---
  const [mapLoaded, setMapLoaded] = useState(false);
  const [useSimpleMap, setUseSimpleMap] = useState(false);
  const mapRef = useRef(null);
  const [coordinates, setCoordinates] = useState({ lat: -1.286389, lng: 36.817223 });

  // --- Screen Resize Handler ---
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        isMobile: window.innerWidth < 768,
        width: window.innerWidth
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Load Map ---
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
    if (mapLoaded && !useSimpleMap && showSignUpModal && mapRef.current) {
      if (!window.mapInit) {
        window.mapInit = true;
        const map = window.L.map(mapRef.current).setView([coordinates.lat, coordinates.lng], 13);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        const marker = window.L.marker([coordinates.lat, coordinates.lng], { draggable: true }).addTo(map);
        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          setCoordinates({ lat: pos.lat, lng: pos.lng });
          await reverseGeocode(pos.lat, pos.lng);
        });

        window.currentMap = map;
        window.currentMarker = marker;
      } else {
        window.currentMap.invalidateSize();
        if (window.currentMarker) {
          window.currentMarker.setLatLng([coordinates.lat, coordinates.lng]);
        }
        window.currentMap.setView([coordinates.lat, coordinates.lng], 13);
      }
    }
  }, [mapLoaded, useSimpleMap, showSignUpModal, coordinates]);

  useEffect(() => {
    if (showSignUpModal && mapLoaded && window.currentMap) {
      setTimeout(() => {
        window.currentMap.invalidateSize();
      }, 100);
    }
  }, [showSignUpModal, mapLoaded]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data?.display_name) {
        setLocationAddress(data.display_name);
        setLocationQuery(data.display_name);
        setLocationStatus('Location loaded from map');
        return data.display_name;
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      setLocationStatus('Unable to resolve location.');
    }
    return null;
  };

  const searchLocation = async () => {
    const query = locationQuery.trim();
    if (!query) {
      setLocationStatus('Enter a location to search');
      return;
    }

    setLocationStatus('Searching for address...');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const results = await response.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        setCoordinates({ lat: latitude, lng: longitude });
        setLocationAddress(display_name);
        setLocationStatus('Address found! Drag marker to fine-tune.');

        if (window.currentMap) {
          window.currentMap.setView([latitude, longitude], 15);
          if (window.currentMarker) {
            window.currentMarker.setLatLng([latitude, longitude]);
          }
        }
      } else {
        setLocationStatus('Address not found. Try a more specific place.');
      }
    } catch (error) {
      console.error('Search location error:', error);
      setLocationStatus('Search failed. Please try again.');
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not available in this browser');
      return;
    }

    setLocationStatus('Getting current location...');
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setCoordinates({ lat: latitude, lng: longitude });
      if (window.currentMap) {
        window.currentMap.setView([latitude, longitude], 15);
        if (window.currentMarker) {
          window.currentMarker.setLatLng([latitude, longitude]);
        }
      }
      await reverseGeocode(latitude, longitude);
      setLocationStatus('Current location loaded');
    }, (error) => {
      console.error('Geolocation error:', error);
      setLocationStatus('Unable to get current location. Please check permissions.');
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  // --- M-PESA Payment Functions ---
  const normalizeMpesaPhone = (phone) => {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/[\s-]/g, '');
    if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
    if (/^2547\d{8}$/.test(cleaned)) return cleaned;
    if (/^0\d{9}$/.test(cleaned)) return '254' + cleaned.slice(1);
    if (/^7\d{8}$/.test(cleaned)) return '254' + cleaned;
    return cleaned;
  };

  const initiateMpesaPayment = async () => {
    if (!paymentDetails.phoneNumber) {
      showMessage('Please enter your M-PESA phone number', 'error');
      return;
    }

    const formattedPhone = normalizeMpesaPhone(paymentDetails.phoneNumber);
    const phoneRegex = /^2547\d{8}$/;
    if (!phoneRegex.test(formattedPhone)) {
      showMessage('Enter a valid Kenyan M-PESA phone number (e.g., 0712345678)', 'error');
      return;
    }

    const amountValue = Number(paymentDetails.amount);
    if (!amountValue || amountValue < 100) {
      showMessage('Enter an amount of at least KES 100', 'error');
      return;
    }

    setProcessingPayment(true);
    showMessage('Sending STK Push to your phone...', 'info');
    
    try {
      const response = await fetch(`${API_URL}/api/mpesa/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          amount: amountValue,
          accountReference: `OKOA-${Date.now()}`,
          description: `OKOA GAS top up - KES ${amountValue}`
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentDetails(prev => ({ ...prev, checkoutRequestID: data.checkoutRequestID }));
        showMessage('✅ STK Push sent! Enter your M-PESA PIN to complete payment.', 'success');
        pollPaymentStatus(data.checkoutRequestID);
      } else {
        showMessage(data.message || 'Payment initiation failed', 'error');
        setProcessingPayment(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      showMessage('Network error. Please try again.', 'error');
      setProcessingPayment(false);
    }
  };
  
  const pollPaymentStatus = async (checkoutRequestID) => {
    let attempts = 0;
    const maxAttempts = 30;
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`${API_URL}/api/mpesa/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutRequestID })
        });
        
        const data = await response.json();
        
        if (data.ResultCode === '0') {
          clearInterval(interval);
          const amountValue = Number(paymentDetails.amount);
          const newBalance = balance + amountValue;
          setBalance(newBalance);
          showMessage(`💰 Payment successful! New balance: KES ${newBalance.toFixed(2)}`, 'success');
          setProcessingPayment(false);
          setShowPaymentModal(false);
          setPaymentDetails({ phoneNumber: '', amount: '100', checkoutRequestID: null });
        } else if (data.ResultCode !== '1037') {
          clearInterval(interval);
          showMessage('Payment failed or cancelled', 'error');
          setProcessingPayment(false);
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        if (processingPayment) {
          showMessage('Payment timeout. Please check your M-PESA message.', 'warning');
          setProcessingPayment(false);
        }
      }
    }, 2000);
  };
  
  const simulateMpesaPayment = () => {
    if (!paymentDetails.phoneNumber) {
      showMessage('Please enter your M-PESA phone number', 'error');
      return;
    }
    
    setProcessingPayment(true);
    showMessage('Simulating M-PESA STK Push...', 'info');
    
    setTimeout(() => {
      const amountValue = Number(paymentDetails.amount);
      const newBalance = balance + amountValue;
      setBalance(newBalance);
      showMessage(`✅ Demo Payment successful! Added KES ${paymentDetails.amount}. New balance: KES ${newBalance.toFixed(2)}`, 'success');
      setProcessingPayment(false);
      setShowPaymentModal(false);
      setPaymentDetails({ phoneNumber: '', amount: '100', checkoutRequestID: null });
    }, 2000);
  };

  const showMessage = (msg, type = 'success') => {
    setShowNotification({ message: msg, type });
    setTimeout(() => setShowNotification(null), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleKitSelect = (kit) => {
    setSelectedKit(kit);
    setFormData(prev => ({ ...prev, kitId: kit.id }));
    showMessage(`${kit.fullName} selected!`, 'success');
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name required';
    if (!formData.phone.trim()) errors.phone = 'Phone required';
    else if (!/^(\+254|254|0)[17]\d{8}$/.test(formData.phone)) errors.phone = 'Valid Kenyan phone required';
    if (!formData.location && !locationAddress) errors.location = 'Location required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showMessage('Please fix errors', 'error');
      return;
    }
    
    setIsSubmitting(true);
    setTimeout(() => {
      showMessage(`✅ Thank you ${formData.name}! Your ${selectedKit.fullName} will be delivered soon.`, 'success');
      setIsSubmitting(false);
      setShowSignUpModal(false);
      setFormData({ name: "", phone: "", email: "", location: "", kitId: "6kg", instructions: "" });
      setLocationAddress("");
    }, 1500);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Payment Modal ---
  const PaymentModal = () => {
    if (!showPaymentModal) return null;
    
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowPaymentModal(false)}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', maxWidth: '450px', width: '100%', padding: '1.5rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowPaymentModal(false)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
          
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem' }}>💰</div>
            <h2 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>M-PESA Payment</h2>
            <p style={{ color: '#666' }}>Pay via M-PESA - Instant STK Push</p>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Amount (KES)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[100, 200, 500, 1000].map(amt => (
                <button key={amt} type="button" onClick={() => setPaymentDetails(prev => ({ ...prev, amount: String(amt) }))} style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: Number(paymentDetails.amount) === amt ? '#2A9D8F' : '#f0f0f0',
                  color: Number(paymentDetails.amount) === amt ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>KES {amt}</button>
              ))}
            </div>
            <input type="text" inputMode="numeric" value={paymentDetails.amount} onChange={e => setPaymentDetails(prev => ({ ...prev, amount: e.target.value }))} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', marginTop: '0.5rem' }} />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>M-PESA Phone Number</label>
            <input autoFocus type="tel" placeholder="0712345678" value={paymentDetails.phoneNumber} onChange={e => setPaymentDetails(prev => ({ ...prev, phoneNumber: e.target.value }))} style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }} />
            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>Enter the number registered on M-PESA</p>
          </div>
          
          <button type="button" onClick={initiateMpesaPayment} disabled={processingPayment} style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#2A9D8F',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: processingPayment ? 'not-allowed' : 'pointer',
            opacity: processingPayment ? 0.7 : 1
          }}>
            {processingPayment ? 'Sending STK Push...' : 'Pay with M-PESA →'}
          </button>
          
          <button type="button" onClick={simulateMpesaPayment} disabled={processingPayment} style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#f0f0f0',
            color: '#333',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            cursor: processingPayment ? 'not-allowed' : 'pointer',
            marginTop: '0.5rem'
          }}>
            Demo Mode (Simulate Payment)
          </button>
        </div>
      </div>
    );
  };

  // --- Theme Colors ---
  const theme = { primary: "#2A9D8F", primaryDark: "#1E6B61", secondary: "#E9C46A", accent: "#F4A261", dark: "#264653", light: "#F8F9FA", gray: "#6C757D", danger: "#E76F51" };
  
  const Button = ({ children, onClick, primary = true, small = false }) => (
    <button onClick={onClick} style={{
      backgroundColor: primary ? theme.primary : 'white',
      color: primary ? 'white' : theme.primary,
      border: primary ? 'none' : `2px solid ${theme.primary}`,
      padding: small ? '0.5rem 1rem' : (screenSize.isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem'),
      borderRadius: '50px',
      fontWeight: '600',
      fontSize: small ? '0.85rem' : (screenSize.isMobile ? '0.9rem' : '1rem'),
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}>{children}</button>
  );

  // --- SignUp Modal Component ---
  const SignUpModal = () => {
    if (!showSignUpModal) return null;
    
    return (
      <div style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: screenSize.isMobile ? '0.5rem' : '1rem', overflowY: 'auto'
      }} onClick={() => setShowSignUpModal(false)}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', maxWidth: screenSize.isMobile ? '100%' : '900px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: screenSize.isMobile ? '1rem' : '1.5rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
          
          <button onClick={() => setShowSignUpModal(false)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
          
          <h2 style={{ fontSize: screenSize.isMobile ? '1.3rem' : '1.5rem', marginBottom: '0.5rem' }}>Get Your Free Kit 🎁</h2>
          
          {/* Kit Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
            {kitOptions.map(kit => (
              <div key={kit.id} onClick={() => handleKitSelect(kit)} style={{ border: `2px solid ${selectedKit.id === kit.id ? theme.primary : '#ddd'}`, borderRadius: '12px', padding: '0.75rem', cursor: 'pointer', backgroundColor: selectedKit.id === kit.id ? `${theme.primary}10` : 'white' }}>
                <div style={{ fontSize: '1.5rem' }}>{kit.icon}</div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{kit.fullName}</div>
                <div style={{ fontSize: '0.7rem', color: theme.gray }}>{kit.size} {kit.cooker}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: theme.primary }}>{kit.price}</div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
              {/* LEFT COLUMN */}
              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: theme.dark }}>Full Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., John Mwangi" autoComplete="off" autoFocus style={{ width: '100%', padding: '0.75rem', border: `1px solid ${formErrors.name ? theme.danger : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
                  {formErrors.name && <p style={{ color: theme.danger, fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.name}</p>}
                </div>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: theme.dark }}>Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="0712345678" autoComplete="off" style={{ width: '100%', padding: '0.75rem', border: `1px solid ${formErrors.phone ? theme.danger : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
                  {formErrors.phone && <p style={{ color: theme.danger, fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.phone}</p>}
                </div>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: theme.dark }}>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" autoComplete="off" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
                </div>
              </div>
              
              {/* RIGHT COLUMN */}
              <div>
                {!useSimpleMap ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input type="text" placeholder="Search delivery address" value={locationQuery} onChange={e => setLocationQuery(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${formErrors.location ? theme.danger : '#ddd'}`, borderRadius: '8px', boxSizing: 'border-box' }} />
                      <button type="button" onClick={searchLocation} style={{ background: theme.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer' }}>Find</button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <button type="button" onClick={useCurrentLocation} style={{ flex: 1, background: theme.secondary, color: theme.dark, border: 'none', borderRadius: '8px', padding: '0.7rem', cursor: 'pointer' }}>📍 My Location</button>
                      <button type="button" onClick={() => setUseSimpleMap(true)} style={{ flex: 1, background: '#f0f0f0', color: theme.dark, border: `1px solid ${theme.primary}`, borderRadius: '8px', padding: '0.7rem', cursor: 'pointer' }}>Manual Entry</button>
                    </div>
                    <div ref={mapRef} style={{ height: '220px', borderRadius: '12px', border: `2px solid ${formErrors.location ? theme.danger : theme.primary}`, marginBottom: '0.5rem', backgroundColor: '#f0f0f0' }}>
                      {!mapLoaded && <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem' }}>Loading map... Please wait.</div>}
                    </div>
                  </>
                ) : (
                  <input type="text" placeholder="Enter delivery address" value={locationAddress} onChange={e => { setLocationAddress(e.target.value); setFormData(prev => ({ ...prev, location: e.target.value })); }} style={{ width: '100%', padding: '0.6rem', border: `1px solid ${formErrors.location ? theme.danger : '#ddd'}`, borderRadius: '8px', marginBottom: '0.5rem', boxSizing: 'border-box' }} />
                )}
                {(locationAddress || locationQuery) && <div style={{ fontSize: '0.7rem', color: theme.gray, marginTop: '0.25rem' }}>📍 {locationAddress || locationQuery}</div>}
                {locationStatus && <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.25rem' }}>{locationStatus}</div>}
                {formErrors.location && <p style={{ color: theme.danger, fontSize: '0.8rem', marginTop: '0.25rem' }}>{formErrors.location}</p>}
              </div>
            </div>
            
            <textarea name="instructions" placeholder="Special instructions (gate code, landmark...)" value={formData.instructions} onChange={handleInputChange} rows="2" style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '8px', marginTop: '0.75rem', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
            
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowSignUpModal(false)} style={{ background: 'white', color: theme.primary, border: `2px solid ${theme.primary}`, padding: '0.6rem 1.2rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
              <button type="submit" disabled={isSubmitting} style={{ background: theme.primary, color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '50px', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, fontSize: '0.9rem' }}>{isSubmitting ? 'Processing...' : 'Get Free Kit →'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: theme.light, minHeight: '100vh' }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .hero-animate { animation: fadeInUp 0.8s ease forwards; opacity: 0; }
        .feature-card { animation: fadeInUp 0.7s ease forwards; opacity: 0; }
        input, textarea, button { font-family: inherit; }
      `}</style>
      
      {showNotification && <div style={{ position: 'fixed', top: '70px', right: '10px', left: screenSize.isMobile ? '10px' : 'auto', backgroundColor: showNotification.type === 'error' ? theme.danger : (showNotification.type === 'warning' ? theme.accent : theme.primary), color: 'white', padding: '0.75rem', borderRadius: '8px', zIndex: 1001, animation: 'slideIn 0.3s ease', textAlign: 'center', maxWidth: screenSize.isMobile ? 'auto' : '350px' }}>{showNotification.message}</div>}
      
      <PaymentModal />
      <SignUpModal />
      
      {/* Header with ORIGINAL LOGO (Fire Emoji) */}
      <header style={{ background: 'white', padding: screenSize.isMobile ? '0.75rem 1rem' : '1rem 2rem', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          {/* ORIGINAL LOGO RETAINED - Fire Emoji + Text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => scrollTo('home')}>
            <span style={{ fontSize: screenSize.isMobile ? '1.8rem' : '2rem' }}>🔥</span>
            <span style={{ fontWeight: 'bold', fontSize: screenSize.isMobile ? '1.2rem' : '1.5rem', color: theme.dark }}>OKOA GAS</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {!screenSize.isMobile && (
              <>
                <button onClick={() => scrollTo('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: theme.dark }}>Home</button>
                <button onClick={() => scrollTo('promise')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: theme.dark }}>Features</button>
                <button onClick={() => scrollTo('safety')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: theme.dark }}>Safety</button>
              </>
            )}
            <Button onClick={() => setShowSignUpModal(true)} small>Get Free Kit</Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <div id="home" style={{ maxWidth: '1200px', margin: '0 auto', padding: screenSize.isMobile ? '2rem 1rem' : '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: screenSize.isMobile ? '2rem' : '3rem', color: theme.dark }}>Clean Cooking for Every Home.</h1>
        <p style={{ fontSize: screenSize.isMobile ? '1.2rem' : '1.5rem', color: theme.primary, margin: '0.5rem 0' }}>Pay as you go from KES 1.</p>
        <p style={{ maxWidth: '500px', margin: '1rem auto', color: theme.gray }}>No cylinders to buy. No deposit. Just clean LPG delivered to your stove.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button onClick={() => setShowSignUpModal(true)}>Get Your Free Kit →</Button>
          <Button onClick={() => setShowPaymentModal(true)} primary={false}>Top Up M-PESA</Button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : '1fr 1fr', gap: '1rem', alignItems: 'center', marginTop: '2rem' }}>
          <div className="hero-animate" style={{ padding: '1.5rem', background: '#eef8f7', borderRadius: '24px', boxShadow: '0 18px 40px rgba(42,157,143,0.08)' }}>
            <h3 style={{ margin: 0, color: theme.primary }}>Why customers love OKOA GAS</h3>
            <ul style={{ marginTop: '1rem', paddingLeft: '1.1rem', color: theme.dark, lineHeight: 1.8 }}>
              <li>Free kit delivered in 24 hours</li>
              <li>Pay only for what you use via M-PESA</li>
              <li>Instant gas level tracking from your phone</li>
              <li>Safe, certified installation and service</li>
            </ul>
          </div>
          <div className="hero-animate" style={{ borderRadius: '24px', overflow: 'hidden', minHeight: '240px', position: 'relative', background: '#ddd' }}>
            <SafeImage src={images.gasHero} alt="Clean cooking" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.85)', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)' }}>
              <strong style={{ color: theme.primary }}>Smart delivery + cashless payment.</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
          {[
            { title: 'Fast Refill', text: 'Gas delivered within hours for all standard cylinder sizes.' },
            { title: 'Complete Kits', text: 'Cylinder, regulator, hose, and burner included for seamless setup.' },
            { title: 'Pay-as-you-go', text: 'M-PESA top-up and smart meter support for flexible spending.' }
          ].map((item, index) => (
            <div key={index} className="feature-card" style={{ padding: '1.25rem', borderRadius: '20px', background: 'white', boxShadow: '0 16px 32px rgba(0,0,0,0.06)', border: '1px solid #f0f4f8' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: theme.primary, marginBottom: '0.75rem' }}>{item.title}</div>
              <p style={{ margin: 0, color: theme.gray, lineHeight: 1.7 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Gallery Section */}
      <div style={{ background: '#f7fdfb', padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: screenSize.isMobile ? '1.75rem' : '2.5rem', margin: 0, color: theme.dark }}>Our Services in Action</h2>
            <p style={{ maxWidth: '680px', margin: '1rem auto 0', color: theme.gray }}>See how OKOA GAS delivers clean cooking solutions to homes and businesses across Kenya.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
            <div className="feature-card" style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', background: 'white' }}>
              <SafeImage src={images.deliveryTruck} alt="Quick Delivery" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', color: theme.primary }}>Quick Delivery</h3>
                <p style={{ margin: 0, color: theme.gray, lineHeight: 1.6 }}>Stove-ready LPG cylinders delivered within hours to your doorstep.</p>
              </div>
            </div>
            <div className="feature-card" style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', background: 'white' }}>
              <SafeImage src={images.mobilePayment} alt="Secure Payment" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', color: theme.primary }}>Secure Payment</h3>
                <p style={{ margin: 0, color: theme.gray, lineHeight: 1.6 }}>Pay instantly with M-PESA. No cash, no hassle, full transparency.</p>
              </div>
            </div>
            <div className="feature-card" style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', background: 'white' }}>
              <SafeImage src={images.smartMeters} alt="Smart Tracking" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', color: theme.primary }}>Smart Tracking</h3>
                <p style={{ margin: 0, color: theme.gray, lineHeight: 1.6 }}>Monitor your gas usage in real-time and never run out unexpectedly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ background: '#ffffff', padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ color: theme.secondary, fontWeight: 700, marginBottom: '0.5rem' }}>Simple setup, smart cooking</div>
            <h2 style={{ fontSize: screenSize.isMobile ? '1.75rem' : '2.5rem', margin: 0, color: theme.dark }}>How OKOA GAS works</h2>
            <p style={{ maxWidth: '680px', margin: '1rem auto 0', color: theme.gray }}>From ordering your kit to topping up gas and tracking consumption, we make LPG easy and safe.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
            {[
              { image: images.stepOrder, title: 'Order your cylinder', text: 'Choose from 3kg, 6kg, 13kg, 22.5kg or 50kg refill sizes and complete starter kits.' },
              { image: images.stepInstallation, title: 'Installation & delivery', text: 'We deliver and install your cylinder, regulator, hose and burner safely.' },
              { image: images.stepTopup, title: 'Top up & track', text: 'Use M-PESA to top up and monitor usage with smart meter support.' }
            ].map((item, index) => (
              <div key={index} className="feature-card" style={{ padding: '1.5rem', borderRadius: '24px', background: '#f7fdfb', boxShadow: '0 18px 40px rgba(42,157,143,0.08)', textAlign: 'center' }}>
                <SafeImage src={item.image} alt={item.title} style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '1rem' }} />
                <h3 style={{ margin: '0.5rem 0', color: theme.dark }}>{item.title}</h3>
                <p style={{ margin: 0, color: theme.gray, lineHeight: 1.7 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Balance Display Card */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`, borderRadius: '20px', padding: '1.5rem', color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Your Current Balance</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>KES {balance.toFixed(2)}</div>
          <button onClick={() => setShowPaymentModal(true)} style={{ marginTop: '0.5rem', background: 'white', color: theme.primary, border: 'none', padding: '0.5rem 1rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer' }}>Add Money via M-PESA</button>
        </div>
      </div>
      
      {/* Promise Section */}
      <div id="promise" style={{ background: 'white', padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem', marginTop: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: screenSize.isMobile ? '1.5rem' : '2rem', marginBottom: '1.5rem' }}>The "Zero Upfront" Promise</h2>
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem' }}>
            {[ { icon: '🫙', name: 'Free Cylinder', desc: '6kg or 13kg cylinder' }, { icon: '🍳', name: 'Free Cooker', desc: '2-3 burner cooker' }, { icon: '📡', name: 'Smart Meter', desc: 'Pay for what you use' } ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>{item.icon}</div>
                <h3 style={{ color: theme.primary }}>{item.name}</h3>
                <p style={{ color: theme.gray, fontSize: '0.9rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Smart Meter */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: screenSize.isMobile ? '1.3rem' : '1.8rem' }}>Monitor & Control</h2>
            <p>See live gas level, top up instantly via M-PESA.</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button onClick={() => setShowPaymentModal(true)}>Top Up M-PESA</Button>
            </div>
          </div>
          <div style={{ background: theme.dark, borderRadius: '16px', padding: '1rem', color: 'white' }}>
            <div>Gas Level: {gasLevel}%</div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', margin: '0.5rem 0' }}>
              <div style={{ width: `${gasLevel}%`, height: '100%', background: theme.secondary, borderRadius: '4px' }}></div>
            </div>
            <div>Balance: KES {balance.toFixed(2)}</div>
            <button onClick={() => setShowPaymentModal(true)} style={{ marginTop: '0.5rem', background: theme.secondary, color: theme.dark, border: 'none', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>Add Money</button>
          </div>
        </div>
      </div>
      
      {/* Safety Section */}
      <div id="safety" style={{ background: theme.dark, padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: 'white', fontSize: screenSize.isMobile ? '1.5rem' : '2rem' }}>Safety First, Always.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1rem' }}>
              <h3 style={{ color: theme.secondary }}>Automatic Leak Detection</h3>
              <p style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>High-precision sensors monitor air continuously. Instant alerts on your phone.</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1rem' }}>
              <h3 style={{ color: theme.secondary }}>Emergency Valve Shutoff</h3>
              <p style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>Immediate mechanical shutoff when leak detected. Zero risk of accidents.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* M-PESA Instructions */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '1rem', borderLeft: `4px solid ${theme.primary}` }}>
          <h3 style={{ color: theme.primary, marginBottom: '0.5rem' }}>💰 How to Pay via M-PESA</h3>
          <ol style={{ marginLeft: '1rem', color: '#333' }}>
            <li>Click "Top Up M-PESA" button</li>
            <li>Enter your M-PESA registered phone number</li>
            <li>Enter amount (minimum KES 100)</li>
            <li>You'll receive an STK Push on your phone</li>
            <li>Enter your M-PESA PIN to complete payment</li>
            <li>Gas balance updates instantly!</li>
          </ol>
        </div>
      </div>
      
      {/* Footer */}
      <footer style={{ background: '#1a2c38', color: '#94a3b8', padding: '1.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
        <p>© {new Date().getFullYear()} OKOA GAS. Clean Cooking for Every Home.</p>
        <p style={{ marginTop: '0.5rem' }}>📞 +254717052939 | ✉️ hello@okoagas.com</p>
        <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>M-PESA Paybill: 123456 | Account: Your Phone Number</p>
      </footer>
    </div>
  );
};

export default App;