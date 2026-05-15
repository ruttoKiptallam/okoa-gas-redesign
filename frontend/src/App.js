import React, { useState, useEffect, useRef } from 'react';

// ============================================
// ALL IMAGE IMPORTS - LOCAL .WEBP FILES
// ============================================

// Hero Background Image
import heroBgImg from './assets/images/webp/hero/hero-bg.webp';

// Product Images
import cylinder6kgImg from './assets/images/webp/products/cylinder-6kg.webp';
import cylinder13kgImg from './assets/images/webp/products/cylinder-13kg.webp';
import commercialKitImg from './assets/images/webp/products/commercial-kit.webp';
import meterImg from './assets/images/webp/products/meter.webp';

// Service Images
import quickDeliveryImg from './assets/images/webp/services/quick-delivery.webp';
import smartTrackingImg from './assets/images/webp/services/smart-tracking.webp';
import securePaymentImg from './assets/images/webp/services/secure-payment.webp';

// Step Images (online placeholders)
const stepOrder = 'https://placehold.co/600x400/2A9D8F/white?text=1.+Order+Online';
const stepInstallation = 'https://placehold.co/600x400/2A9D8F/white?text=2.+Delivery+%26+Installation';
const stepTopup = 'https://placehold.co/600x400/2A9D8F/white?text=3.+Top+Up+%26+Track';

// Pattern Background (online)
const pattern = 'https://www.transparenttextures.com/patterns/cartographer.png';

// ============================================
// IMAGES OBJECT
// ============================================
const images = {
  heroBg: heroBgImg,
  quickDelivery: quickDeliveryImg,
  smartTracking: smartTrackingImg,
  securePayment: securePaymentImg,
  cylinder6kg: cylinder6kgImg,
  cylinder13kg: cylinder13kgImg,
  commercialKit: commercialKitImg,
  meter: meterImg,
  pattern: pattern,
  stepOrder: stepOrder,
  stepInstallation: stepInstallation,
  stepTopup: stepTopup,
};

// Safe Image Component with fallback
const SafeImage = ({ src, alt, style, className, onClick }) => {
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    let fallbackEmoji = '🖼️';
    if (alt === '6kg Cylinder' || alt === '13kg Cylinder') fallbackEmoji = '🫙';
    else if (alt === 'Commercial Kit') fallbackEmoji = '🏪';
    else if (alt === 'Smart Meter' || alt === 'Smart Tracking') fallbackEmoji = '📡';
    else if (alt === 'Quick Delivery' || alt === 'Smart Delivery') fallbackEmoji = '🚚';
    else if (alt === 'Secure Payment') fallbackEmoji = '💰';
    
    return (
      <div style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',
        color: '#2A9D8F',
        fontSize: '3rem',
        borderRadius: '12px'
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
  
  // --- Map State ---
  const [mapLoaded, setMapLoaded] = useState(false);
  const [useSimpleMap, setUseSimpleMap] = useState(false);
  const mapRef = useRef(null);
  const [coordinates, setCoordinates] = useState({ lat: -1.286389, lng: 36.817223 });
  const [mapInitialized, setMapInitialized] = useState(false);

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

  // --- Load Leaflet Map CSS and JS ---
  useEffect(() => {
    if (showSignUpModal && !mapLoaded) {
      // Check if Leaflet is already loaded
      if (typeof window.L !== 'undefined') {
        setMapLoaded(true);
        return;
      }
      
      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      
      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    }
  }, [showSignUpModal, mapLoaded]);

  // --- Initialize Map when modal opens ---
  useEffect(() => {
    if (showSignUpModal && mapLoaded && mapRef.current && !mapInitialized && !useSimpleMap) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (!mapRef.current) return;
        
        // Check if map already exists
        if (window.currentMap) {
          window.currentMap.remove();
          window.currentMap = null;
        }
        
        // Create new map
        const map = window.L.map(mapRef.current).setView([coordinates.lat, coordinates.lng], 14);
        
        // Add tile layer (free, no API key)
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);
        
        // Add draggable marker
        const marker = window.L.marker([coordinates.lat, coordinates.lng], { draggable: true }).addTo(map);
        
        // Handle marker drag
        marker.on('dragend', async (e) => {
          const pos = marker.getLatLng();
          setCoordinates({ lat: pos.lat, lng: pos.lng });
          await reverseGeocode(pos.lat, pos.lng);
        });
        
        // Handle map click
        map.on('click', async (e) => {
          marker.setLatLng(e.latlng);
          setCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
          await reverseGeocode(e.latlng.lat, e.latlng.lng);
        });
        
        window.currentMap = map;
        window.currentMarker = marker;
        setMapInitialized(true);
        
        // Force map to render correctly
        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      }, 300);
    }
    
    return () => {
      if (showSignUpModal && window.currentMap && !useSimpleMap) {
        // Don't remove map when modal closes, just clean up
      }
    };
  }, [showSignUpModal, mapLoaded, coordinates, useSimpleMap, mapInitialized]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data?.display_name && window.updateLocationDisplay) {
        window.updateLocationDisplay(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
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

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Payment Modal ---
  const PaymentModal = () => {
    if (!showPaymentModal) return null;
    
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowPaymentModal(false)}>
        <div style={{ backgroundColor: 'white', borderRadius: '24px', maxWidth: '450px', width: '100%', padding: '1.5rem', position: 'relative', animation: 'fadeInUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowPaymentModal(false)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
          
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem', animation: 'pulse 2s infinite' }}>💰</div>
            <h2 style={{ fontSize: '1.5rem', marginTop: '0.5rem', color: '#264653' }}>M-PESA Payment</h2>
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
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: Number(paymentDetails.amount) === amt ? 'scale(1.05)' : 'scale(1)'
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
            background: 'linear-gradient(135deg, #2A9D8F 0%, #1E6B61 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: processingPayment ? 'not-allowed' : 'pointer',
            opacity: processingPayment ? 0.7 : 1,
            transition: 'all 0.3s ease'
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
  const theme = { 
    primary: "#2A9D8F", 
    primaryDark: "#1E6B61", 
    secondary: "#E9C46A", 
    accent: "#F4A261", 
    dark: "#264653", 
    light: "#F8F9FA", 
    gray: "#6C757D", 
    danger: "#E76F51",
    gradient1: "linear-gradient(135deg, #2A9D8F 0%, #264653 100%)",
    gradient2: "linear-gradient(135deg, #E9C46A 0%, #F4A261 100%)",
    gradient3: "linear-gradient(135deg, #1E6B61 0%, #2A9D8F 100%)",
    bgGradient1: "linear-gradient(135deg, #e8f5e9 0%, #c8e6e9 50%, #b2dfdb 100%)",
    bgGradient2: "linear-gradient(135deg, #fef9e4 0%, #fdf2e9 100%)",
    bgGradient3: "linear-gradient(135deg, #e3f2fd 0%, #e8f5e9 100%)"
  };
  
  const Button = ({ children, onClick, primary = true, small = false }) => (
    <button onClick={onClick} style={{
      background: primary ? theme.gradient1 : 'white',
      color: primary ? 'white' : theme.primary,
      border: primary ? 'none' : `2px solid ${theme.primary}`,
      padding: small ? '0.5rem 1rem' : (screenSize.isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem'),
      borderRadius: '50px',
      fontWeight: '600',
      fontSize: small ? '0.85rem' : (screenSize.isMobile ? '0.9rem' : '1rem'),
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    }}>{children}</button>
  );

// ============================================
// SIGNUP MODAL - FULLY TESTED (NO WARNINGS)
// ============================================
const SignUpModal = () => {
  // Form state
  /* eslint-disable react-hooks/exhaustive-deps */
  const [localName, setLocalName] = useState('');
  const [localPhone, setLocalPhone] = useState('');
  const [localEmail, setLocalEmail] = useState('');
  const [localInstructions, setLocalInstructions] = useState('');
  const [localLocation, setLocalLocation] = useState('');
  const [localSelectedKitId, setLocalSelectedKitId] = useState(selectedKit.id);
  const [localErrors, setLocalErrors] = useState({});
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [localLocationStatus, setLocalLocationStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Store initial values when modal opens
  const initialKitIdRef = useRef(selectedKit.id);
  const prevShowModalRef = useRef(showSignUpModal);
  
  // Set up global callback for map location - runs once on mount
  useEffect(() => {
    window.updateLocationDisplay = (address) => {
      setLocalLocation(address);
      setSearchQuery(address);
      setLocalLocationStatus('✅ Location selected from map');
    };
    
    return () => {
      delete window.updateLocationDisplay;
    };
  }, []); // ✅ Empty array - no issues
  
  // Reset form when modal opens
  useEffect(() => {
    // Check if modal just opened (was false, now true)
    if (showSignUpModal && !prevShowModalRef.current) {
      // Reset all form fields
      setLocalName('');
      setLocalPhone('');
      setLocalEmail('');
      setLocalInstructions('');
      setLocalLocation('');
      setSearchQuery('');
      setLocalSelectedKitId(selectedKit.id);
      setLocalErrors({});
      setLocalLocationStatus('');
      setSuggestions([]);
      setShowSuggestions(false);
      initialKitIdRef.current = selectedKit.id;
    }
    // Update ref for next comparison
    prevShowModalRef.current = showSignUpModal;
  }, [showSignUpModal, selectedKit.id]); // ✅ All dependencies included
  
  // Don't render if modal is closed
  if (!showSignUpModal) return null;
  
  const localSelectedKit = kitOptions.find(k => k.id === localSelectedKitId) || kitOptions[0];
  
  const searchLocationWithSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
      const results = await response.json();
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Search error:', error);
    }
  };
  
  const handleLocationChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setLocalLocation(value);
    if (value.length > 2) {
      searchLocationWithSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const selectLocation = async (result) => {
    const { lat, lon, display_name } = result;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    setCoordinates({ lat: latitude, lng: longitude });
    setLocalLocation(display_name);
    setSearchQuery(display_name);
    setLocalLocationStatus('✅ Location selected!');
    setShowSuggestions(false);
    setSuggestions([]);
    
    if (window.currentMap && window.currentMarker) {
      window.currentMap.setView([latitude, longitude], 15);
      window.currentMarker.setLatLng([latitude, longitude]);
    }
  };
  
  const searchOnMap = async () => {
    if (!searchQuery.trim()) {
      setLocalLocationStatus('Enter a location to search');
      return;
    }
    setLocalLocationStatus('Searching...');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const results = await response.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        setCoordinates({ lat: latitude, lng: longitude });
        setLocalLocation(display_name);
        setSearchQuery(display_name);
        setLocalLocationStatus('✅ Address found on map!');
        if (window.currentMap && window.currentMarker) {
          window.currentMap.setView([latitude, longitude], 15);
          window.currentMarker.setLatLng([latitude, longitude]);
        }
      } else {
        setLocalLocationStatus('❌ Address not found');
      }
    } catch (error) {
      setLocalLocationStatus('Search failed');
    }
  };
  
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocalLocationStatus('Geolocation not supported');
      return;
    }
    setLocalLocationStatus('Getting location...');
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setCoordinates({ lat: latitude, lng: longitude });
      if (window.currentMap && window.currentMarker) {
        window.currentMap.setView([latitude, longitude], 15);
        window.currentMarker.setLatLng([latitude, longitude]);
      }
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        if (data?.display_name) {
          setLocalLocation(data.display_name);
          setSearchQuery(data.display_name);
          setLocalLocationStatus('✅ Current location loaded!');
        }
      } catch (error) {
        setLocalLocationStatus('Location captured!');
      }
    }, () => setLocalLocationStatus('Unable to get location'));
  };
  
  const sendEmailNotification = (formDataToSend) => {
    const subject = `NEW KIT REQUEST: ${formDataToSend.name} - ${formDataToSend.kitName}`;
    const body = `NEW FREE KIT REQUEST FROM OKOA GAS WEBSITE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CUSTOMER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${formDataToSend.name}
Phone: ${formDataToSend.phone}
Email: ${formDataToSend.email}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KIT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kit Type: ${formDataToSend.kitName}
Size: ${formDataToSend.kitSize}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DELIVERY LOCATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formDataToSend.location}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPECIAL INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formDataToSend.instructions || 'None provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request Date: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    
    const mailtoLink = `mailto:ruttokitallam@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    const customerSubject = `OKOA GAS: Free Kit Request Confirmation - ${formDataToSend.kitName}`;
    const customerBody = `Dear ${formDataToSend.name},

Thank you for requesting a FREE kit from OKOA GAS!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kit: ${formDataToSend.kitName}
Delivery Location: ${formDataToSend.location}
Phone: ${formDataToSend.phone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT HAPPENS NEXT?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. We will contact you within 24 hours
2. Confirm your delivery address
3. Schedule free installation
4. Your kit will be delivered FREE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Need help? Contact us:
📞 +254717052939
✉️ hello@okoagas.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for choosing OKOA GAS!
Clean Cooking for Every Home.`;
    
    const customerMailto = `mailto:${formDataToSend.email}?subject=${encodeURIComponent(customerSubject)}&body=${encodeURIComponent(customerBody)}`;
    
    window.open(mailtoLink, '_blank');
    setTimeout(() => {
      window.open(customerMailto, '_blank');
    }, 500);
    
    return true;
  };
  
  const validateLocalForm = () => {
    const errors = {};
    if (!localName.trim()) errors.name = 'Name required';
    if (!localPhone.trim()) errors.phone = 'Phone required';
    else if (!/^(\+254|254|0)[17]\d{8}$/.test(localPhone)) errors.phone = 'Valid Kenyan phone required';
    if (!localEmail.trim()) errors.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localEmail)) errors.email = 'Valid email required';
    if (!localLocation) errors.location = 'Location required';
    return errors;
  };
  
  const handleLocalSubmit = (e) => {
    e.preventDefault();
    const errors = validateLocalForm();
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      showMessage('Please fix errors', 'error');
      return;
    }
    
    setLocalSubmitting(true);
    
    const emailData = {
      name: localName,
      phone: localPhone,
      email: localEmail,
      kitName: localSelectedKit.fullName,
      kitSize: localSelectedKit.size,
      location: localLocation,
      instructions: localInstructions
    };
    
    sendEmailNotification(emailData);
    setSelectedKit(localSelectedKit);
    
    setTimeout(() => {
      showMessage(`✅ Thank you ${localName}! Your ${localSelectedKit.fullName} request has been sent. Check your email for confirmation.`, 'success');
      setLocalSubmitting(false);
      setShowSignUpModal(false);
    }, 1500);
  };
  
  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: screenSize.isMobile ? '0.5rem' : '1rem', overflowY: 'auto'
    }} onClick={() => setShowSignUpModal(false)}>
      <div style={{ 
        background: theme.bgGradient1,
        borderRadius: '24px', 
        maxWidth: screenSize.isMobile ? '100%' : '900px', 
        width: '100%', 
        maxHeight: '85vh', 
        overflowY: 'auto', 
        padding: screenSize.isMobile ? '1rem' : '1.5rem', 
        position: 'relative',
        animation: 'fadeInUp 0.3s ease'
      }} onClick={e => e.stopPropagation()}>
        
        <button onClick={() => setShowSignUpModal(false)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', fontSize: '1rem', cursor: 'pointer' }}>✕</button>
        
        <h2 style={{ fontSize: screenSize.isMobile ? '1.3rem' : '1.5rem', marginBottom: '0.5rem', color: theme.dark }}>Get Your Free Kit 🎁</h2>
        
        {/* Kit Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          {kitOptions.map(kit => (
            <div key={kit.id} onClick={() => { 
              setLocalSelectedKitId(kit.id); 
              setSelectedKit(kit); 
              showMessage(`${kit.fullName} selected!`, 'success'); 
            }} style={{ 
              border: `2px solid ${localSelectedKitId === kit.id ? theme.primary : '#ddd'}`, 
              borderRadius: '12px', 
              padding: '0.75rem', 
              cursor: 'pointer', 
              background: localSelectedKitId === kit.id ? `linear-gradient(135deg, ${theme.primary}15, ${theme.primary}05)` : 'rgba(255,255,255,0.7)'
            }}>
              <SafeImage src={kit.id === '6kg' ? images.cylinder6kg : (kit.id === '13kg' ? images.cylinder13kg : images.commercialKit)} alt={kit.fullName} style={{ width: '100%', height: '100px', objectFit: 'contain' }} />
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center', color: theme.dark }}>{kit.fullName} ({kit.size})</div>
              <div style={{ fontSize: '0.7rem', color: theme.gray, textAlign: 'center' }}>{kit.cooker}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: theme.primary, textAlign: 'center' }}>{kit.price}</div>
            </div>
          ))}
        </div>
        
        <form onSubmit={handleLocalSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
            {/* LEFT COLUMN */}
            <div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: theme.dark }}>Full Name *</label>
                <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} placeholder="e.g., John Mwangi" autoComplete="off" autoFocus style={{ width: '100%', padding: '0.75rem', border: `1px solid ${localErrors.name ? theme.danger : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', background: 'white' }} />
                {localErrors.name && <p style={{ color: theme.danger, fontSize: '0.8rem', marginTop: '0.25rem' }}>{localErrors.name}</p>}
              </div>
              
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: theme.dark }}>Phone Number *</label>
                <input type="tel" value={localPhone} onChange={e => setLocalPhone(e.target.value)} placeholder="0712345678" autoComplete="off" style={{ width: '100%', padding: '0.75rem', border: `1px solid ${localErrors.phone ? theme.danger : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', background: 'white' }} />
                {localErrors.phone && <p style={{ color: theme.danger, fontSize: '0.8rem', marginTop: '0.25rem' }}>{localErrors.phone}</p>}
              </div>
              
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: theme.dark }}>Email Address *</label>
                <input type="email" value={localEmail} onChange={e => setLocalEmail(e.target.value)} placeholder="john@example.com" autoComplete="off" style={{ width: '100%', padding: '0.75rem', border: `1px solid ${localErrors.email ? theme.danger : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', background: 'white' }} />
                {localErrors.email && <p style={{ color: theme.danger, fontSize: '0.8rem', marginTop: '0.25rem' }}>{localErrors.email}</p>}
              </div>
            </div>
            
            {/* RIGHT COLUMN */}
            <div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: theme.dark }}>📍 Delivery Location *</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={handleLocationChange}
                      placeholder="e.g., Nairobi, Westlands, Kenyatta Ave..." 
                      autoComplete="off"
                      style={{ flex: 2, padding: '0.75rem', border: `1px solid ${localErrors.location ? theme.danger : '#ddd'}`, borderRadius: '8px', fontSize: '1rem', background: 'white' }}
                    />
                    <button type="button" onClick={searchOnMap} style={{ background: theme.gradient1, color: 'white', border: 'none', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', fontWeight: '500' }}>🔍</button>
                    <button type="button" onClick={getCurrentLocation} style={{ background: theme.gradient2, color: theme.dark, border: 'none', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer' }}>📍</button>
                  </div>
                  
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      zIndex: 100,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: `1px solid ${theme.primary}`
                    }}>
                      {suggestions.map((suggestion, idx) => (
                        <div key={idx} onClick={() => selectLocation(suggestion)} style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '0.85rem' }} onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          📍 {suggestion.display_name.substring(0, 80)}...
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {localLocationStatus && <p style={{ color: theme.primary, fontSize: '0.7rem', marginTop: '0.25rem' }}>{localLocationStatus}</p>}
                {localErrors.location && <p style={{ color: theme.danger, fontSize: '0.8rem', marginTop: '0.25rem' }}>{localErrors.location}</p>}
              </div>
              
              {/* MAP CONTAINER */}
              <div ref={mapRef} style={{ height: '220px', borderRadius: '12px', border: `2px solid ${localErrors.location ? theme.danger : theme.primary}`, marginBottom: '0.5rem', backgroundColor: '#f0f0f0', overflow: 'hidden' }}>
                {!mapLoaded && <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem' }}>🗺️ Loading map...</div>}
                {mapLoaded && !mapInitialized && <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem' }}>🗺️ Initializing map...</div>}
              </div>
              
              <button type="button" onClick={() => setUseSimpleMap(!useSimpleMap)} style={{ width: '100%', padding: '0.4rem', background: 'transparent', color: theme.primary, border: `1px solid ${theme.primary}`, borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {useSimpleMap ? '← Back to Map' : '✏️ Enter Manually'}
              </button>
            </div>
          </div>
          
          <textarea value={localInstructions} onChange={e => setLocalInstructions(e.target.value)} placeholder="Special instructions (gate code, landmark, preferred delivery time...)" rows="2" style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '8px', marginTop: '0.75rem', fontSize: '0.9rem', resize: 'vertical', background: 'white' }} />
          
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowSignUpModal(false)} style={{ background: 'white', color: theme.primary, border: `2px solid ${theme.primary}`, padding: '0.6rem 1.2rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={localSubmitting} style={{ background: theme.gradient1, color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '50px', fontWeight: '600', cursor: localSubmitting ? 'not-allowed' : 'pointer', opacity: localSubmitting ? 0.7 : 1 }}>{localSubmitting ? 'Sending...' : 'Get Free Kit →'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

  // --- MAIN RENDER ---
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: theme.bgGradient1, minHeight: '100vh' }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        
        .hero-animate { animation: fadeInUp 0.8s ease forwards; opacity: 0; }
        .feature-card { animation: fadeInUp 0.7s ease forwards; opacity: 0; transition: all 0.3s ease; }
        .feature-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(42,157,143,0.2); }
        
        input:focus, textarea:focus { outline: none; border-color: #2A9D8F !important; box-shadow: 0 0 0 3px rgba(42,157,143,0.1); }
        
        /* Leaflet map fix */
        .leaflet-container {
          z-index: 1;
        }
      `}</style>
      
      {showNotification && <div style={{ position: 'fixed', top: '70px', right: '10px', left: screenSize.isMobile ? '10px' : 'auto', backgroundColor: showNotification.type === 'error' ? theme.danger : (showNotification.type === 'warning' ? theme.accent : theme.primary), color: 'white', padding: '0.75rem', borderRadius: '8px', zIndex: 1001, animation: 'slideIn 0.3s ease', textAlign: 'center' }}>{showNotification.message}</div>}
      
      <PaymentModal />
      <SignUpModal />
      
      {/* Header with Original Logo */}
      <header style={{ 
        background: 'rgba(255,255,255,0.95)', 
        backdropFilter: 'blur(10px)',
        padding: screenSize.isMobile ? '0.75rem 1rem' : '1rem 2rem', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => scrollTo('home')}>
            <span style={{ fontSize: screenSize.isMobile ? '1.8rem' : '2rem', animation: 'pulse 2s ease-in-out infinite' }}>🔥</span>
            <span style={{ fontWeight: 'bold', fontSize: screenSize.isMobile ? '1.2rem' : '1.5rem', background: theme.gradient1, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>OKOA GAS</span>
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
      <div id="home" style={{ maxWidth: '1200px', margin: '0 auto', padding: screenSize.isMobile ? '2rem 1rem' : '4rem 2rem', textAlign: 'center', position: 'relative' }}>
        <h1 style={{ background: theme.gradient1, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: screenSize.isMobile ? '2rem' : '3rem', marginBottom: '0.5rem' }}>Clean Cooking for Every Home.</h1>
        <p style={{ fontSize: screenSize.isMobile ? '1.2rem' : '1.5rem', color: theme.primary, margin: '0.5rem 0' }}>Pay as you go from KES 1.</p>
        <p style={{ maxWidth: '500px', margin: '1rem auto', color: theme.gray }}>No cylinders to buy. No deposit. Just clean LPG delivered to your stove.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button onClick={() => setShowSignUpModal(true)}>Get Your Free Kit →</Button>
          <Button onClick={() => setShowPaymentModal(true)} primary={false}>Top Up M-PESA</Button>
        </div>
        
        {/* Smart delivery + cashless payment section */}
        <div style={{ marginTop: '3rem' }}>
          <div style={{ 
            backgroundImage: `url(${images.heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '24px',
            overflow: 'hidden',
            position: 'relative',
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(42,157,143,0.85), rgba(38,70,83,0.85))',
              zIndex: 1
            }} />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '3rem 2rem' }}>
              <h2 style={{ color: 'white', fontSize: screenSize.isMobile ? '1.5rem' : '2rem', marginBottom: '1rem' }}>Smart Delivery</h2>
              <p style={{ color: 'white', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Fast, reliable, and cashless payment options for your convenience.</p>
              <div style={{ marginTop: '1.5rem' }}>
                <Button onClick={() => setShowSignUpModal(true)}>Order Now →</Button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
          {[
            { title: 'Fast Refill', text: 'Gas delivered within hours for all standard cylinder sizes.' },
            { title: 'Complete Kits', text: 'Cylinder, regulator, hose, and burner included for seamless setup.' },
            { title: 'Pay-as-you-go', text: 'M-PESA top-up and smart meter support for flexible spending.' }
          ].map((item, index) => (
            <div key={index} className="feature-card" style={{ padding: '1.25rem', borderRadius: '20px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(5px)' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: theme.primary, marginBottom: '0.75rem' }}>{item.title}</div>
              <p style={{ margin: 0, color: theme.gray, lineHeight: 1.7 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Gallery Section */}
      <div style={{ background: theme.bgGradient2, padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: screenSize.isMobile ? '1.75rem' : '2.5rem', color: theme.dark }}>Our Services in Action</h2>
            <p style={{ maxWidth: '680px', margin: '1rem auto 0', color: theme.gray }}>See how OKOA GAS delivers clean cooking solutions.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="feature-card" style={{ borderRadius: '20px', overflow: 'hidden', background: 'white' }}>
              <SafeImage src={images.quickDelivery} alt="Quick Delivery" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}><h3 style={{ color: theme.primary }}>Quick Delivery</h3><p style={{ color: theme.gray }}>Stove-ready LPG cylinders delivered within hours.</p></div>
            </div>
            <div className="feature-card" style={{ borderRadius: '20px', overflow: 'hidden', background: 'white' }}>
              <SafeImage src={images.smartTracking} alt="Smart Tracking" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}><h3 style={{ color: theme.primary }}>Smart Tracking</h3><p style={{ color: theme.gray }}>Monitor your gas usage in real-time.</p></div>
            </div>
            <div className="feature-card" style={{ borderRadius: '20px', overflow: 'hidden', background: 'white' }}>
              <SafeImage src={images.securePayment} alt="Secure Payment" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}><h3 style={{ color: theme.primary }}>Secure Payment</h3><p style={{ color: theme.gray }}>Pay instantly with M-PESA.</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Showcase */}
      <div style={{ background: theme.bgGradient3, padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ color: theme.secondary, fontWeight: 700, marginBottom: '0.5rem' }}>Quality Products</div>
            <h2 style={{ fontSize: screenSize.isMobile ? '1.75rem' : '2.5rem', color: theme.dark }}>Our Cylinder Kits</h2>
            <p style={{ maxWidth: '680px', margin: '1rem auto 0', color: theme.gray }}>Choose the perfect kit for your home or business needs.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <div className="feature-card" style={{ padding: '1.5rem', borderRadius: '24px', background: 'white', textAlign: 'center' }}>
              <SafeImage src={images.cylinder6kg} alt="6kg Cylinder" style={{ width: '100%', height: '150px', objectFit: 'contain', marginBottom: '1rem' }} />
              <h3 style={{ margin: '0.5rem 0', color: theme.primary }}>6kg Cylinder</h3>
              <p style={{ margin: 0, color: theme.gray, lineHeight: 1.7 }}>Perfect for small families (1-3 people). Comes with 2-burner cooker.</p>
              <div style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold', color: theme.dark }}>FREE + from KES 500/mo</div>
            </div>
            <div className="feature-card" style={{ padding: '1.5rem', borderRadius: '24px', background: 'white', textAlign: 'center' }}>
              <SafeImage src={images.cylinder13kg} alt="13kg Cylinder" style={{ width: '100%', height: '150px', objectFit: 'contain', marginBottom: '1rem' }} />
              <h3 style={{ margin: '0.5rem 0', color: theme.primary }}>13kg Cylinder</h3>
              <p style={{ margin: 0, color: theme.gray, lineHeight: 1.7 }}>Ideal for larger families (4-6 people). Comes with 3-burner cooker.</p>
              <div style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold', color: theme.dark }}>FREE + from KES 800/mo</div>
            </div>
            <div className="feature-card" style={{ padding: '1.5rem', borderRadius: '24px', background: 'white', textAlign: 'center' }}>
              <SafeImage src={images.commercialKit} alt="Commercial Kit" style={{ width: '100%', height: '150px', objectFit: 'contain', marginBottom: '1rem' }} />
              <h3 style={{ margin: '0.5rem 0', color: theme.primary }}>50kg Commercial Kit</h3>
              <p style={{ margin: 0, color: theme.gray, lineHeight: 1.7 }}>For restaurants and hotels (7+ people). 6-burner industrial cooker.</p>
              <div style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold', color: theme.dark }}>FREE + from KES 2,500/mo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Display */}
      <div style={{ maxWidth: '1200px', margin: '1.5rem auto', padding: '0 1rem' }}>
        <div style={{ background: theme.gradient1, borderRadius: '20px', padding: '1.5rem', color: 'white', textAlign: 'center' }}>
          <div>Your Current Balance</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>KES {balance.toFixed(2)}</div>
          <button onClick={() => setShowPaymentModal(true)} style={{ marginTop: '0.5rem', background: 'white', color: theme.primary, border: 'none', padding: '0.5rem 1rem', borderRadius: '50px', cursor: 'pointer' }}>Add Money via M-PESA</button>
        </div>
      </div>
      
      {/* Promise Section */}
      <div id="promise" style={{ background: theme.bgGradient1, padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: screenSize.isMobile ? '1.5rem' : '2rem', color: theme.dark }}>The "Zero Upfront" Promise</h2>
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            {[{ icon: '🫙', name: 'Free Cylinder', desc: '6kg or 13kg cylinder' }, { icon: '🍳', name: 'Free Cooker', desc: '2-3 burner cooker' }, { icon: '📡', name: 'Smart Meter', desc: 'Pay for what you use' }].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.5)', borderRadius: '16px' }}>
                <div style={{ fontSize: '2rem' }}>{item.icon}</div>
                <h3 style={{ color: theme.primary }}>{item.name}</h3>
                <p style={{ color: theme.gray }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Smart Meter */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
          <div><h2 style={{ fontSize: screenSize.isMobile ? '1.3rem' : '1.8rem', color: theme.dark }}>Monitor & Control</h2><p>See live gas level, top up via M-PESA.</p><Button onClick={() => setShowPaymentModal(true)}>Top Up M-PESA</Button></div>
          <div style={{ background: theme.gradient3, borderRadius: '16px', padding: '1rem', color: 'white', textAlign: 'center' }}>
            <SafeImage src={images.meter} alt="Smart Meter" style={{ width: '80%', marginBottom: '1rem' }} />
            <div>Gas Level: {gasLevel}%</div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', margin: '0.5rem 0' }}><div style={{ width: `${gasLevel}%`, height: '100%', background: theme.secondary, borderRadius: '4px' }}></div></div>
            <div>Balance: KES {balance.toFixed(2)}</div>
            <button onClick={() => setShowPaymentModal(true)} style={{ marginTop: '0.5rem', background: theme.secondary, color: theme.dark, border: 'none', padding: '0.3rem 0.8rem', borderRadius: '8px', cursor: 'pointer' }}>Add Money</button>
          </div>
        </div>
      </div>
      
      {/* Safety Section */}
      <div id="safety" style={{ background: theme.dark, padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: 'white', fontSize: screenSize.isMobile ? '1.5rem' : '2rem' }}>Safety First, Always.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1rem' }}><h3 style={{ color: theme.secondary }}>Automatic Leak Detection</h3><p style={{ color: '#e2e8f0' }}>High-precision sensors monitor air continuously.</p></div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1rem' }}><h3 style={{ color: theme.secondary }}>Emergency Valve Shutoff</h3><p style={{ color: '#e2e8f0' }}>Immediate mechanical shutoff when leak detected.</p></div>
          </div>
        </div>
      </div>
      
      {/* How It Works */}
      <div style={{ background: theme.bgGradient2, padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: screenSize.isMobile ? '1.75rem' : '2.5rem', color: theme.dark }}>How OKOA GAS works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            {[{ image: images.stepOrder, title: 'Order your cylinder', text: 'Choose your refill size and starter kit.' }, { image: images.stepInstallation, title: 'Installation & delivery', text: 'We deliver and install safely.' }, { image: images.stepTopup, title: 'Top up & track', text: 'Use M-PESA to top up and monitor usage.' }].map((item, index) => (
              <div key={index} className="feature-card" style={{ padding: '1.5rem', borderRadius: '24px', background: 'white' }}>
                <SafeImage src={item.image} alt={item.title} style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '1rem' }} />
                <h3 style={{ margin: '0.5rem 0', color: theme.dark }}>{item.title}</h3>
                <p style={{ color: theme.gray }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* M-PESA Instructions */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ background: theme.bgGradient3, borderRadius: '16px', padding: '1rem', borderLeft: `4px solid ${theme.primary}` }}>
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
      
      {/* ============================================ */}
      {/* ORIGINAL FOOTER - RETAINED FROM ORIGINAL WEBSITE */}
      {/* ============================================ */}
      <footer style={{ 
        background: '#1a2c38', 
        color: '#94a3b8', 
        padding: '3rem 2rem 1.5rem',
        marginTop: '0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(4, 1fr)',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Company Info */}
          <div>
            <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.2rem' }}>OKOA GAS</h3>
            <p style={{ lineHeight: '1.6', fontSize: '0.9rem' }}>Clean cooking for every home. Zero upfront costs, pay as you go from KES 1.</p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.2rem' }}>Quick Links</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <button onClick={() => scrollTo('home')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}>Home</button>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <button onClick={() => scrollTo('promise')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}>How It Works</button>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <button onClick={() => scrollTo('safety')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}>Safety</button>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <button onClick={() => setShowSignUpModal(true)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}>Get Free Kit</button>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.2rem' }}>Contact</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>📞 +254717052939</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>✉️ hello@okoagas.com</p>
            <p style={{ fontSize: '0.9rem' }}>📍 Nairobi, Kenya</p>
          </div>
          
          {/* Social Media */}
          <div>
            <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.2rem' }}>Follow Us</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem', cursor: 'pointer' }}>📘</span>
              <span style={{ fontSize: '1.5rem', cursor: 'pointer' }}>🐦</span>
              <span style={{ fontSize: '1.5rem', cursor: 'pointer' }}>📷</span>
              <span style={{ fontSize: '1.5rem', cursor: 'pointer' }}>💼</span>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div style={{
          textAlign: 'center',
          paddingTop: '1.5rem',
          borderTop: '1px solid #3a5a6b',
          fontSize: '0.8rem'
        }}>
          © {new Date().getFullYear()} OKOA GAS. All rights reserved. Clean Cooking for Every Home.
        </div>
      </footer>
    </div>
  );
};

export default App;