/**
 * Orange Money API Integration for Madagascar
 * Supports payment processing in Ariary MGA
 * 
 * Environment variables required:
 * - ORANGE_MONEY_CLIENT_ID
 * - ORANGE_MONEY_CLIENT_SECRET
 * - ORANGE_MONEY_API_URL (default: https://api.orange.mg/orange-money-webpay/v1)
 * - ORANGE_MONEY_MERCHANT_ID
 */

import axios from "axios";

interface OrangeMoneyConfig {
  clientId: string;
  clientSecret: string;
  apiUrl: string;
  merchantId: string;
}

interface PaymentRequest {
  amount: number; // Montant en Ariary MGA
  phoneNumber: string; // Numéro de téléphone Orange Money
  orderId: string; // ID unique de la commande
  description: string;
  callbackUrl: string;
  notificationUrl: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  status?: string;
  errorMessage?: string;
  redirectUrl?: string;
}

interface PaymentStatus {
  status: "pending" | "completed" | "failed" | "cancelled";
  transactionId?: string;
  amount?: number;
  errorMessage?: string;
}

class OrangeMoneyClient {
  private config: OrangeMoneyConfig;
  private accessToken: string = "";
  private tokenExpiry: number = 0;

  constructor(config: OrangeMoneyConfig) {
    this.config = config;
  }

  /**
   * Get or refresh access token
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    if (this.accessToken && this.tokenExpiry > now) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.config.apiUrl}/oauth/token`,
        {
          grant_type: "client_credentials",
        },
        {
          auth: {
            username: this.config.clientId,
            password: this.config.clientSecret,
          },
        }
      );

      this.accessToken = response.data.access_token || "";
      this.tokenExpiry = now + ((response.data.expires_in || 3600) * 1000);

      return this.accessToken;
    } catch (error) {
      console.error("[OrangeMoney] Token error:", error);
      throw new Error("Failed to get Orange Money access token");
    }
  }

  /**
   * Initiate a payment request
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.config.apiUrl}/webpay/initiate`,
        {
          amount: request.amount,
          currency: "MGA",
          orderId: request.orderId,
          orderDescription: request.description,
          merchantId: this.config.merchantId,
          notificationUrl: request.notificationUrl,
          returnUrl: request.callbackUrl,
          subscriberNumber: request.phoneNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        transactionId: response.data.transactionId,
        redirectUrl: response.data.redirectUrl,
        status: "pending",
      };
    } catch (error: any) {
      console.error("[OrangeMoney] Payment initiation error:", error.response?.data || error.message);
      return {
        success: false,
        errorMessage: error.response?.data?.message || "Payment initiation failed",
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentStatus> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(
        `${this.config.apiUrl}/webpay/check-transaction-status`,
        {
          params: {
            transactionId,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const status = response.data.status?.toLowerCase();

      if (status === "success" || status === "completed") {
        return {
          status: "completed",
          transactionId,
          amount: response.data.amount,
        };
      } else if (status === "failed") {
        return {
          status: "failed",
          transactionId,
          errorMessage: response.data.errorMessage || "Payment failed",
        };
      } else {
        return {
          status: "pending",
          transactionId,
        };
      }
    } catch (error: any) {
      console.error("[OrangeMoney] Status check error:", error.response?.data || error.message);
      return {
        status: "failed",
        errorMessage: error.response?.data?.message || "Failed to check payment status",
      };
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(transactionId: string, amount: number): Promise<PaymentResponse> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        `${this.config.apiUrl}/webpay/refund`,
        {
          transactionId,
          amount,
          currency: "MGA",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        transactionId: response.data.transactionId,
        status: "completed",
      };
    } catch (error: any) {
      console.error("[OrangeMoney] Refund error:", error.response?.data || error.message);
      return {
        success: false,
        errorMessage: error.response?.data?.message || "Refund failed",
      };
    }
  }
}

/**
 * Create Orange Money client from environment variables
 */
export function createOrangeMoneyClient(): OrangeMoneyClient {
  const config: OrangeMoneyConfig = {
    clientId: process.env.ORANGE_MONEY_CLIENT_ID || "",
    clientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET || "",
    apiUrl: process.env.ORANGE_MONEY_API_URL || "https://api.orange.mg/orange-money-webpay/v1",
    merchantId: process.env.ORANGE_MONEY_MERCHANT_ID || "",
  };

  if (!config.clientId || !config.clientSecret || !config.merchantId) {
    console.warn("[OrangeMoney] Missing configuration. Payments will fail. Set environment variables:");
    console.warn("- ORANGE_MONEY_CLIENT_ID");
    console.warn("- ORANGE_MONEY_CLIENT_SECRET");
    console.warn("- ORANGE_MONEY_MERCHANT_ID");
  }

  return new OrangeMoneyClient(config);
}

export { OrangeMoneyClient, PaymentRequest, PaymentResponse, PaymentStatus };
