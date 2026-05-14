import React, { useState, useEffect, useRef } from 'react';

// Real image URLs from reliable sources
const images = {
  gasHero: 'https://images.unsplash.com/photo-1513281362764-6f858a0e5c4b?auto=format&fit=crop&w=800&q=80',
  deliveryTruck: 'frontend/images/Quick Delivery.webp',
  mobilePayment: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
  gasRefills: 'frontend/images/Gas Refills.webp=80',
  cylinderKits: 'frontend/images/New Cylinder Kits.webp',
  compositeCylinders: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=80',
  lpgAccessories: 'frontend/images/LPG Accessories.webp',
  smartMeters: 'frontend/images/Smart Meters.webp',
  stepOrder: 'https://images.unsplash.com/photo-150784272343-583f20270319?auto=format&fit=crop&w=600&q=80',
  stepInstallation: 'https://images.unsplash.com/photo-1516534775068-bb57100d4f10?auto=format&fit=crop&w=600&q=80',
  stepTopup: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=600&q=80'
};

const App = () => {
  // --- State ---
  const [gasLevel] = useState(85);
  const [balance, setBalance] = useState(75.50);
  const [showNotification, setShowNotification] = useState(null);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
  
  // --- Form State (Only for final submission) ---
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", location: "", kitId: "6kg", instructions: "" });
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
          if (window.onMapMarkerMoved) {
            window.onMapMarkerMoved(pos.lat, pos.lng);
          }
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
          window.currentMap.setView([latitude, longitude], 13);
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
        window.currentMap.setView([latitude, longitude], 13);
        if (window.currentMarker) {
          window.currentMarker.setLatLng([latitude, longitude]);
        }
      }
      await reverseGeocode(latitude, longitude);
      setLocationStatus('Current location loaded');
    }, (error) => {
      console.error('Geolocation error:', error);
      setLocationStatus('Unable to get current location');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  useEffect(() => {
    window.onMapMarkerMoved = async (lat, lng) => {
      await reverseGeocode(lat, lng);
    };

    return () => {
      window.onMapMarkerMoved = null;
    };
  }, []);

  // --- M-PESA Payment Function ---
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
      showMessage('Enter a valid Kenyan M-PESA phone number (e.g., 0712345678 or +254712345678)', 'error');
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

  // --- SIGNUP MODAL - COMPLETELY ISOLATED COMPONENT ---
  // This component is defined outside to prevent re-renders
  const SignUpModal = ({ showSignUpModal, locationAddress, formData, selectedKit }) => {
    // All state is LOCAL to this component
    const [localName, setLocalName] = useState('');
    const [localPhone, setLocalPhone] = useState('');
    const [localEmail, setLocalEmail] = useState('');
    const [localInstructions, setLocalInstructions] = useState('');
    const [localLocation, setLocalLocation] = useState('');
    const [localSelectedKitId, setLocalSelectedKitId] = useState('6kg');
    const [localErrors, setLocalErrors] = useState({});
    const [localSubmitting, setLocalSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState(locationAddress || '');

    useEffect(() => {
      if (showSignUpModal) {
        setLocalName(formData.name);
        setLocalPhone(formData.phone);
        setLocalEmail(formData.email);
        setLocalInstructions(formData.instructions);
        setLocalLocation(locationAddress);
        setSearchQuery(locationAddress || '');
        setLocalSelectedKitId(selectedKit.id);
        setLocalErrors({});
      }
    }, [showSignUpModal, formData, locationAddress, selectedKit.id]);
    
    if (!showSignUpModal) return null;
    
    const localSelectedKit = kitOptions.find(k => k.id === localSelectedKitId) || kitOptions[0];
    
    const validateForm = () => {
      const errors = {};
      if (!localName.trim()) errors.name = 'Name required';
      if (!localPhone.trim()) errors.phone = 'Phone required';
      else if (!/^(\+254|254|0)[17]\d{8}$/.test(localPhone)) errors.phone = 'Valid Kenyan phone required';
      if (!localLocation) errors.location = 'Location required';
      return errors;
    };
    
    const handleSubmit = (e) => {
      e.preventDefault();
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setLocalErrors(errors);
        showMessage('Please fix errors', 'error');
        return;
      }
      
      setLocalSubmitting(true);
      
      // Update parent state
      const finalLocation = localLocation || locationAddress;
      setFormData({
        name: localName,
        phone: localPhone,
        email: localEmail,
        location: finalLocation,
        kitId: localSelectedKitId,
        instructions: localInstructions
      });
      setLocationAddress(finalLocation);
      setSearchQuery(finalLocation || '');
      setSelectedKit(localSelectedKit);
      
      setTimeout(() => {
        showMessage(`✅ Thank you ${localName}! Your ${localSelectedKit.fullName} will be delivered soon.`, 'success');
        setLocalSubmitting(false);
        setShowSignUpModal(false);
        setLocalName('');
        setLocalPhone('');
        setLocalEmail('');
        setLocalInstructions('');
        setLocalLocation('');
        setFormData({ name: "", phone: "", email: "", location: "", kitId: "6kg", instructions: "" });
        setLocationAddress("");
      }, 1500);
    };
    
    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        zIndex: 2000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: screenSize.isMobile ? '0.5rem' : '1rem',
        overflowY: 'auto'
      }} onClick={() => setShowSignUpModal(false)}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '24px', 
          maxWidth: screenSize.isMobile ? '100%' : '900px', 
          width: '100%', 
          maxHeight: '85vh', 
          overflowY: 'auto', 
          padding: screenSize.isMobile ? '1rem' : '1.5rem', 
          position: 'relative'
        }} onClick={e => e.stopPropagation()}>
          
          <button onClick={() => setShowSignUpModal(false)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
          
          <h2 style={{ fontSize: screenSize.isMobile ? '1.3rem' : '1.5rem', marginBottom: '0.5rem' }}>Get Your Free Kit 🎁</h2>
          
          {/* Kit Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
            {kitOptions.map(kit => (
              <div key={kit.id} onClick={() => { setLocalSelectedKitId(kit.id); setSelectedKit(kit); showMessage(`${kit.fullName} selected!`, 'success'); }} style={{ border: `2px solid ${localSelectedKitId === kit.id ? theme.primary : '#ddd'}`, borderRadius: '12px', padding: '0.75rem', cursor: 'pointer', backgroundColor: localSelectedKitId === kit.id ? `${theme.primary}10` : 'white' }}>
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
                  <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} placeholder="e.g., John Mwangi" autoComplete="off" autoFocus style={{ width: '100%', padding: '0.75rem', border: `1px solid ${localErrors.name ? theme.danger : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
                  {localErrors.name && <p style={{ color: theme.danger, fontSize: '0.8rem', marginTop: '0.25rem' }}>{localErrors.name}</p>}
                </div>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: theme.dark }}>Phone Number *</label>
                  <input type="tel" value={localPhone} onChange={e => setLocalPhone(e.target.value)} placeholder="0712345678" autoComplete="off" style={{ width: '100%', padding: '0.75rem', border: `1px solid ${localErrors.phone ? theme.danger : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
                  {localErrors.phone && <p style={{ color: theme.danger, fontSize: '0.8rem', marginTop: '0.25rem' }}>{localErrors.phone}</p>}
                </div>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: theme.dark }}>Email Address</label>
                  <input type="email" value={localEmail} onChange={e => setLocalEmail(e.target.value)} placeholder="john@example.com" autoComplete="off" style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box' }} />
                </div>
              </div>
              
              {/* RIGHT COLUMN */}
              <div>
                {!useSimpleMap ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input type="text" placeholder="Search delivery address" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.75rem', border: `1px solid ${localErrors.location ? theme.danger : '#ddd'}`, borderRadius: '8px', boxSizing: 'border-box' }} />
                      <button type="button" onClick={searchLocation} style={{ background: theme.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer' }}>Find</button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <button type="button" onClick={useCurrentLocation} style={{ flex: 1, background: theme.secondary, color: theme.dark, border: 'none', borderRadius: '8px', padding: '0.7rem', cursor: 'pointer' }}>Use My Location</button>
                      <button type="button" onClick={() => setUseSimpleMap(true)} style={{ flex: 1, background: '#f0f0f0', color: theme.dark, border: `1px solid ${theme.primary}`, borderRadius: '8px', padding: '0.7rem', cursor: 'pointer' }}>Manual Entry</button>
                    </div>
                    <div ref={mapRef} style={{ height: '220px', borderRadius: '12px', border: `2px solid ${localErrors.location ? theme.danger : theme.primary}`, marginBottom: '0.5rem', backgroundColor: '#f0f0f0' }}>
                      {!mapLoaded && <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem' }}>Loading map... Please wait.</div>}
                    </div>
                  </>
                ) : (
                  <input type="text" placeholder="Enter delivery address" value={localLocation} onChange={e => { setLocalLocation(e.target.value); setLocationAddress(e.target.value); }} style={{ width: '100%', padding: '0.6rem', border: `1px solid ${localErrors.location ? theme.danger : '#ddd'}`, borderRadius: '8px', marginBottom: '0.5rem', boxSizing: 'border-box' }} />
                )}
                {(localLocation || locationAddress) && <div style={{ fontSize: '0.7rem', color: theme.gray, marginTop: '0.25rem' }}>📍 {localLocation || locationAddress}</div>}
                {locationStatus && <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '0.25rem' }}>{locationStatus}</div>}
                {localErrors.location && <p style={{ color: theme.danger, fontSize: '0.8rem', marginTop: '0.25rem' }}>{localErrors.location}</p>}
              </div>
            </div>
            
            <textarea value={localInstructions} onChange={e => setLocalInstructions(e.target.value)} placeholder="Special instructions (gate code, landmark...)" rows="2" style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '8px', marginTop: '0.75rem', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
            
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowSignUpModal(false)} style={{ background: 'white', color: theme.primary, border: `2px solid ${theme.primary}`, padding: '0.6rem 1.2rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
              <button type="submit" disabled={localSubmitting} style={{ background: theme.primary, color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '50px', fontWeight: '600', cursor: localSubmitting ? 'not-allowed' : 'pointer', opacity: localSubmitting ? 0.7 : 1, fontSize: '0.9rem' }}>{localSubmitting ? 'Processing...' : 'Get Free Kit →'}</button>
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
        @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 rgba(42,157,143,0.3); } 50% { box-shadow: 0 0 20px rgba(42,157,143,0.2); } }
        .hero-animate { animation: fadeInUp 0.8s ease forwards; opacity: 0; }
        .feature-card { animation: fadeInUp 0.7s ease forwards; opacity: 0; }
        input, textarea, button { font-family: inherit; }
      `}</style>
      
      {showNotification && <div style={{ position: 'fixed', top: '70px', right: '10px', left: screenSize.isMobile ? '10px' : 'auto', backgroundColor: showNotification.type === 'error' ? theme.danger : (showNotification.type === 'warning' ? theme.accent : theme.primary), color: 'white', padding: '0.75rem', borderRadius: '8px', zIndex: 1001, animation: 'slideIn 0.3s ease', textAlign: 'center', maxWidth: screenSize.isMobile ? 'auto' : '350px' }}>{showNotification.message}</div>}
      
      <PaymentModal />
      <SignUpModal showSignUpModal={showSignUpModal} locationAddress={locationAddress} formData={formData} selectedKit={selectedKit} />
      
      {/* Header */}
      <header style={{ background: 'white', padding: screenSize.isMobile ? '0.75rem 1rem' : '1rem 2rem', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => scrollTo('home')}>
            <span style={{ fontSize: screenSize.isMobile ? '1.3rem' : '1.5rem' }}>🔥</span>
            <span style={{ fontWeight: 'bold', fontSize: screenSize.isMobile ? '1rem' : '1.2rem', color: theme.dark }}>OKOA GAS</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {!screenSize.isMobile && <><button onClick={() => scrollTo('home')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Home</button><button onClick={() => scrollTo('promise')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Features</button></>}
            <Button onClick={() => setShowSignUpModal(true)} small>Get Free Kit</Button>
          </div>
        </div>
      </header>
      
      {/* Hero */}
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
            <img src={images.gasHero} alt="Clean cooking" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.9)' }} />
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
            <div className="feature-card" style={{ borderRadius: '20px', overflow: 'hidden', animation: 'fadeInUp 0.8s ease forwards', opacity: 0, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
              <img src={images.deliveryTruck} alt="Quick Delivery" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem', background: '#fff' }}>
                <h3 style={{ margin: '0 0 0.5rem', color: theme.primary }}>Quick Delivery</h3>
                <p style={{ margin: 0, color: theme.gray, lineHeight: 1.6 }}>Stove-ready LPG cylinders delivered within hours to your doorstep.</p>
              </div>
            </div>
            <div className="feature-card" style={{ borderRadius: '20px', overflow: 'hidden', animation: 'fadeInUp 0.9s ease forwards', opacity: 0, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
              <img src={images.mobilePayment} alt="Secure Payment" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem', background: '#fff' }}>
                <h3 style={{ margin: '0 0 0.5rem', color: theme.primary }}>Secure Payment</h3>
                <p style={{ margin: 0, color: theme.gray, lineHeight: 1.6 }}>Pay instantly with M-PESA. No cash, no hassle, full transparency.</p>
              </div>
            </div>
            <div className="feature-card" style={{ borderRadius: '20px', overflow: 'hidden', animation: 'fadeInUp 1s ease forwards', opacity: 0, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
              <img src={images.smartMeters} alt="Smart Tracking" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem', background: '#fff' }}>
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
                <img src={item.image} alt={item.title} style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '1rem' }} onError={(e) => e.target.style.display = 'none'} />
                <h3 style={{ margin: '0.5rem 0', color: theme.dark }}>{item.title}</h3>
                <p style={{ margin: 0, color: theme.gray, lineHeight: 1.7 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product & Service Overview */}
      <div style={{ background: '#ffffff', padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.9rem', color: theme.secondary, fontWeight: '700' }}>What We Offer</div>
            <h2 style={{ fontSize: screenSize.isMobile ? '1.75rem' : '2.5rem', margin: '0.5rem 0', color: theme.dark }}>Gas refills, kits, accessories and smart LPG services</h2>
            <p style={{ maxWidth: '700px', margin: '0 auto', color: theme.gray }}>Simple, transparent choices for every household and business — from small cylinders to pay-as-you-go smart meters.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
            <div className="feature-card" style={{ padding: '1.5rem', borderRadius: '24px', background: '#f7fdfb', boxShadow: '0 18px 40px rgba(42,157,143,0.08)', textAlign: 'center' }}>
              <img src={images.gasRefills} alt="Gas Refills" style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '1rem' }} />
              <h3 style={{ marginTop: 0, color: theme.primary }}>Gas Refills</h3>
              <p style={{ color: theme.dark, marginBottom: '1rem' }}>Choose from our standard cylinder sizes for the right balance of convenience and cooking power.</p>
              <ul style={{ paddingLeft: '1.15rem', color: theme.gray, lineHeight: 1.8, textAlign: 'left' }}>
                <li>3kg compact refill</li>
                <li>6kg everyday home refill</li>
                <li>13kg family refill</li>
                <li>22.5kg larger cooking refill</li>
                <li>50kg commercial refill</li>
              </ul>
            </div>

            <div className="feature-card" style={{ padding: '1.5rem', borderRadius: '24px', background: '#f4f7ff', boxShadow: '0 18px 40px rgba(40,80,180,0.08)', textAlign: 'center' }}>
              <img src={images.cylinderKits} alt="Cylinder Kits" style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '1rem' }} />
              <h3 style={{ marginTop: 0, color: theme.primary }}>New Cylinder Kits</h3>
              <p style={{ color: theme.dark, marginBottom: '1rem' }}>Complete starter packages that include everything you need to begin cooking safely.</p>
              <ul style={{ paddingLeft: '1.15rem', color: theme.gray, lineHeight: 1.8, textAlign: 'left' }}>
                <li>Cylinder</li>
                <li>Regulator</li>
                <li>Hosepipe</li>
                <li>Burner</li>
                <li>Installation-ready setup</li>
              </ul>
            </div>

            <div className="feature-card" style={{ padding: '1.5rem', borderRadius: '24px', background: '#fff6f4', boxShadow: '0 18px 40px rgba(231,111,81,0.08)', textAlign: 'center' }}>
              <img src={images.compositeCylinders} alt="Composite Cylinders" style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '1rem' }} />
              <h3 style={{ marginTop: 0, color: theme.primary }}>Composite Cylinders</h3>
              <p style={{ color: theme.dark, marginBottom: '1rem' }}>Lightweight, durable cylinder options designed for easy handling and safe refills.</p>
              <ul style={{ paddingLeft: '1.15rem', color: theme.gray, lineHeight: 1.8, textAlign: 'left' }}>
                <li>6kg composite cylinder</li>
                <li>13kg composite cylinder</li>
                <li>Strong, corrosion-resistant material</li>
                <li>Sleek modern design</li>
              </ul>
            </div>

            <div className="feature-card" style={{ padding: '1.5rem', borderRadius: '24px', background: '#fff8e1', boxShadow: '0 18px 40px rgba(228,155,15,0.08)', textAlign: 'center' }}>
              <img src={images.lpgAccessories} alt="LPG Accessories" style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '1rem' }} />
              <h3 style={{ marginTop: 0, color: theme.primary }}>LPG Accessories</h3>
              <p style={{ color: theme.dark, marginBottom: '1rem' }}>Everything you need to keep your LPG system safe, efficient and ready to use.</p>
              <ul style={{ paddingLeft: '1.15rem', color: theme.gray, lineHeight: 1.8, textAlign: 'left' }}>
                <li>Low and high pressure regulators</li>
                <li>Hosepipes and burners</li>
                <li>Igniters, grills and lanterns</li>
                <li>Replacement parts and upgrades</li>
              </ul>
            </div>

            <div className="feature-card" style={{ gridColumn: screenSize.isMobile ? 'auto' : 'span 2', padding: '1.5rem', borderRadius: '24px', background: '#eef8ff', boxShadow: '0 18px 40px rgba(42,157,233,0.08)', textAlign: 'center' }}>
              <img src={images.smartMeters} alt="Smart Meters" style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '1rem' }} />
              <h3 style={{ marginTop: 0, color: theme.primary }}>Smart Meters</h3>
              <p style={{ color: theme.dark, marginBottom: '1rem' }}>Track gas use and pay-as-you-go with smart metering for selected LPG systems.</p>
              <ul style={{ paddingLeft: '1.15rem', color: theme.gray, lineHeight: 1.8, textAlign: 'left' }}>
                <li>Real-time usage monitoring</li>
                <li>Pay only for gas consumed</li>
                <li>Ideal for households and small businesses</li>
                <li>Easy connection with our M-PESA payment flow</li>
              </ul>
            </div>
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
              <div key={i} style={{ textAlign: 'center', padding: '1rem' }}><div style={{ fontSize: '2rem' }}>{item.icon}</div><h3 style={{ color: theme.primary }}>{item.name}</h3><p style={{ color: theme.gray, fontSize: '0.9rem' }}>{item.desc}</p></div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Smart Meter */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
          <div><h2 style={{ fontSize: screenSize.isMobile ? '1.3rem' : '1.8rem' }}>Monitor & Control</h2><p>See live gas level, top up instantly via M-PESA.</p><div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}><Button onClick={() => setShowPaymentModal(true)}>Top Up M-PESA</Button></div></div>
          <div style={{ background: theme.dark, borderRadius: '16px', padding: '1rem', color: 'white' }}>
            <div>Gas Level: {gasLevel}%</div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', margin: '0.5rem 0' }}><div style={{ width: `${gasLevel}%`, height: '100%', background: theme.secondary, borderRadius: '4px' }}></div></div>
            <div>Balance: KES {balance.toFixed(2)}</div>
            <button onClick={() => setShowPaymentModal(true)} style={{ marginTop: '0.5rem', background: theme.secondary, color: theme.dark, border: 'none', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>Add Money</button>
          </div>
        </div>
      </div>
      
      {/* Safety */}
      <div id="safety" style={{ background: theme.dark, padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: 'white', fontSize: screenSize.isMobile ? '1.5rem' : '2rem' }}>Safety First, Always.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1rem' }}><h3 style={{ color: theme.secondary }}>Automatic Leak Detection</h3><p style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>High-precision sensors monitor air continuously.</p></div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1rem' }}><h3 style={{ color: theme.secondary }}>Emergency Valve Shutoff</h3><p style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>Immediate mechanical shutoff when leak detected.</p></div>
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