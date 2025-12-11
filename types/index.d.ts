import { Timestamp } from 'firebase/firestore';

export type Store = {
  id?: string;
  name: string;
  address: string;
  tin: string;
  email: string;
  phone: string;
  vatTaxPercentage: string;
  vatTaxInclusion: 'ADD_CHECKOUT' | 'INCLUDE_PRICES';
  serviceCharge: boolean;
  serviceChargePercentage: string;
  togoCharge: string;
  discounts: Discount[];
  mayaEnabled: boolean;
  mayaPublicKey: string;
  mayaSecret: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type Discount = {
  id?: string;
  type: string;
  rate: string;
  isSpecial: boolean;
  requirements?: {
    food: number;
    beverage: number;
  }[];
};

export type UserType = 'SERVICE' | 'KITCHEN' | 'BAR' | 'CUSTOMER';

export type User = {
  id?: string;
  name?: string;
  phone?: string;
  image: string;
  firstName: string;
  lastName: string;
  pin: string;
  storeId: string;
  type: UserType;
  deviceToken?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type ClockInOut = {
  id?: string;
  userId: string; // User id
  imageUrl: string;
  storeId: string;
  type: 'IN' | 'OUT';
  timestamp: Timestamp;
};

export type MenuGroupOptionSelection = {
  name: string;
  price: string;
  enabled: boolean;
};

export type MenuGroupOptionCategory = 'FOOD' | 'BEVERAGE' | 'ADD_ONS' | 'BEANS';

export type MenuGroupOption = {
  id?: string;
  required: boolean;
  name: string;
  category: MenuGroupOptionCategory;
  selections: MenuGroupOptionSelection[];
  enabled: boolean;
  storeId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type AddOn = {
  id?: string;
  name: string;
  price: string;
  category?: 'BEVERAGE' | 'FOOD';
  hasServiceCharge?: boolean;
  enabled?: boolean;
  stocks?: number;
  storeId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type MenuItem = {
  id?: string;
  name: string;
  images: string[];
  description: string;
  category: MenuGroupOptionCategory;
  subCategory: string;
  price: string;
  hasServiceCharge: boolean;
  allergenWarning: boolean;
  options: string[]; // MenuGroupOption id
  optionsData?: MenuGroupOption[];
  addOns: AddOn[];
  enabled: boolean;
  schedule: 'TODAY' | 'INDEFINITE';
  pairing: string[]; // MenuItem ids
  storeId: string;
  sold: number;
  stocks: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type DiningOption = 'FOR_HERE' | 'TO_GO';

export interface TempOrder {
  id: string;
  addOn?: AddOn;
  menu?: MenuItem;
  options: {
    menuGroupOptionId: string;
    selectionName: string;
    selectionPrice: number;
  }[];
  addOns: AddOn[];
  notes: string;
  qty: number;
}

// Order
export type Order = {
  id?: string;
  userId: string;
  addOnId?: string;
  addOn?: AddOn;
  menuId?: string;
  menu?: MenuItem;
  options: {
    menuGroupOptionId: string;
    selectionName: string;
    selectionPrice: number;
  }[];
  optionsData?: MenuGroupOption[];
  addOns?: AddOn[];
  qty: number;
  instructions: string;
  tableNum: number;
  orderType: DiningOption;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'READY' | 'COMPLETED';
  confirmedAt: Timestamp;
  readyAt: Timestamp;
  completedAt: Timestamp;
  storeId: string;
  referenceNumber: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// Transaction
export type Transaction = {
  id?: string;
  customerTransactionId?: string;
  userId: string;
  user?: User;
  customerName?: string;
  orderIds: string[];
  updatedOrderIds: string[];
  orders?: Order[];
  updatedOrders?: Order[];
  orderNum: string;
  diningOption: DiningOption;
  tableNum: number;
  numPax: number;
  isEnded: boolean;
  amount: number;
  beforeDiscountAmount: number;
  discountId: string;
  voucher: Voucher;
  source: 'DINER' | 'KIOSK' | 'SERVICE';
  paymentMethod: PaymentMethod;
  cashReceived: number;
  cashChange: number;
  referenceNumber: string;
  requestReferenceNumber: string;
  refundMethod: RefundMethod;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'TERMINAL';
  orderStatus: 'PENDING' | 'COMPLETED';
  paymentSuccessAt: Timestamp;
  completedAt: Timestamp;
  messageSent: boolean;
  createdAtTimeInMinutes: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  storeId: string;
  approvalCode?: string;
};

export type PaymentMethod = 'GCASH' | 'MAYA' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'QR_PH' | 'CASH';

export type RefundMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD';

export type Note = {
  id?: string;
  createdAt: Timestamp;
  text: string;
  storeId: string;
};

export type LogBook = {
  id?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  name: string;
  text: string;
  priority: 'URGENT' | 'MEDIUM' | 'LOW';
  status: 'OPENED' | 'RESOLVED' | 'DISMISSED';
  storeId: string;
};

export interface UpsellAd {
  id?: string;
  name: string;
  category: MenuGroupOptionCategory;
  menuItemId: string;
  image: string;
  enabled: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  storeId: string;
  views: number;
  clicks: number;
}

export interface Insight {
  chart?: {
    component?: string;
    chart_type?: 'line' | 'bar' | 'area' | 'pie' | 'scatter' | 'composed';
    data_json?: {
      [key: string]: string | number;
    }[];
    data_summary?: {
      columns?: string[];
    };
  };
  error: string;
  execution_time: string;
  explanation: string;
  html_insights: string;
  html_summary: string;
  insights: string;
  question: string;
  results: {
    item_name: string;
  }[];
  sql: string;
  summary: string;
}

export type Voucher = {
  id?: string;
  code: string;
  used: boolean;
  rate: number;
  name: string;
  storeId: string;
  createdAt: Timestamp;
  usedAt: Timestamp;
  expiredAt: Timestamp;
};
