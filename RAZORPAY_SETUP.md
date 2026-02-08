# 💳 Razorpay Payment Gateway Setup

## Overview
This platform supports **Razorpay** payment gateway for seamless course purchases with multiple payment methods including UPI, Cards, NetBanking, and Wallets.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Razorpay Account

1. Visit: https://razorpay.com/
2. Click **"Sign Up"** (Free account - no setup fee)
3. Fill in your business details:
   - Business Name
   - Email
   - Phone Number
4. Verify your email
5. Complete KYC (for live mode)

**Note:** You can start with **Test Mode** without KYC for development.

---

### Step 2: Get Your API Keys

#### For Test Mode (Recommended for Development):

1. Login to Razorpay Dashboard: https://dashboard.razorpay.com/
2. Navigate to **Settings** → **API Keys**
3. Click **"Generate Test Keys"**
4. You'll see:
   ```
   Key ID: rzp_test_xxxxxxxxxxxxx
   Key Secret: xxxxxxxxxxxxxxxxxxxx
   ```

#### For Live Mode (Production):

1. Complete KYC verification
2. Navigate to **Settings** → **API Keys**
3. Click **"Generate Live Keys"**
4. You'll see:
   ```
   Key ID: rzp_live_xxxxxxxxxxxxx
   Key Secret: xxxxxxxxxxxxxxxxxxxx
   ```

**⚠️ Security Warning:** Never commit your Key Secret to version control!

---

### Step 3: Update Environment Variables

Open `backend/.env` and add:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
```

**Replace** with your actual keys from Step 2.

---

### Step 4: Restart Backend Server

```bash
cd backend
npm start
```

Wait for: `✅ MongoDB Connected Successfully`

---

## 🧪 Testing Payments

### Test Mode Credentials

Razorpay provides test cards for development:

#### Test UPI IDs:
- **Success:** `success@razorpay`
- **Failure:** `failure@razorpay`

#### Test Card Numbers:

| Card Type | Number | CVV | Expiry | Result |
|-----------|--------|-----|--------|--------|
| Mastercard | 5267 3181 8797 5449 | Any 3 digits | Any future date | Success |
| Visa | 4111 1111 1111 1111 | Any 3 digits | Any future date | Success |
| Amex | 3782 822463 10005 | Any 4 digits | Any future date | Success |

#### Test NetBanking:
- Select any bank
- Enter any username/password
- Choose **"Success"** or **"Failure"**

---

## 💰 Payment Flow

1. **User clicks "Buy Now"** on course page
2. **Payment modal appears** with Razorpay and Stripe options
3. **User selects Razorpay**
4. **Razorpay checkout opens** with:
   - UPI
   - Cards (Credit/Debit)
   - NetBanking
   - Wallets (Paytm, PhonePe, etc.)
5. **User completes payment**
6. **Backend verifies payment** with signature validation
7. **Course is added** to user's account
8. **Confirmation email** is sent

---

## 🔒 Security Features

### Payment Signature Verification

The backend automatically verifies every payment using HMAC SHA256:

```javascript
const crypto = require('crypto');
const generatedSignature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');

if (generatedSignature !== receivedSignature) {
  return res.status(400).json({ message: 'Invalid payment signature' });
}
```

This ensures that:
- ✅ Payments cannot be faked
- ✅ No unauthorized course access
- ✅ Secure transaction verification

---

## 🌍 Supported Payment Methods

### India (All Methods):
- 💳 **Credit Cards**: Visa, Mastercard, RuPay, Amex
- 💳 **Debit Cards**: All major banks
- 📱 **UPI**: Google Pay, PhonePe, Paytm, BHIM
- 🏦 **NetBanking**: 50+ banks
- 👛 **Wallets**: Paytm, PhonePe, Mobikwik, Airtel Money
- 📲 **EMI**: Credit card & debit card EMI

### International:
- 💳 **Cards**: Visa, Mastercard, Amex
- 🌐 **Digital Wallets**: Apple Pay, Google Pay

---

## 💸 Pricing & Fees

### Test Mode:
- **FREE** - Unlimited transactions
- No charges for development/testing

### Live Mode (Production):

#### Domestic Transactions (India):
- **UPI**: 0% (FREE)
- **Debit Cards**: 0.8% + ₹2
- **Credit Cards**: 2%
- **NetBanking**: ₹3 - ₹10
- **Wallets**: 2%

#### International Transactions:
- **Cards**: 3% + ₹2

**Note:** Prices may vary. Check latest pricing at: https://razorpay.com/pricing/

---

## 🔧 Configuration Options

### Currency Support

Default: **INR** (Indian Rupee)

To change currency, update `backend/routes/payments.js`:

```javascript
const order = await razorpay.orders.create({
  amount: Math.round(course.price * 100),
  currency: 'USD', // Change to USD, EUR, GBP, etc.
  // ...
});
```

Supported currencies: `INR`, `USD`, `EUR`, `GBP`, `AUD`, `CAD`, `SGD`, and 90+ more.

---

### Customize Checkout Theme

Update theme color in `frontend/src/pages/CourseDetail.js`:

```javascript
theme: {
  color: '#6366F1', // Change to your brand color
  backdrop_color: '#000000'
}
```

---

## 📊 Webhook Integration (Optional)

For production, set up webhooks to handle:
- Payment failures
- Refunds
- Chargebacks

1. Go to **Dashboard** → **Settings** → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/payments/razorpay-webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Save webhook secret in `.env`:

```env
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## 🛠️ Troubleshooting

### Issue: "Razorpay is not defined"

**Solution:** Ensure Razorpay SDK is loaded in `frontend/public/index.html`:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

### Issue: "Invalid API Key"

**Solutions:**
1. Verify `.env` file has correct keys
2. Restart backend server after updating `.env`
3. Check if using test key with test prefix `rzp_test_`

---

### Issue: "Payment verification failed"

**Solutions:**
1. Check `RAZORPAY_KEY_SECRET` is correct in `.env`
2. Ensure backend is running
3. Check browser console for errors

---

### Issue: "Course already purchased" error on retry

**Solution:** This is expected behavior. Check `My Courses` page.

---

## 📚 Additional Resources

- **Razorpay Documentation**: https://razorpay.com/docs/
- **API Reference**: https://razorpay.com/docs/api/
- **Payment Links**: https://razorpay.com/docs/payment-links/
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/
- **Support**: https://razorpay.com/support/

---

## 🎯 Next Steps

1. ✅ Set up Razorpay account
2. ✅ Add API keys to `.env`
3. ✅ Test with test cards
4. ✅ Complete KYC for live mode
5. ✅ Update to live keys for production
6. ✅ Set up webhooks (optional)
7. ✅ Monitor transactions in dashboard

---

## 🆚 Razorpay vs Stripe

Both payment gateways are integrated. Choose based on your needs:

### Use **Razorpay** if:
- ✅ Primary audience is in India
- ✅ Need UPI/NetBanking support
- ✅ Want 0% fee on UPI
- ✅ Need Indian rupee support

### Use **Stripe** if:
- ✅ Global/International audience
- ✅ Need multi-currency support
- ✅ Want extensive developer tools
- ✅ Need subscription billing

**Good News:** This platform supports **both**! Users can choose their preferred method.

---

## ⚡ Quick Test

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Go to: http://localhost:3000/courses
4. Click any course → "Buy Now"
5. Select **"Razorpay"** option
6. Use test UPI: `success@razorpay`
7. Complete payment
8. ✅ Course should appear in "My Courses"

---

## 🔐 Security Checklist

- [ ] Never commit `.env` file
- [ ] Use test keys for development
- [ ] Use live keys only in production
- [ ] Enable webhook signature verification
- [ ] Set up proper error logging
- [ ] Monitor failed payments
- [ ] Implement refund policy
- [ ] Add rate limiting on payment endpoints

---

## 📞 Need Help?

- **Razorpay Support**: support@razorpay.com
- **Emergency**: +91 9999999999 (Business hours)
- **Documentation**: https://razorpay.com/docs/

---

**Last Updated:** November 8, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅

