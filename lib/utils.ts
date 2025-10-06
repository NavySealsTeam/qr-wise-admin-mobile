import { clsx, type ClassValue } from 'clsx';
import { subDays } from 'date-fns';
import pluralize from 'pluralize';
import { twMerge } from 'tailwind-merge';
import { MenuItemMovementWithComparison } from '~/hooks/useProductMovementInsightGPT';
import {
  DiningOption,
  Discount,
  MenuGroupOptionCategory,
  MenuItem,
  Order,
  Store,
  TempOrder,
  Transaction,
  Voucher,
} from '~/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isValidName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

export const isStrongPassword = (password: string): boolean => {
  // At least 8 chars, 1 uppercase, 1 number, 1 special character
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[^\s]{8,}$/.test(password);
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const toTitleCase = (str: string) => {
  return (str || '').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
};

export function makePluralize(word: string, count: number) {
  return pluralize(word, count);
}

export const fetchImageFromUri = async (uri: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

export const maskNumber = (number: string) => {
  const str = number.toString();
  return str.slice(0, -4).replace(/./g, '*') + str.slice(-4);
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getTimeOfDay = (date = new Date()) => {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 17) {
    return 'afternoon';
  } else {
    return 'evening';
  }
};

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatNumber(num: number) {
  if (num >= 1e12) return (num / 1e12).toFixed(2).replace(/\.0$/, '') + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.0$/, '') + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.0$/, '') + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2).replace(/\.0$/, '') + 'K';
  return num.toFixed(2).toString();
}

export function formatStringToNumber(str: string) {
  const value = parseFloat((str || '').toString().replace(/,/g, ''));

  if (isNaN(value)) {
    return 0;
  }

  return value;
}

function calculateTotalByCategory(orders: Order[] | TempOrder[], category: MenuGroupOptionCategory) {
  return orders.reduce((acc, order) => {
    if (order.menu?.category !== category) return acc;

    const options = order.options || [];
    const addOns = order.addOns || [];
    const menuPrice = Number(order.menu?.price) || 0;

    const selectionPrice = options.reduce((sum, opt) => sum + Number(opt.selectionPrice || 0), 0);
    const addOnPrice = addOns.reduce((sum, addOn) => sum + Number(addOn.price || 0), 0);

    return acc + order.qty * (menuPrice + selectionPrice + addOnPrice);
  }, 0);
}

function calculateTotalWithServiceCharge(orders: Order[] | TempOrder[], category: MenuGroupOptionCategory) {
  return orders.reduce((acc, order) => {
    if (order.menu?.category !== category || order.menu?.hasServiceCharge === false) {
      return acc;
    }

    const options = order.options || [];
    const addOns = order.addOns || [];
    const menuPrice = Number(order.menu?.price) || 0;

    const selectionPrice = options.reduce((sum, option) => sum + Number(option.selectionPrice || 0), 0);
    const addOnPrice = addOns.reduce((sum, addOn) => sum + Number(addOn.price || 0), 0);

    return acc + order.qty * (menuPrice + selectionPrice + addOnPrice);
  }, 0);
}

export function calculateTotals(
  orders: Order[] | TempOrder[],
  diningOption: DiningOption,
  store: Store | null,
  discount: Discount | null,
  voucher: Voucher | null,
) {
  const totalBeverageOrderAmount = calculateTotalByCategory(orders, 'BEVERAGE');
  const totalFoodOrderAmount = calculateTotalByCategory(orders, 'FOOD');
  const totalAddOnsOrderAmount = orders.reduce((acc, order) => {
    if (!order.addOn) return acc;
    const addOnPrice = Number(order.addOn.price);
    return acc + order.qty * addOnPrice;
  }, 0);

  // with service charge
  const totalBeverageOrderWithServiceChargeAmount = calculateTotalWithServiceCharge(orders, 'BEVERAGE');
  const totalFoodOrderWithServiceChargeAmount = calculateTotalWithServiceCharge(orders, 'FOOD');
  const totalAddOnsWithServiceChargeAmount = orders.reduce((acc, order) => {
    if (!order.addOn || order.addOn.hasServiceCharge === false) return acc;
    const addOnPrice = Number(order.addOn.price);
    return acc + order.qty * addOnPrice;
  }, 0);
  // end with service charge

  const quantity = orders.reduce((acc, order) => {
    return acc + order.qty;
  }, 0);

  const totalOrderAmount = totalBeverageOrderAmount + totalFoodOrderAmount + totalAddOnsOrderAmount;
  const subtotal = Number((totalOrderAmount / (Number(store?.vatTaxPercentage) / 100)).toFixed(2));
  const vat = discount && discount.isSpecial ? 0 : totalOrderAmount - subtotal;
  const discounted = Number(
    (discount ? (discount.isSpecial ? subtotal : subtotal + vat) * (Number(discount?.rate) / 100) : 0).toFixed(2),
  );
  const voucherDiscounted = Number((voucher ? (subtotal + vat) * (voucher.rate / 100) : 0).toFixed(2));

  const totalWithServiceChargeAmount =
    totalBeverageOrderWithServiceChargeAmount +
    totalFoodOrderWithServiceChargeAmount +
    totalAddOnsWithServiceChargeAmount;
  const withTogoCharge = totalFoodOrderWithServiceChargeAmount + totalAddOnsWithServiceChargeAmount;
  const togoCharge = diningOption === 'TO_GO' && withTogoCharge > 0 ? Number(store?.togoCharge) : 0;

  let serviceCharge = 0;
  if (diningOption === 'FOR_HERE' && store?.serviceCharge && totalWithServiceChargeAmount > 0) {
    const lessVat = Number((totalWithServiceChargeAmount / (Number(store?.vatTaxPercentage) / 100)).toFixed(2));
    const lessDiscount = Number((discount ? Number(discount.rate) / 100 : voucher ? voucher.rate / 100 : 0).toFixed(2));
    serviceCharge = Number(
      ((lessVat - lessVat * lessDiscount) * (Number(store?.serviceChargePercentage) / 100)).toFixed(2),
    );
  }

  const totalAmount = subtotal + vat - discounted - voucherDiscounted + serviceCharge + togoCharge;

  return {
    quantity,
    subtotal,
    vat,
    discounted,
    serviceCharge,
    togoCharge,
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

export function calculateTransactionsTotals(transactions: Transaction[], store: Store | null) {
  const successTransactions = transactions.filter((i) => i.status === 'SUCCESS');

  const totalSalesWithVatEx = successTransactions
    .map((transaction) => {
      const discount = store?.discounts.find((i) => i.id === transaction.discountId);
      const { subtotal } = calculateTotals(
        transaction.orders || [],
        transaction.diningOption,
        store,
        discount || null,
        transaction.voucher || null,
      );
      return subtotal;
    })
    .reduce((acc, i) => acc + i, 0);

  const totalSalesWithVatInc = successTransactions
    .map((transaction) => transaction.amount)
    .reduce((acc, i) => acc + i, 0);

  const totalAmountByPaymentMethod = successTransactions
    .filter((i) => i.source === 'DINER')
    .reduce(
      (acc: Record<string, number>, transaction) => {
        const method = transaction.paymentMethod || 'Unknown';
        const amount = transaction.amount || 0;

        if (!acc[method]) {
          acc[method] = 0;
        }

        acc[method] += amount;
        return acc;
      },
      {} as Record<string, number>,
    );

  return {
    successTransactions,
    totalSalesWithVatEx,
    totalSalesWithVatInc,
    dinerSales: successTransactions
      .filter((i) => i.source === 'DINER')
      .map((transaction) => transaction.amount)
      .reduce((acc, i) => acc + i, 0),
    terminalSales: successTransactions
      .filter((i) => ['KIOSK', 'SERVICE'].includes(i.source) && ['CREDIT_CARD', 'DEBIT_CARD'].includes(i.paymentMethod))
      .map((transaction) => transaction.amount)
      .reduce((acc, i) => acc + i, 0),
    qrphSales: successTransactions
      .filter((i) => ['KIOSK', 'SERVICE'].includes(i.source) && i.paymentMethod === 'QR_PH')
      .map((transaction) => transaction.amount)
      .reduce((acc, i) => acc + i, 0),
    diner: {
      ...totalAmountByPaymentMethod,
    },
    kiosk: {
      creditCard: successTransactions
        .filter((i) => i.paymentMethod === 'CREDIT_CARD' && i.source === 'KIOSK')
        .map((transaction) => transaction.amount)
        .reduce((acc, i) => acc + i, 0),
      debitCard: successTransactions
        .filter((i) => i.paymentMethod === 'DEBIT_CARD' && i.source === 'KIOSK')
        .map((transaction) => transaction.amount)
        .reduce((acc, i) => acc + i, 0),
      qrph: successTransactions
        .filter((i) => i.paymentMethod === 'QR_PH' && i.source === 'KIOSK')
        .map((transaction) => transaction.amount)
        .reduce((acc, i) => acc + i, 0),
    },
    counter: {
      cash: successTransactions
        .filter((i) => i.paymentMethod === 'CASH' && (i.source === 'SERVICE' || !i.source))
        .map((transaction) => transaction.amount)
        .reduce((acc, i) => acc + i, 0),
      creditCard: successTransactions
        .filter((i) => i.paymentMethod === 'CREDIT_CARD' && (i.source === 'SERVICE' || !i.source))
        .map((transaction) => transaction.amount)
        .reduce((acc, i) => acc + i, 0),
      debitCard: successTransactions
        .filter((i) => i.paymentMethod === 'DEBIT_CARD' && (i.source === 'SERVICE' || !i.source))
        .map((transaction) => transaction.amount)
        .reduce((acc, i) => acc + i, 0),
      qrph: successTransactions
        .filter((i) => i.paymentMethod === 'QR_PH' && (i.source === 'SERVICE' || !i.source))
        .map((transaction) => transaction.amount)
        .reduce((acc, i) => acc + i, 0),
      grabFood: 0,
    },
  };
}

export function computeMenuItemMovementFull(
  transactions: Transaction[],
  menuItems: MenuItem[],
): MenuItemMovementWithComparison[] {
  const unitSoldMap = new Map<string, number>();
  const totalSalesMap = new Map<string, number>();
  let totalSalesAll = 0;

  // Precompute a map of menu item prices for quick lookup
  const priceMap = new Map<string, number>();
  menuItems.forEach((menu) => {
    if (menu.id) priceMap.set(menu.id, Number(menu.price) || 0);
  });

  transactions.forEach((transaction) => {
    if (!transaction.orders || transaction.orders.length === 0) return;

    transaction.orders.forEach((order) => {
      if (!order.menuId || !order.qty) return;
      const id = order.menuId;
      const qty = order.qty;
      const price = priceMap.get(id) || 0;
      const subtotal = price * qty;

      // 👉 This gives total units sold per menu item.
      const prevQty = unitSoldMap.get(id) || 0;
      unitSoldMap.set(id, prevQty + qty);

      // 👉 This gives total revenue per menu item.
      const prevTotal = totalSalesMap.get(id) || 0;
      totalSalesMap.set(id, prevTotal + subtotal);

      totalSalesAll += subtotal;
    });
  });

  return menuItems.map((menuItem) => {
    const id = menuItem.id || '';
    const unitSold = unitSoldMap.get(id) || 0;
    const totalSales = totalSalesMap.get(id) || 0;

    // 👉 This gives each item's contribution to overall sales, in percentage.
    const percentageOfSales = totalSalesAll > 0 ? (totalSales / totalSalesAll) * 100 : 0;

    return {
      menuItemId: id,
      name: menuItem.name,
      unitSold,
      totalSales,
      percentageOfSales,
    };
  });
}

export function getDateFromRange(value: number, numDays: number) {
  if (value < 0 || value > numDays) {
    throw new Error(`Value must be between 0 and ${numDays}`);
  }

  const daysFromToday = numDays - value;
  const date = subDays(new Date(), daysFromToday);
  return date;
}
