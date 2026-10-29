import Purchases, {
  PurchasesOfferings,
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform, Alert } from 'react-native';

const REVENUECAT_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
}) || '';

class PurchaseService {
  private isInitialized = false;

  /**
   * Initialize RevenueCat SDK with user ID
   * Call this after user logs in
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) {
      console.log('RevenueCat already initialized');
      return;
    }

    try {
      if (!REVENUECAT_API_KEY) {
        console.warn('RevenueCat API key not configured');
        return;
      }

      // Configure RevenueCat
      Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId,
      });

      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      this.isInitialized = true;
      console.log('RevenueCat initialized for user:', userId);
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Get available offerings from RevenueCat
   */
  async getOfferings(): Promise<PurchasesOfferings | null> {
    if (!this.isInitialized || !REVENUECAT_API_KEY) {
      console.log('RevenueCat not initialized — skipping getOfferings');
      return null;
    }
    try {
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current !== null) {
        console.log('Available offerings:', offerings.current.availablePackages.length);
        return offerings;
      } else {
        console.log('No offerings available');
        return null;
      }
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;  // Return null instead of throwing
    }
  }

  /**
   * Purchase a package
   * Returns customer info on success
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      console.log('Purchase successful:', customerInfo);
      return customerInfo;
    } catch (error) {
      const purchaseError = error as PurchasesError;
      
      // Don't show error if user cancelled
      if (purchaseError.userCancelled) {
        console.log('User cancelled purchase');
        throw new Error('USER_CANCELLED');
      }

      console.error('Purchase failed:', purchaseError);
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      console.log('Purchases restored:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Check if user has active entitlement
   */
  async checkEntitlement(entitlementId: string): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[entitlementId];
      
      if (entitlement) {
        console.log(`Entitlement ${entitlementId} is active`);
        return true;
      }
      
      console.log(`Entitlement ${entitlementId} is not active`);
      return false;
    } catch (error) {
      console.error('Failed to check entitlement:', error);
      return false;
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  /**
   * Check if user has pro access
   */
  async hasProAccess(): Promise<boolean> {
    return this.checkEntitlement('pro_access');
  }

  /**
   * Get active subscription plan name
   */
  async getActivePlan(): Promise<string> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const proEntitlement = customerInfo.entitlements.active['pro_access'];
      
      if (!proEntitlement) {
        return 'free';
      }

      // Map product identifier to plan name
      const productId = proEntitlement.productIdentifier.toLowerCase();
      
      if (productId.includes('job_seeker')) {
        return 'job_seeker';
      } else if (productId.includes('career_plus')) {
        return 'career_plus';
      } else if (productId.includes('pro')) {
        return 'pro';
      }
      
      return 'free';
    } catch (error) {
      console.error('Failed to get active plan:', error);
      return 'free';
    }
  }

  /**
   * Logout user from RevenueCat
   */
  async logout(): Promise<void> {
    try {
      await Purchases.logOut();
      this.isInitialized = false;
      console.log('RevenueCat user logged out');
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error);
    }
  }
}

export const purchaseService = new PurchaseService();
export default purchaseService;
