import React, { useState, useEffect, useRef, useMemo } from 'react';

// ============================================
// ALL IMAGE IMPORTS - LOCAL .WEBP FILES
// ============================================

// Product Images
import cylinder6kgImg from './assets/images/webp/products/cylinder-6kg.webp';
import cylinder13kgImg from './assets/images/webp/products/cylinder-13kg.webp';
import commercialKitImg from './assets/images/webp/products/commercial-kit.webp';
import meterImg from './assets/images/webp/products/meter.webp';

// Service Images
import quickDeliveryImg from './assets/images/webp/services/quick-delivery.webp';
import smartTrackingImg from './assets/images/webp/services/smart-tracking.webp';
import securePaymentImg from './assets/images/webp/services/secure-payment.webp';

// Hero Background Image
import heroBgImg from './assets/images/webp/hero/hero-bg.webp';

// Step Images (online placeholders)
const stepOrder = 'https://placehold.co/600x400/2A6B5F/white?text=1.+Order+Online';
const stepInstallation = 'https://placehold.co/600x400/2A6B5F/white?text=2.+Delivery+%26+Installation';
const stepTopup = 'https://placehold.co/600x400/2A6B5F/white?text=3.+Top+Up+%26+Track';

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
        background: '#f0fdf4',
        color: '#2A6B5F',
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
  // --- Dark Mode State ---
  const [darkMode, setDarkMode] = useState(false);
  
  // --- Modal Key for Reset (Prevents useEffect warnings) ---
  const [modalKey, setModalKey] = useState(0);
  
  // --- State ---
  const [gasLevel] = useState(85);
  const [balance, setBalance] = useState(75.50);
  const [showNotification, setShowNotification] = useState(null);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [screenSize, setScreenSize] = useState({
    isMobile: window.innerWidth < 768,
    width: window.innerWidth
  });
  
  // --- API Base URL ---
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // --- Kit Options ---
  const [kitOptions] = useState([
    { id: "6kg", name: "Family Starter", fullName: "Family Starter Kit", size: "6kg", cooker: "2-Burner", price: "10% DEPOSIT", icon: "🏠", popular: true, monthly: "from KES 500", fullPrice: 5000 },
    { id: "13kg", name: "Family Plus", fullName: "Family Plus Kit", size: "13kg", cooker: "3-Burner", price: "10% DEPOSIT", icon: "👨‍👩‍👧‍👦", popular: false, monthly: "from KES 800", fullPrice: 8000 },
    { id: "commercial", name: "Commercial", fullName: "Commercial Kit", size: "50kg", cooker: "6-Burner", price: "10% DEPOSIT", icon: "🏪", popular: false, monthly: "from KES 2,500", fullPrice: 25000 }
  ]);
  
  const [selectedKit, setSelectedKit] = useState(kitOptions[0]);
  
  // --- Map State ---
  const [mapLoaded, setMapLoaded] = useState(false);
  const [useSimpleMap, setUseSimpleMap] = useState(false);
  const mapRef = useRef(null);
  const [coordinates, setCoordinates] = useState({ lat: -1.286389, lng: 36.817223 });
  const [mapInitialized, setMapInitialized] = useState(false);
  
  // --- Open modal with reset key ---
  const openSignUpModal = () => {
    setShowSignUpModal(true);
    setModalKey(prev => prev + 1);
  };

  // --- Notification System (Top-right corner) ---
  const showMessage = (msg, type = 'success') => {
    setShowNotification({ message: msg, type });
    setTimeout(() => setShowNotification(null), 4000);
  };

  // --- Screen Resize Handler ---
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        isMobile: window.innerWidth < 768,
        width: window.innerWidth
      });
      if (showSignUpModal && window.currentMap) {
        setTimeout(() => window.currentMap?.invalidateSize(), 200);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showSignUpModal]);

  // --- Load Leaflet Map CSS and JS ---
  useEffect(() => {
    if (showSignUpModal && !mapLoaded) {
      if (typeof window.L !== 'undefined') {
        setMapLoaded(true);
        return;
      }
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setMapLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Leaflet map');
        showMessage('Map failed to load. Please use manual address entry.', 'warning');
      };
      document.head.appendChild(script);
    }
  }, [showSignUpModal, mapLoaded]);

  // --- Initialize Map when modal opens ---
  useEffect(() => {
    if (showSignUpModal && mapLoaded && mapRef.current && !mapInitialized && !useSimpleMap) {
      const timer = setTimeout(() => {
        if (!mapRef.current) return;
        
        if (window.currentMap) {
          window.currentMap.remove();
          window.currentMap = null;
        }
        
        try {
          const map = window.L.map(mapRef.current).setView([coordinates.lat, coordinates.lng], 14);
          
          // Tile layer added directly (removed unused variable)
          window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
            subdomains: 'abcd',
            maxZoom: 19,
            minZoom: 10
          }).addTo(map);
          
          const marker = window.L.marker([coordinates.lat, coordinates.lng], { draggable: true }).addTo(map);
          
          marker.on('dragend', async (e) => {
            const pos = marker.getLatLng();
            setCoordinates({ lat: pos.lat, lng: pos.lng });
            await reverseGeocode(pos.lat, pos.lng);
          });
          
          map.on('click', async (e) => {
            marker.setLatLng(e.latlng);
            setCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
            await reverseGeocode(e.latlng.lat, e.latlng.lng);
          });
          
          window.currentMap = map;
          window.currentMarker = marker;
          setMapInitialized(true);
          
          setTimeout(() => {
            map.invalidateSize();
          }, 200);
          
        } catch (error) {
          console.error('Map initialization error:', error);
          showMessage('Map failed to initialize. Please use manual address entry.', 'warning');
          setUseSimpleMap(true);
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
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

  // --- Get Current Location ---
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showMessage('Geolocation is not supported. Please enter address manually.', 'warning');
      setUseSimpleMap(true);
      return;
    }
    
    showMessage('📍 Getting your current location...', 'info');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setCoordinates(newCoords);
        
        if (window.currentMap && window.currentMarker) {
          window.currentMap.setView([latitude, longitude], 16);
          window.currentMarker.setLatLng([latitude, longitude]);
        }
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data?.display_name) {
            if (window.updateLocationDisplay) {
              window.updateLocationDisplay(data.display_name);
            }
            showMessage('✅ Current location detected! Drag pin to adjust if needed.', 'success');
          }
        } catch (error) {
          showMessage('📍 Location captured! You can drag the pin to adjust.', 'success');
        }
      },
      (error) => {
        let errorMessage = 'Unable to get your location. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Request timed out. Please try again.';
            break;
          default:
            errorMessage += 'Please enter address manually.';
        }
        showMessage(errorMessage, 'error');
        setUseSimpleMap(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // --- Theme Colors ---
  const theme = useMemo(() => {
    const lightTheme = {
      primary: "#2A6B5F",
      primaryDark: "#1E5A4F",
      secondary: "#D4A84A",
      accent: "#D47A4A",
      background: "#F0F2F0",
      cardBg: "#FFFFFF",
      surface: "#F5F7F5",
      text: "#1A2A2E",
      textLight: "#3A4A4F",
      textMuted: "#5A6A6E",
      border: "#E0E4E0",
      gradient1: "linear-gradient(135deg, #2A6B5F 0%, #1E5A4F 100%)",
      gradient2: "linear-gradient(135deg, #D4A84A 0%, #D47A4A 100%)",
      gradient3: "linear-gradient(135deg, #1E5A4F 0%, #2A6B5F 100%)"
    };
    
    const darkTheme = {
      primary: "#4A9A8F",
      primaryDark: "#3A7A6F",
      secondary: "#E4C86A",
      accent: "#E49A5A",
      background: "#1a1a2e",
      cardBg: "#16213e",
      surface: "#0f3460",
      text: "#e8e8e8",
      textLight: "#c0c0c0",
      textMuted: "#a0a0a0",
      border: "#2a3a5e",
      gradient1: "linear-gradient(135deg, #4A9A8F 0%, #3A7A6F 100%)",
      gradient2: "linear-gradient(135deg, #E4C86A 0%, #E49A5A 100%)",
      gradient3: "linear-gradient(135deg, #3A7A6F 0%, #4A9A8F 100%)"
    };
    
    return darkMode ? darkTheme : lightTheme;
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    showMessage(newMode ? '🌙 Dark mode activated' : '☀️ Light mode activated', 'success');
  };

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // --- Button Component ---
  const Button = ({ children, onClick, primary = true, small = false }) => (
    <button onClick={onClick} style={{
      background: primary ? theme.gradient1 : 'transparent',
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
  // PAYMENT MODAL - COMPLETE WORKING CODE
  // ============================================
  const PaymentModal = () => {
    // Local state (prevents flicker)
    const [localPhone, setLocalPhone] = useState('');
    const [localAmount, setLocalAmount] = useState('100');
    const [localProcessing, setLocalProcessing] = useState(false);
    const [localPhoneError, setLocalPhoneError] = useState('');
    const [localAmountError, setLocalAmountError] = useState('');
    
    if (!showPaymentModal) return null;
    
    // Phone number normalization - handles ALL formats (NO unnecessary escapes)
const normalizeMpesaPhone = (phone) => {
  if (!phone) return '';
  
  // Remove all spaces, dashes, parentheses, dots (no unnecessary escapes)
  let cleaned = phone.toString().replace(/[\s\-()]/g, '');
  
  // Remove leading '+'
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  
  // Remove leading '00' (international dialing code)
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }
  
  // Format: 0712345678 (10 digits starting with 0)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '254' + cleaned.slice(1);
  }
  // Format: 712345678 (9 digits starting with 7)
  else if (cleaned.startsWith('7') && cleaned.length === 9) {
    cleaned = '254' + cleaned;
  }
  // Format: 254712345678 (already correct)
  else if (cleaned.startsWith('254') && cleaned.length === 12) {
    // Already correct
  }
  
  // Final validation: must be 254 followed by 1 or 7, then 8 digits
  if (!/^254[17]\d{8}$/.test(cleaned)) {
    return null;
  }
  
  return cleaned;
};
    const formatDisplayPhone = (phone) => {
      if (!phone) return '';
      const normalized = normalizeMpesaPhone(phone);
      if (normalized && normalized.length === 12) {
        const local = '0' + normalized.slice(3);
        return local.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
      }
      return phone;
    };
    
    const validatePhoneNumber = (phone) => {
      if (!phone || phone.trim() === '') return 'Phone number is required';
      const normalized = normalizeMpesaPhone(phone);
      if (!normalized) return 'Enter a valid Kenyan phone number (e.g., 0712345678)';
      if (!/^254[17]\d{8}$/.test(normalized)) return 'Must be a Safaricom M-PESA registered number';
      return null;
    };
    
    const validateAmount = (amount) => {
      const amountValue = Number(amount);
      if (!amount || amount === '') return 'Amount is required';
      if (isNaN(amountValue)) return 'Enter a valid number';
      if (amountValue < 100) return 'Minimum amount is KES 100';
      if (amountValue > 150000) return 'Maximum amount is KES 150,000';
      return null;
    };
    
    const handlePhoneChange = (e) => {
      setLocalPhone(e.target.value);
      setLocalPhoneError('');
    };
    
    const handlePhoneBlur = () => {
      const error = validatePhoneNumber(localPhone);
      setLocalPhoneError(error || '');
      if (!error && localPhone) {
        const formatted = formatDisplayPhone(localPhone);
        if (formatted !== localPhone) setLocalPhone(formatted);
      }
    };
    
    const handleAmountChange = (e) => {
      const value = e.target.value;
      if (value === '' || /^\d+$/.test(value)) {
        setLocalAmount(value);
        setLocalAmountError('');
      }
    };
    
    const handleAmountBlur = () => {
      const error = validateAmount(localAmount);
      setLocalAmountError(error || '');
    };
    
    const presetAmounts = [100, 200, 500, 1000];
    
    const pollPaymentStatus = (checkoutRequestID) => {
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
            const amountValue = Number(localAmount);
            setBalance(prev => prev + amountValue);
            showMessage(`💰 Payment successful! KES ${amountValue} added. New balance: KES ${(balance + amountValue).toFixed(2)}`, 'success');
            setLocalProcessing(false);
            setShowPaymentModal(false);
            setLocalPhone('');
            setLocalAmount('100');
            setLocalPhoneError('');
            setLocalAmountError('');
          } else if (data.ResultCode !== '1037') {
            clearInterval(interval);
            showMessage('Payment failed or was cancelled. Please try again.', 'error');
            setLocalProcessing(false);
          }
        } catch (error) {
          console.error('Status check error:', error);
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          if (localProcessing) {
            showMessage('Payment timeout. Please check your M-PESA messages.', 'warning');
            setLocalProcessing(false);
          }
        }
      }, 2000);
    };
    
    const initiatePayment = async () => {
      const phoneError = validatePhoneNumber(localPhone);
      if (phoneError) {
        setLocalPhoneError(phoneError);
        showMessage(phoneError, 'error');
        return;
      }
      
      const amountError = validateAmount(localAmount);
      if (amountError) {
        setLocalAmountError(amountError);
        showMessage(amountError, 'error');
        return;
      }
      
      const formattedPhone = normalizeMpesaPhone(localPhone);
      const amountValue = Number(localAmount);
      
      setLocalProcessing(true);
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
          showMessage(`✅ STK Push sent to ${formatDisplayPhone(localPhone)}! Enter your M-PESA PIN.`, 'success');
          pollPaymentStatus(data.checkoutRequestID);
        } else {
          showMessage(data.message || 'Payment initiation failed. Please try again.', 'error');
          setLocalProcessing(false);
        }
      } catch (error) {
        console.error('Payment error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
        setLocalProcessing(false);
      }
    };
    
    const simulatePayment = () => {
      const phoneError = validatePhoneNumber(localPhone);
      if (phoneError) {
        setLocalPhoneError(phoneError);
        showMessage(phoneError, 'error');
        return;
      }
      
      const amountError = validateAmount(localAmount);
      if (amountError) {
        setLocalAmountError(amountError);
        showMessage(amountError, 'error');
        return;
      }
      
      setLocalProcessing(true);
      showMessage('Simulating M-PESA STK Push...', 'info');
      
      setTimeout(() => {
        const amountValue = Number(localAmount);
        setBalance(prev => prev + amountValue);
        showMessage(`✅ Demo Payment successful! Added KES ${localAmount}. New balance: KES ${(balance + amountValue).toFixed(2)}`, 'success');
        setLocalProcessing(false);
        setShowPaymentModal(false);
        setLocalPhone('');
        setLocalAmount('100');
        setLocalPhoneError('');
        setLocalAmountError('');
      }, 2000);
    };
    
    const resetModal = () => {
      setShowPaymentModal(false);
      setLocalPhone('');
      setLocalAmount('100');
      setLocalPhoneError('');
      setLocalAmountError('');
    };
    
    return (
      <div style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 2000, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        padding: '1rem' 
      }} onClick={resetModal}>
        <div style={{ 
          backgroundColor: darkMode ? '#1e1e2e' : '#ffffff', 
          borderRadius: '28px', maxWidth: '460px', width: '100%', 
          padding: '1.75rem', position: 'relative',
          animation: 'fadeInUp 0.3s ease',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
        }} onClick={e => e.stopPropagation()}>
          
          <button onClick={resetModal} style={{ 
            position: 'absolute', top: '1rem', right: '1rem', 
            background: 'none', border: 'none', fontSize: '1.25rem', 
            cursor: 'pointer', color: darkMode ? '#a0a0a0' : '#888'
          }}>✕</button>
          
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>💰</div>
            <h2 style={{ fontSize: '1.5rem', margin: 0, color: darkMode ? '#e8e8e8' : '#1A2A2E', fontWeight: '700' }}>M-PESA Payment</h2>
            <p style={{ color: darkMode ? '#a0a0a0' : '#5A6A6E', fontSize: '0.85rem' }}>Instant STK Push to your phone</p>
          </div>
          
          {/* Amount Section */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#1A2A2E' }}>Amount (KES)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {presetAmounts.map(amt => (
                <button key={amt} type="button" onClick={() => { setLocalAmount(String(amt)); setLocalAmountError(''); }} 
                  style={{ flex: '1', minWidth: '70px', padding: '0.6rem 0.5rem',
                    backgroundColor: Number(localAmount) === amt ? '#2A6B5F' : (darkMode ? '#2a2a3e' : '#f0f0f0'),
                    color: Number(localAmount) === amt ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                    border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '500' }}>
                  KES {amt}
                </button>
              ))}
            </div>
            <input type="text" inputMode="numeric" value={localAmount} onChange={handleAmountChange} onBlur={handleAmountBlur}
              placeholder="Enter amount"
              style={{ width: '100%', padding: '0.85rem', border: `1px solid ${localAmountError ? '#E76F51' : (darkMode ? '#3a3a4e' : '#e0e0e0')}`, 
                borderRadius: '12px', background: darkMode ? '#2a2a3e' : '#f8f9fa', color: darkMode ? '#e8e8e8' : '#1A2A2E', fontSize: '1rem' }} />
            {localAmountError && <p style={{ color: '#E76F51', fontSize: '0.7rem', marginTop: '0.25rem' }}>{localAmountError}</p>}
          </div>
          
          {/* Phone Number Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#1A2A2E' }}>M-PESA Phone Number</label>
            <input type="tel" placeholder="0712345678 or +254712345678" value={localPhone} onChange={handlePhoneChange} onBlur={handlePhoneBlur} autoFocus
              style={{ width: '100%', padding: '0.85rem', border: `1px solid ${localPhoneError ? '#E76F51' : (darkMode ? '#3a3a4e' : '#e0e0e0')}`, 
                borderRadius: '12px', background: darkMode ? '#2a2a3e' : '#f8f9fa', color: darkMode ? '#e8e8e8' : '#1A2A2E', fontSize: '1rem' }} />
            {localPhoneError ? (
              <p style={{ color: '#E76F51', fontSize: '0.7rem', marginTop: '0.25rem' }}>{localPhoneError}</p>
            ) : (
              <p style={{ fontSize: '0.7rem', color: darkMode ? '#a0a0a0' : '#5A6A6E', marginTop: '0.25rem' }}>
                Accepted: 0712345678 | +254712345678 | 254712345678
              </p>
            )}
          </div>
          
          <button type="button" onClick={initiatePayment} disabled={localProcessing}
            style={{ width: '100%', padding: '0.9rem', background: 'linear-gradient(135deg, #2A6B5F 0%, #1E5A4F 100%)',
              color: 'white', border: 'none', borderRadius: '50px', fontSize: '1rem', fontWeight: '600',
              cursor: localProcessing ? 'not-allowed' : 'pointer', opacity: localProcessing ? 0.6 : 1, marginBottom: '0.75rem' }}>
            {localProcessing ? 'Sending STK Push...' : 'Pay with M-PESA →'}
          </button>
          
          <button type="button" onClick={simulatePayment} disabled={localProcessing}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent',
              color: darkMode ? '#a0a0a0' : '#6c757d', border: `1px solid ${darkMode ? '#3a3a4e' : '#dee2e6'}`,
              borderRadius: '50px', fontSize: '0.85rem', cursor: localProcessing ? 'not-allowed' : 'pointer' }}>
            Demo Mode (Test Payment)
          </button>
        </div>
      </div>
    );
  };

  // ============================================
  // SIGNUP MODAL
  // ============================================
  const SignUpModal = () => {
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
    
    useEffect(() => {
      window.updateLocationDisplay = (address) => {
        setLocalLocation(address);
        setSearchQuery(address);
        setLocalLocationStatus('✅ Location selected from map');
      };
      return () => { delete window.updateLocationDisplay; };
    }, []);
    
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
    
    const sendEmailNotification = (formDataToSend) => {
      const subject = `NEW KIT REQUEST: ${formDataToSend.name} - ${formDataToSend.kitName}`;
      const body = `NEW KIT REQUEST FROM OKOA GAS WEBSITE

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
Deposit Required (10%): KES ${(formDataToSend.fullPrice * 0.1).toFixed(0)}
Full Price: KES ${formDataToSend.fullPrice}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DELIVERY LOCATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formDataToSend.location}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPECIAL INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formDataToSend.instructions || 'None provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSPORTATION COST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[TO BE CALCULATED BY ADMIN]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request Date: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      
      const mailtoLink = `mailto:ruttokitallam@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const depositAmount = (formDataToSend.fullPrice * 0.1).toFixed(0);
      const customerSubject = `OKOA GAS: Kit Request Confirmation - ${formDataToSend.kitName}`;
      const customerBody = `Dear ${formDataToSend.name},

Thank you for requesting a kit from OKOA GAS!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kit: ${formDataToSend.kitName}
Deposit Required (10%): KES ${depositAmount}
Delivery Location: ${formDataToSend.location}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT HAPPENS NEXT?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. We will calculate transportation cost based on your location
2. We will contact you within 24 hours
3. After deposit payment, we will schedule delivery

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Need help? Contact us:
📞 +254717052939
✉️ hello@okoagas.com

Thank you for choosing OKOA GAS!`;
      
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
        fullPrice: localSelectedKit.fullPrice,
        location: localLocation,
        instructions: localInstructions
      };
      
      sendEmailNotification(emailData);
      setSelectedKit(localSelectedKit);
      
      setTimeout(() => {
        showMessage(`✅ Thank you ${localName}! Your request has been sent. Our team will contact you within 24 hours.`, 'success');
        setLocalSubmitting(false);
        setShowSignUpModal(false);
      }, 1500);
    };
    
    return (
      <div style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        padding: screenSize.isMobile ? '0.5rem' : '1rem', overflowY: 'auto'
      }} onClick={() => setShowSignUpModal(false)}>
        <div style={{ 
          background: theme.cardBg, borderRadius: '24px', 
          maxWidth: screenSize.isMobile ? '100%' : '1000px', width: '100%', 
          maxHeight: '90vh', overflowY: 'auto', padding: screenSize.isMobile ? '1rem' : '1.5rem', 
          position: 'relative', animation: 'fadeInUp 0.3s ease'
        }} onClick={e => e.stopPropagation()}>
          
          <button onClick={() => setShowSignUpModal(false)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', 
            background: 'none', border: 'none', borderRadius: '50%', width: '30px', height: '30px', 
            fontSize: '1.2rem', cursor: 'pointer', color: theme.text }}>✕</button>
          
          <h2 style={{ fontSize: screenSize.isMobile ? '1.3rem' : '1.5rem', marginBottom: '0.5rem', color: theme.text, fontWeight: '700' }}>Get Your Kit 🎁</h2>
          <p style={{ fontSize: '0.85rem', color: theme.textLight, marginBottom: '1rem' }}>Pay only 10% deposit. Transportation cost calculated based on your location.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
            {kitOptions.map(kit => (
              <div key={kit.id} onClick={() => { setLocalSelectedKitId(kit.id); setSelectedKit(kit); showMessage(`${kit.fullName} selected! 10% deposit required.`, 'success'); }} 
                style={{ border: `2px solid ${localSelectedKitId === kit.id ? theme.primary : theme.border}`, borderRadius: '12px', 
                  padding: '0.75rem', cursor: 'pointer', background: localSelectedKitId === kit.id ? `${theme.primary}10` : theme.cardBg }}>
                <SafeImage src={kit.id === '6kg' ? images.cylinder6kg : (kit.id === '13kg' ? images.cylinder13kg : images.commercialKit)} alt={kit.fullName} style={{ width: '100%', height: '80px', objectFit: 'contain' }} />
                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center', color: theme.text }}>{kit.fullName} ({kit.size})</div>
                <div style={{ fontSize: '0.7rem', color: theme.textMuted, textAlign: 'center' }}>{kit.cooker}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: theme.primary, textAlign: 'center' }}>10% Deposit</div>
                <div style={{ fontSize: '0.65rem', color: theme.textMuted, textAlign: 'center' }}>Full: KES {kit.fullPrice.toLocaleString()}</div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleLocalSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: theme.text }}>Full Name *</label>
                  <input type="text" value={localName} onChange={e => setLocalName(e.target.value)} 
                    placeholder="e.g., John Mwangi" autoComplete="off" autoFocus
                    style={{ width: '100%', padding: '0.75rem', border: `1px solid ${localErrors.name ? theme.primary : theme.border}`, 
                      borderRadius: '8px', fontSize: '1rem', background: theme.surface, color: theme.text }} />
                  {localErrors.name && <p style={{ color: '#E76F51', fontSize: '0.8rem', marginTop: '0.25rem' }}>{localErrors.name}</p>}
                </div>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: theme.text }}>Phone Number *</label>
                  <input type="tel" value={localPhone} onChange={e => setLocalPhone(e.target.value)} 
                    placeholder="0712345678" autoComplete="off"
                    style={{ width: '100%', padding: '0.75rem', border: `1px solid ${localErrors.phone ? theme.primary : theme.border}`, 
                      borderRadius: '8px', fontSize: '1rem', background: theme.surface, color: theme.text }} />
                  {localErrors.phone && <p style={{ color: '#E76F51', fontSize: '0.8rem', marginTop: '0.25rem' }}>{localErrors.phone}</p>}
                </div>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: theme.text }}>Email Address *</label>
                  <input type="email" value={localEmail} onChange={e => setLocalEmail(e.target.value)} 
                    placeholder="john@example.com" autoComplete="off"
                    style={{ width: '100%', padding: '0.75rem', border: `1px solid ${localErrors.email ? theme.primary : theme.border}`, 
                      borderRadius: '8px', fontSize: '1rem', background: theme.surface, color: theme.text }} />
                  {localErrors.email && <p style={{ color: '#E76F51', fontSize: '0.8rem', marginTop: '0.25rem' }}>{localErrors.email}</p>}
                </div>
              </div>
              
              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: theme.text }}>📍 Delivery Location *</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input type="text" value={searchQuery} onChange={handleLocationChange}
                        placeholder="e.g., Nairobi, Westlands, Kenyatta Ave..." autoComplete="off"
                        style={{ flex: 2, padding: '0.75rem', border: `1px solid ${localErrors.location ? theme.primary : theme.border}`, 
                          borderRadius: '8px', fontSize: '1rem', background: theme.surface, color: theme.text }} />
                      <button type="button" onClick={searchOnMap} 
                        style={{ background: theme.gradient1, color: 'white', border: 'none', 
                          borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', fontWeight: '500' }}>🔍 Search</button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <button type="button" onClick={getCurrentLocation} 
                        style={{ flex: 1, background: theme.gradient2, color: darkMode ? '#1a1a1a' : '#fff', 
                          border: 'none', borderRadius: '8px', padding: '0.7rem', cursor: 'pointer' }}>📍 My Location</button>
                      <button type="button" onClick={() => setUseSimpleMap(!useSimpleMap)} 
                        style={{ flex: 1, background: 'transparent', color: theme.primary, 
                          border: `1px solid ${theme.primary}`, borderRadius: '8px', padding: '0.7rem', cursor: 'pointer' }}>
                        {useSimpleMap ? '🗺️ Back to Map' : '✏️ Enter Manually'}
                      </button>
                    </div>
                    
                    {showSuggestions && suggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: theme.cardBg,
                        borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: '200px', 
                        overflowY: 'auto', border: `1px solid ${theme.primary}` }}>
                        {suggestions.map((suggestion, idx) => (
                          <div key={idx} onClick={() => selectLocation(suggestion)} 
                            style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: `1px solid ${theme.border}`, 
                              fontSize: '0.85rem', color: theme.text }}
                            onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#333' : '#f5f5f5'}
                            onMouseLeave={e => e.currentTarget.style.background = theme.cardBg}>
                            📍 {suggestion.display_name.substring(0, 80)}...
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {localLocationStatus && <p style={{ color: theme.primary, fontSize: '0.8rem', marginTop: '0.25rem' }}>{localLocationStatus}</p>}
                  {localErrors.location && <p style={{ color: '#E76F51', fontSize: '0.8rem', marginTop: '0.25rem' }}>{localErrors.location}</p>}
                </div>
                
                <div ref={mapRef} style={{ height: '380px', width: '100%', borderRadius: '16px', 
                  border: `2px solid ${localErrors.location ? '#E76F51' : '#2A6B5F'}`, marginBottom: '0.75rem', 
                  backgroundColor: '#ffffff', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                  {!mapLoaded && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', 
                      flexDirection: 'column', background: '#ffffff' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
                      <p style={{ color: '#333' }}>Loading map...</p>
                    </div>
                  )}
                </div>
                
                <div style={{ fontSize: '0.7rem', color: theme.textMuted, textAlign: 'center', marginTop: '0.25rem' }}>
                  💡 Tip: Drag the pin or click anywhere on the map to set your exact delivery location
                </div>
              </div>
            </div>
            
            <textarea value={localInstructions} onChange={e => setLocalInstructions(e.target.value)} 
              placeholder="Special instructions (gate code, landmark, preferred delivery time...)" rows="2"
              style={{ width: '100%', padding: '0.6rem', border: `1px solid ${theme.border}`, borderRadius: '8px', 
                marginTop: '0.75rem', fontSize: '0.9rem', resize: 'vertical', background: theme.surface, color: theme.text }} />
            
            {useSimpleMap && (
              <div style={{ marginTop: '0.75rem' }}>
                <input type="text" placeholder="Enter your full delivery address manually" value={localLocation} 
                  onChange={e => setLocalLocation(e.target.value)} 
                  style={{ width: '100%', padding: '0.6rem', border: `1px solid ${theme.border}`, 
                    borderRadius: '8px', background: theme.surface, color: theme.text }} />
              </div>
            )}
            
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowSignUpModal(false)} 
                style={{ background: 'transparent', color: theme.primary, border: `2px solid ${theme.primary}`, 
                  padding: '0.6rem 1.2rem', borderRadius: '50px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={localSubmitting} 
                style={{ background: theme.gradient1, color: 'white', border: 'none', padding: '0.6rem 1.2rem', 
                  borderRadius: '50px', fontWeight: '600', cursor: localSubmitting ? 'not-allowed' : 'pointer', 
                  opacity: localSubmitting ? 0.7 : 1 }}>{localSubmitting ? 'Sending...' : 'Request Kit →'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: theme.background, minHeight: '100vh', transition: 'background 0.3s ease' }}>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        .hero-animate { animation: fadeInUp 0.8s ease forwards; opacity: 0; }
        .feature-card { transition: all 0.3s ease; }
        .feature-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }
        
        input:focus, textarea:focus { outline: none; border-color: #2A6B5F !important; box-shadow: 0 0 0 3px rgba(42,107,95,0.1); }
        
        .leaflet-container { z-index: 1; }
      `}</style>
      
      {/* Notification Banner - Top Right Corner */}
      {showNotification && (
        <div style={{
          position: 'fixed',
          top: screenSize.isMobile ? '70px' : '80px',
          right: screenSize.isMobile ? '10px' : '20px',
          left: screenSize.isMobile ? '10px' : 'auto',
          backgroundColor: showNotification.type === 'error' ? '#E76F51' : (showNotification.type === 'warning' ? '#D47A4A' : '#2A6B5F'),
          color: 'white',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          animation: 'slideIn 0.3s ease',
          textAlign: 'center',
          zIndex: 10000,
          fontSize: '0.9rem',
          fontWeight: '500',
          maxWidth: screenSize.isMobile ? 'calc(100% - 20px)' : '350px'
        }}>
          {showNotification.message}
        </div>
      )}
      
      <PaymentModal />
      <SignUpModal key={modalKey} />
      
      {/* Header */}
      <header style={{ 
        background: darkMode ? '#1a1a2e' : 'white', 
        padding: screenSize.isMobile ? '0.75rem 1rem' : '1rem 2rem', 
        position: 'sticky', top: 0, zIndex: 100, 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'background 0.3s ease'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', 
          alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => scrollTo('home')}>
            <span style={{ fontSize: screenSize.isMobile ? '1.8rem' : '2rem', animation: 'pulse 2s ease-in-out infinite' }}>🔥</span>
            <span style={{ fontWeight: 'bold', fontSize: screenSize.isMobile ? '1.2rem' : '1.5rem', color: darkMode ? '#e8e8e8' : '#1A2A2E' }}>OKOA GAS</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={toggleDarkMode} style={{
              background: darkMode ? '#2a2a3e' : '#e8e8e8',
              border: 'none', borderRadius: '50%', width: '36px', height: '36px',
              cursor: 'pointer', fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: darkMode ? '#f0c674' : '#5a6a6e',
              transition: 'all 0.3s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              {darkMode ? '☀️' : '🌙'}
            </button>
            {!screenSize.isMobile && (
              <>
                <button onClick={() => scrollTo('home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: darkMode ? '#e8e8e8' : '#1A2A2E' }}>Home</button>                
                <button onClick={() => scrollTo('safety')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: darkMode ? '#e8e8e8' : '#1A2A2E' }}>Safety</button>
              </>
            )}
            <Button onClick={openSignUpModal} small>Get Your Kit</Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <div id="home" style={{ maxWidth: '1200px', margin: '0 auto', padding: screenSize.isMobile ? '2rem 1rem' : '4rem 2rem', textAlign: 'center' }}>
        <h1 style={{ background: theme.gradient1, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', 
          marginBottom: '0.5rem', fontSize: screenSize.isMobile ? '2rem' : '3rem', fontWeight: '800' }}>Clean Cooking for Every Home.</h1>
        <p style={{ fontSize: screenSize.isMobile ? '1.2rem' : '1.5rem', color: theme.primary, margin: '0.5rem 0', fontWeight: '500' }}>Pay as you go from KES 1.</p>
        <p style={{ maxWidth: '500px', margin: '1rem auto', color: theme.textLight, fontSize: '1rem' }}>No cylinders to buy. No deposit. Just clean LPG delivered to your stove.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button onClick={openSignUpModal}>Get Your Kit →</Button>
          <Button onClick={() => setShowPaymentModal(true)} primary={false}>Top Up M-PESA</Button>
        </div>
        
        <div style={{ marginTop: '3rem' }}>
          <div style={{ backgroundImage: `url(${images.heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center',
            borderRadius: '24px', overflow: 'hidden', position: 'relative', minHeight: '300px',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(135deg, rgba(42,107,95,0.85), rgba(30,90,79,0.85))', zIndex: 1 }} />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '3rem 2rem' }}>
              <h2 style={{ color: 'white', marginBottom: '1rem', fontWeight: '700' }}>Smart Delivery</h2>
              <p style={{ color: '#f0f0f0', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Fast, reliable, and cashless payment options.</p>
              <div style={{ marginTop: '1.5rem' }}><Button onClick={openSignUpModal}>Order Now →</Button></div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
          {[
            { title: 'Fast Refill', text: 'Gas delivered within hours for all standard cylinder sizes.' },
            { title: 'Complete Kits', text: 'Cylinder, regulator, hose, and burner included.' },
            { title: 'Pay-as-you-go', text: 'M-PESA top-up and smart meter support.' }
          ].map((item, index) => (
            <div key={index} className="feature-card" style={{ padding: '1.25rem', borderRadius: '20px', background: theme.cardBg, boxShadow: `0 2px 10px ${darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'}` }}>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: theme.primary, marginBottom: '0.75rem' }}>{item.title}</div>
              <p style={{ margin: 0, color: theme.textLight, lineHeight: 1.7, fontSize: '0.9rem' }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Gallery Section */}
      <div style={{ background: theme.surface, padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: theme.text, fontWeight: '700', fontSize: screenSize.isMobile ? '1.75rem' : '2.5rem' }}>Our Services in Action</h2>
            <p style={{ maxWidth: '680px', margin: '1rem auto 0', color: theme.textLight, fontSize: '1rem' }}>See how OKOA GAS delivers clean cooking solutions.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="feature-card" style={{ borderRadius: '20px', overflow: 'hidden', background: theme.cardBg }}>
              <SafeImage src={images.quickDelivery} alt="Quick Delivery" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}><h3 style={{ color: theme.primary, fontWeight: '600' }}>Quick Delivery</h3><p style={{ color: theme.textLight }}>Stove-ready LPG cylinders delivered within hours.</p></div>
            </div>
            <div className="feature-card" style={{ borderRadius: '20px', overflow: 'hidden', background: theme.cardBg }}>
              <SafeImage src={images.smartTracking} alt="Smart Tracking" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}><h3 style={{ color: theme.primary, fontWeight: '600' }}>Smart Tracking</h3><p style={{ color: theme.textLight }}>Monitor your gas usage in real-time.</p></div>
            </div>
            <div className="feature-card" style={{ borderRadius: '20px', overflow: 'hidden', background: theme.cardBg }}>
              <SafeImage src={images.securePayment} alt="Secure Payment" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}><h3 style={{ color: theme.primary, fontWeight: '600' }}>Secure Payment</h3><p style={{ color: theme.textLight }}>Pay instantly with M-PESA.</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Showcase */}
      <div style={{ background: theme.background, padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ color: theme.secondary, fontWeight: 700, marginBottom: '0.5rem' }}>Quality Products</div>
            <h2 style={{ color: theme.text, fontWeight: '700', fontSize: screenSize.isMobile ? '1.75rem' : '2.5rem' }}>Our Cylinder Kits</h2>
            <p style={{ maxWidth: '680px', margin: '1rem auto 0', color: theme.textLight, fontSize: '1rem' }}>Choose the perfect kit. Pay only 10% deposit.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {kitOptions.map(kit => (
              <div key={kit.id} className="feature-card" style={{ padding: '1.5rem', borderRadius: '24px', background: theme.cardBg, textAlign: 'center' }}>
                <SafeImage src={kit.id === '6kg' ? images.cylinder6kg : (kit.id === '13kg' ? images.cylinder13kg : images.commercialKit)} alt={kit.fullName} style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '1rem' }} />
                <h3 style={{ margin: '0.5rem 0', color: theme.primary, fontWeight: '600', fontSize: '1.2rem' }}>{kit.fullName}</h3>
                <p style={{ margin: 0, color: theme.textLight, lineHeight: 1.7, fontSize: '0.9rem' }}>{kit.size} with {kit.cooker}</p>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', color: theme.primary }}>10% Deposit</div>
                <div style={{ fontSize: '0.8rem', color: theme.textMuted }}>Full: KES {kit.fullPrice.toLocaleString()}</div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: theme.textLight }}>{kit.monthly}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 10% Upfront Section */}
      <div id="promise" style={{ background: theme.surface, padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: theme.text, fontWeight: '700', fontSize: screenSize.isMobile ? '1.75rem' : '2.5rem' }}>10% Upfront - Pay as You Go</h2>
          <p style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 1.5rem auto', color: theme.textLight, fontSize: '1rem' }}>Start with only 10% deposit, then pay the balance in installments via M-PESA.</p>
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem' }}>
            {[{ icon: '💰', name: 'Low Deposit', desc: 'Only 10% upfront to get started' }, 
              { icon: '📱', name: 'M-PESA Payments', desc: 'Pay balance via M-PESA' }, 
              { icon: '🚚', name: 'Transport Calculated', desc: 'Cost based on your location' }].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '1rem', background: theme.cardBg, borderRadius: '16px' }}>
                <div style={{ fontSize: '2rem' }}>{item.icon}</div>
                <h3 style={{ color: theme.primary, fontWeight: '600', fontSize: '1.1rem', marginTop: '0.5rem' }}>{item.name}</h3>
                <p style={{ color: theme.textLight, fontSize: '0.85rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Balance Display */}
      <div style={{ maxWidth: '1200px', margin: '1.5rem auto', padding: '0 1rem' }}>
        <div style={{ background: theme.gradient1, borderRadius: '20px', padding: '1.5rem', color: 'white', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Your Current Balance</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>KES {balance.toFixed(2)}</div>
          <button onClick={() => setShowPaymentModal(true)} style={{ marginTop: '0.5rem', background: 'white', color: '#2A6B5F', border: 'none', padding: '0.5rem 1rem', borderRadius: '50px', cursor: 'pointer', fontWeight: '600' }}>Add Money via M-PESA</button>
        </div>
      </div>
      
      {/* Smart Meter */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
          <div><h2 style={{ color: theme.text, fontWeight: '700', fontSize: screenSize.isMobile ? '1.3rem' : '1.8rem' }}>Monitor & Control</h2>
          <p style={{ color: theme.textLight, fontSize: '1rem' }}>See live gas level, top up via M-PESA.</p>
          <Button onClick={() => setShowPaymentModal(true)}>Top Up M-PESA</Button></div>
          <div style={{ background: theme.gradient3, borderRadius: '16px', padding: '1rem', color: 'white', textAlign: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <SafeImage src={images.meter} alt="Smart Meter" style={{ width: '80%', marginBottom: '1rem' }} />
            <div style={{ fontWeight: '500' }}>Gas Level: {gasLevel}%</div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', margin: '0.5rem 0' }}>
              <div style={{ width: `${gasLevel}%`, height: '100%', background: theme.secondary, borderRadius: '4px' }}></div>
            </div>
            <div style={{ fontWeight: '500' }}>Balance: KES {balance.toFixed(2)}</div>
            <button onClick={() => setShowPaymentModal(true)} style={{ marginTop: '0.5rem', background: theme.secondary, color: darkMode ? '#1a1a2e' : '#1A2A2E', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Add Money</button>
          </div>
        </div>
      </div>
      
      {/* Safety Section */}
      <div id="safety" style={{ background: '#1a2c38', padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', color: 'white', fontWeight: '700', fontSize: screenSize.isMobile ? '1.75rem' : '2.5rem' }}>Safety First, Always.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="feature-card" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1rem' }}>
              <h3 style={{ color: '#D4A84A', fontWeight: '600', fontSize: '1.2rem' }}>Automatic Leak Detection</h3>
              <p style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>High-precision sensors monitor air continuously.</p>
            </div>
            <div className="feature-card" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1rem' }}>
              <h3 style={{ color: '#D4A84A', fontWeight: '600', fontSize: '1.2rem' }}>Emergency Valve Shutoff</h3>
              <p style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>Immediate mechanical shutoff when leak detected.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* How It Works */}
      <div style={{ background: theme.surface, padding: screenSize.isMobile ? '2rem 1rem' : '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: theme.text, fontWeight: '700', fontSize: screenSize.isMobile ? '1.75rem' : '2.5rem' }}>How OKOA GAS works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            {[{ image: images.stepOrder, title: 'Order your kit', text: 'Choose your kit and pay 10% deposit.' },
              { image: images.stepInstallation, title: 'Delivery & transport', text: 'We calculate transport cost and deliver.' },
              { image: images.stepTopup, title: 'Pay balance', text: 'Use M-PESA to pay remaining balance.' }].map((item, index) => (
              <div key={index} className="feature-card" style={{ padding: '1.5rem', borderRadius: '24px', background: theme.cardBg }}>
                <SafeImage src={item.image} alt={item.title} style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '1rem' }} />
                <h3 style={{ margin: '0.5rem 0', color: theme.text, fontWeight: '600', fontSize: '1.2rem' }}>{item.title}</h3>
                <p style={{ color: theme.textLight, fontSize: '0.9rem' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* M-PESA Instructions */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ background: darkMode ? '#2a2a2a' : '#f0fdf4', borderRadius: '16px', padding: '1rem', borderLeft: `4px solid ${theme.primary}` }}>
          <h3 style={{ color: theme.primary, marginBottom: '0.5rem', fontWeight: '600', fontSize: '1.1rem' }}>💰 How to Pay via M-PESA</h3>
          <ol style={{ marginLeft: '1rem', color: theme.textLight, fontSize: '0.9rem' }}>
            <li>Click "Top Up M-PESA" button</li>
            <li>Enter your M-PESA registered phone number</li>
            <li>Enter amount (minimum KES 100)</li>
            <li>You'll receive an STK Push on your phone</li>
            <li>Enter your M-PESA PIN to complete payment</li>
            <li>Gas balance updates instantly!</li>
          </ol>
        </div>
      </div>
      
      {/* ORIGINAL FOOTER - RETAINED */}
      <footer style={{ background: '#1a2c38', color: '#94a3b8', padding: '3rem 2rem 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: screenSize.isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ color: 'white', marginBottom: '1rem', fontWeight: '600' }}>OKOA GAS</h3>
            <p>Clean cooking for every home. 10% upfront, pay as you go.</p>
          </div>
          <div>
            <h3 style={{ color: 'white', marginBottom: '1rem', fontWeight: '600' }}>Quick Links</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><button onClick={() => scrollTo('home')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Home</button></li>
              <li><button onClick={() => scrollTo('promise')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>10% Upfront</button></li>
              <li><button onClick={() => scrollTo('safety')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Safety</button></li>
              <li><button onClick={openSignUpModal} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Get Your Kit</button></li>
            </ul>
          </div>
          <div>
            <h3 style={{ color: 'white', marginBottom: '1rem', fontWeight: '600' }}>Contact</h3>
            <p>📞 +254717052939</p>
            <p>✉️ hello@okoagas.com</p>
            <p>📍 Nairobi, Kenya</p>
          </div>
          <div>
            <h3 style={{ color: 'white', marginBottom: '1rem', fontWeight: '600' }}>Follow Us</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem', cursor: 'pointer' }}>📘</span>
              <span style={{ fontSize: '1.5rem', cursor: 'pointer' }}>🐦</span>
              <span style={{ fontSize: '1.5rem', cursor: 'pointer' }}>📷</span>
              <span style={{ fontSize: '1.5rem', cursor: 'pointer' }}>💼</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid #3a5a6b' }}>
          © {new Date().getFullYear()} OKOA GAS. All rights reserved. Clean Cooking for Every Home.
        </div>
      </footer>
    </div>
  );
};

export default App;