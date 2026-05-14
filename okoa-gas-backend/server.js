const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ========== M-PESA CONFIGURATION ==========
const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const SHORTCODE = process.env.SHORTCODE; // 174379 (for sandbox) or your Paybill
const PASSKEY = process.env.PASSKEY; // Your passkey
const CALLBACK_URL = process.env.CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback';

// Get OAuth Token
async function getAccessToken() {
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

// STK Push (Lipa Na M-PESA Online)
async function stkPush(phoneNumber, amount, accountReference, transactionDesc) {
    const token = await getAccessToken();
    
    // Format phone number (remove 0 or +254, add 254)
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

// M-PESA Callback Endpoint
app.post('/api/mpesa/callback', (req, res) => {
    console.log('M-PESA Callback:', JSON.stringify(req.body, null, 2));
    
    const { Body } = req.body;
    if (Body && Body.stkCallback) {
        const { ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
        
        if (ResultCode === 0) {
            // Payment successful
            const metadata = {};
            CallbackMetadata.Item.forEach(item => {
                metadata[item.Name] = item.Value;
            });
            
            console.log('✅ Payment successful!', {
                amount: metadata.Amount,
                mpesaReceipt: metadata.MpesaReceiptNumber,
                phone: metadata.PhoneNumber
            });
            
            // Update your database here
        } else {
            console.log('❌ Payment failed:', ResultDesc);
        }
    }
    
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

// API Endpoint: Initiate Payment
app.post('/api/mpesa/pay', async (req, res) => {
    const { phoneNumber, amount, accountReference, description } = req.body;
    
    // Validate
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
        const response = await stkPush(phoneNumber, amount, accountReference, description);
        
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
        res.status(500).json({
            success: false,
            message: 'Payment service error. Please try again.'
        });
    }
});

// API Endpoint: Check Payment Status
app.post('/api/mpesa/status', async (req, res) => {
    const { checkoutRequestID } = req.body;
    const token = await getAccessToken();
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
    
    try {
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
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', service: 'M-PESA Payment Gateway' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ M-PESA Server running on port ${PORT}`);
    console.log(`📍 Callback URL: ${CALLBACK_URL}`);
});