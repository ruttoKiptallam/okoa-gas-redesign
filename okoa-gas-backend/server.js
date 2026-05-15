const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// M-PESA CONFIGURATION
// ============================================
const CONSUMER_KEY = process.env.CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.CONSUMER_SECRET || '';
const SHORTCODE = process.env.SHORTCODE || '174379';
const PASSKEY = process.env.PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:5000/api/mpesa/callback';

// Get OAuth Token
async function getAccessToken() {
    if (!CONSUMER_KEY || CONSUMER_KEY === 'your_consumer_key_here') {
        console.log('⚠️ Demo mode: Using fake token');
        return 'demo_token_12345';
    }
    
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    
    try {
        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: {
                    Authorization: `Basic ${auth}`
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting token:', error.response?.data || error.message);
        throw error;
    }
}

// STK Push
async function stkPush(phoneNumber, amount, accountReference, transactionDesc) {
    if (!CONSUMER_KEY || CONSUMER_KEY === 'your_consumer_key_here') {
        console.log('⚠️ Demo mode: Simulating STK Push');
        return {
            ResponseCode: '0',
            ResponseDescription: 'Success. Request accepted for processing',
            CheckoutRequestID: `DEMO_${Date.now()}`,
            MerchantRequestID: `DEMO_MERCHANT_${Date.now()}`
        };
    }
    
    const token = await getAccessToken();
    
    let formattedPhone = phoneNumber.toString().replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1);
    }
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
    
    const data = {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: CALLBACK_URL,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
    };
    
    try {
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            data,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('STK Push error:', error.response?.data || error.message);
        throw error;
    }
}

// ============================================
// API ENDPOINTS
// ============================================

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'M-PESA Payment Gateway',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.post('/api/mpesa/pay', async (req, res) => {
    console.log('📱 Payment request received:', req.body);
    
    const { phoneNumber, amount, accountReference, description } = req.body;
    
    if (!phoneNumber || !amount) {
        return res.status(400).json({ 
            success: false, 
            message: 'Phone number and amount are required' 
        });
    }
    
    if (amount < 1) {
        return res.status(400).json({ 
            success: false, 
            message: 'Minimum amount is KES 1' 
        });
    }
    
    try {
        const response = await stkPush(phoneNumber, amount, accountReference || 'OKOA-PAY', description || 'OKOA GAS Payment');
        
        if (response.ResponseCode === '0') {
            res.json({
                success: true,
                message: 'STK Push sent! Check your phone for M-PESA prompt.',
                checkoutRequestID: response.CheckoutRequestID,
                merchantRequestID: response.MerchantRequestID
            });
        } else {
            res.status(400).json({
                success: false,
                message: response.ResponseDescription || 'Payment initiation failed'
            });
        }
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment service error. Please try again.'
        });
    }
});

app.post('/api/mpesa/status', async (req, res) => {
    const { checkoutRequestID } = req.body;
    
    if (!checkoutRequestID) {
        return res.status(400).json({ error: 'CheckoutRequestID required' });
    }
    
    if (!CONSUMER_KEY || CONSUMER_KEY === 'your_consumer_key_here') {
        return res.json({
            ResultCode: '0',
            ResultDesc: 'Payment successful (Demo mode)',
            CheckoutRequestID: checkoutRequestID
        });
    }
    
    try {
        const token = await getAccessToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
        
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
            {
                BusinessShortCode: SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestID
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        
        res.json(response.data);
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/mpesa/callback', (req, res) => {
    console.log('📞 M-PESA Callback received');
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

// ============================================
// ✅ FIXED: 404 HANDLER - NO ASTERISK NEEDED
// ============================================
app.use((req, res) => {
    res.status(404).json({ 
        error: 'NOT_FOUND', 
        message: `Cannot ${req.method} ${req.url}`,
        availableEndpoints: [
            'GET /api/health',
            'POST /api/mpesa/pay',
            'POST /api/mpesa/status',
            'POST /api/mpesa/callback'
        ]
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ OKOA GAS Backend running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💳 Payment endpoint: http://localhost:${PORT}/api/mpesa/pay`);
    
    if (!CONSUMER_KEY || CONSUMER_KEY === 'your_consumer_key_here') {
        console.log('⚠️ Running in DEMO MODE - M-PESA calls are simulated');
        console.log('💡 Add real M-PESA credentials to .env for live payments');
    }
});