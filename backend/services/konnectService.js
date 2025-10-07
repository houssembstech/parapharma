import axios from 'axios';

const KONNECT_BASE_URL = process.env.KONNECT_BASE_URL || 'https://api.preprod.konnect.network';
const KONNECT_API_KEY = process.env.KONNECT_API_KEY;
const KONNECT_MERCHANT_ID = process.env.KONNECT_MERCHANT_ID;

class KonnectService {
  constructor() {
    this.client = axios.create({
      baseURL: KONNECT_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KONNECT_API_KEY,
      },
    });
  }

  // Create Konnect payment
  async createPayment(paymentData) {
    try {
      const response = await this.client.post('/api/v2/payments', {
        receiverWalletId: KONNECT_MERCHANT_ID,
        token: "TND",
        amount: paymentData.amount,
        type: "immediate",
        description: paymentData.description,
        firstName: paymentData.firstName,
        lastName: paymentData.lastName,
        customerEmail: paymentData.customerEmail,
        customerPhoneNumber: paymentData.customerPhoneNumber,
        acceptedPaymentMethods: ["wallet", "bank_card"],
        lifespan: 10,
        checkoutForm: true,
        addPaymentFeesToAmount: true,
        returnUrl: paymentData.returnUrl,
        cancelUrl: paymentData.cancelUrl,
        webhook: paymentData.webhook
      });
      return response.data;
    } catch (error) {
      console.error('Konnect payment creation error:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Konnect payment creation failed');
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId) {
    try {
      const response = await this.client.get(`/api/v2/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment status');
    }
  }
}

export default new KonnectService();