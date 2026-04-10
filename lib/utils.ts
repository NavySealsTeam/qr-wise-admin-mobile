import { clsx, type ClassValue } from 'clsx';
import { subDays } from 'date-fns';
import pluralize from 'pluralize';
import { twMerge } from 'tailwind-merge';
import { MenuItemMovementWithComparison } from '~/hooks/useProductMovementInsightGPT';
import { DiningOption, Discount, MenuGroupOptionCategory, MenuItem, Order, Store, Transaction, Voucher } from '~/types';

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

function calculateTotalByCategory(orders: Order[], category: MenuGroupOptionCategory) {
  return (orders || []).reduce((acc, order) => {
    if (order.menu?.category !== category) return acc;

    const options = order.options || [];
    const addOns = order.addOns || [];
    const menuPrice = Number(order.menu?.price) || 0;

    const selectionPrice = options.reduce((sum, opt) => sum + Number(opt.selectionPrice || 0), 0);
    const addOnPrice = addOns.reduce((sum, addOn) => sum + Number(addOn.price || 0), 0);

    const total = order.qty * (menuPrice + selectionPrice + addOnPrice);

    return acc + total;
  }, 0);
}

function calculateTotalWithServiceCharge(orders: Order[], category: MenuGroupOptionCategory) {
  return (orders || []).reduce((acc, order) => {
    if (order.menu?.category !== category || order.menu?.hasServiceCharge === false) {
      return acc;
    }

    const options = order.options || [];
    const addOns = order.addOns || [];
    const menuPrice = Number(order.menu?.price) || 0;

    const selectionPrice = options.reduce((sum, option) => sum + Number(option.selectionPrice || 0), 0);
    const addOnPrice = addOns.reduce((sum, addOn) => sum + Number(addOn.price || 0), 0);

    const total = order.qty * (menuPrice + selectionPrice + addOnPrice);

    return acc + total;
  }, 0);
}

// NOTE: This logic gives you the cheapest eligible item for free, regardless of quantity. If you want to only give free item if you buy at least 1 eligible item, add a check for qty > 0 and only push one unit price per order line instead of qty times
export function calculateBuyOneGetOneDiscount(orders: Order[], eligibleIds: Set<string> | null) {
  let smallestFree: number | null = null;

  for (const order of orders) {
    const menuId = order.menu?.id;
    if (!menuId) continue;

    const eligible = eligibleIds === null ? true : eligibleIds.has(menuId);
    if (!eligible) continue;

    const qty = Number(order.qty ?? 0);
    if (qty < 2) continue; // ✅ ONLY qty >= 2 qualifies

    const unitPrice = getFinalUnitPrice(order);

    smallestFree = smallestFree === null ? unitPrice : Math.min(smallestFree, unitPrice);
  }

  return smallestFree ? Number(smallestFree.toFixed(2)) : 0;
}

export function calculateFreeAnyEligibleItemDiscount(orders: Order[], eligibleIds: Set<string> | null) {
  // build list of eligible order lines with their unit price
  const eligibleUnitPrices: number[] = [];

  for (const order of orders) {
    const menuId = order.menu?.id;
    if (!menuId) continue;

    const eligible = eligibleIds === null ? true : eligibleIds.has(menuId);
    if (!eligible) continue;
    if ((order.qty ?? 0) <= 0) continue;

    const options = order.options || [];
    const addOns = order.addOns || [];
    const menuPrice = Number(order.menu?.price) || 0;

    const selectionPrice = options.reduce((s, o) => s + Number(o.selectionPrice || 0), 0);
    const addOnPrice = addOns.reduce((s, a) => s + Number(a.price || 0), 0);

    const unitFinal = menuPrice + selectionPrice + addOnPrice;

    // if qty is 3, you still only get 1 free, so just push one unit price
    eligibleUnitPrices.push(unitFinal);
  }

  if (eligibleUnitPrices.length === 0) return 0;

  // ✅ cheapest eligible unit becomes free
  const cheapest = Math.min(...eligibleUnitPrices);

  // safety: discount cannot be negative
  return Number(Math.max(0, cheapest).toFixed(2));
}

export function calculateEligibleTotal(orders: Order[] = [], eligibleIds: Set<string> | null) {
  return orders.reduce((acc, order) => {
    const menuId = order.menu?.id;
    if (!menuId) return acc;

    const eligible = eligibleIds === null ? true : eligibleIds.has(menuId);
    if (!eligible) return acc;

    return acc + getOrderLineTotal(order);
  }, 0);
}

export function getFinalUnitPrice(order: Order) {
  const options = order.options || [];
  const addOns = order.addOns || [];
  const menuPrice = Number(order.menu?.price) || 0;

  const selectionPrice = options.reduce((s, o) => s + Number(o.selectionPrice || 0), 0);
  const addOnPrice = addOns.reduce((s, a) => s + Number(a.price || 0), 0);

  const unitRaw = menuPrice + selectionPrice + addOnPrice;
  const qty = Number(order.qty || 1);

  const lineTotal = unitRaw * qty;
  return lineTotal / qty;
}

export function getOrderLineTotal(order: Order) {
  const options = order.options || [];
  const addOns = order.addOns || [];
  const menuPrice = Number(order.menu?.price) || 0;

  const selectionPrice = options.reduce((sum, opt) => sum + Number(opt.selectionPrice || 0), 0);
  const addOnPrice = addOns.reduce((sum, addOn) => sum + Number(addOn.price || 0), 0);

  const rawTotal = order.qty * (menuPrice + selectionPrice + addOnPrice);
  return rawTotal;
}

export function getEligibleMenuItemIdSet(menu_items: unknown) {
  const isAllMenuItems = String(menu_items || '').toLowerCase() === 'all menu items';
  if (isAllMenuItems) return null as Set<string> | null; // null = all eligible

  try {
    const parsed = typeof menu_items === 'string' ? JSON.parse(menu_items) : menu_items;
    const ids = Array.isArray(parsed) ? parsed.map((x) => x?.id).filter(Boolean) : [];
    return new Set(ids);
  } catch {
    return new Set<string>(); // nothing eligible if invalid
  }
}

export function calculateTotals(
  orders: Order[],
  diningOption: DiningOption,
  store: Store | null,
  discount: Discount | null,
  voucher: Voucher | null,
) {
  const vatRate = Number(store?.vatTaxPercentage || 0) / 100;
  const scRate = Number(store?.serviceChargePercentage || 0) / 100;
  const discountRate = Number(discount?.rate || 0) / 100;
  const voucherRate = voucher?.rateType === 'FIXED' ? voucher?.rate : Number(voucher?.rate || 0) / 100;

  const totalBeverageOrderAmount = calculateTotalByCategory(orders, 'BEVERAGE');
  const totalFoodOrderAmount = calculateTotalByCategory(orders, 'FOOD');
  const totalBeansOrderAmount = calculateTotalByCategory(orders, 'BEANS');
  const totalBakeryOrderAmount = calculateTotalByCategory(orders, 'BAKERY');
  const totalLiquorOrderAmount = calculateTotalByCategory(orders, 'LIQUOR');
  const totalAddOnsOrderAmount = (orders || []).reduce((acc, order) => {
    if (!order.addOn) return acc;
    const addOnPrice = Number(order.addOn.price);
    return acc + order.qty * addOnPrice;
  }, 0);

  // with service charge
  const totalBeverageOrderWithServiceChargeAmount = calculateTotalWithServiceCharge(orders, 'BEVERAGE');
  const totalFoodOrderWithServiceChargeAmount = calculateTotalWithServiceCharge(orders, 'FOOD');
  const totalBakeryOrderWithServiceChargeAmount = calculateTotalWithServiceCharge(orders, 'BAKERY');
  const totalLiquorOrderWithServiceChargeAmount = calculateTotalWithServiceCharge(orders, 'LIQUOR');
  const totalAddOnsWithServiceChargeAmount = (orders || []).reduce((acc, order) => {
    if (!order.addOn || order.addOn.hasServiceCharge === false) return acc;
    const addOnPrice = Number(order.addOn.price);
    return acc + order.qty * addOnPrice;
  }, 0);
  // end with service charge

  const quantity = (orders || []).reduce((acc, order) => {
    return acc + order.qty;
  }, 0);

  const totalOrderAmount =
    totalBeverageOrderAmount +
    totalFoodOrderAmount +
    totalAddOnsOrderAmount +
    totalBeansOrderAmount +
    totalBakeryOrderAmount +
    totalLiquorOrderAmount;

  const totalWithServiceChargeAmount =
    totalBeverageOrderWithServiceChargeAmount +
    totalFoodOrderWithServiceChargeAmount +
    totalBakeryOrderWithServiceChargeAmount +
    totalLiquorOrderWithServiceChargeAmount +
    totalAddOnsWithServiceChargeAmount;

  let voucherDiscounted = 0;
  if (voucher?.fAndBRedemption && voucher?.fAndBRedemption?.offer_type) {
    const offerType = voucher.fAndBRedemption.offer_type;
    const eligibleIds = getEligibleMenuItemIdSet(voucher.fAndBRedemption.menu_items);
    const eligibleTotal = calculateEligibleTotal(orders, eligibleIds);

    if (offerType === 'FIXED_AMOUNT' || offerType === 'BUNDLE_PRICE') {
      const fixed = Math.max(0, Number(voucher.fAndBRedemption.offer_value || 0));
      voucherDiscounted = Math.min(fixed, eligibleTotal);
    } else if (offerType === 'PERCENTAGE_OFF') {
      const rate = Math.max(0, Math.min(1, Number(voucher.fAndBRedemption.offer_value || 0) / 100));
      voucherDiscounted = Math.min(Number((eligibleTotal * rate).toFixed(2)), eligibleTotal);
    } else if (offerType === 'BUY_1_GET_1') {
      voucherDiscounted = calculateBuyOneGetOneDiscount(orders, eligibleIds!);
    } else if (offerType === 'FREE_ITEM') {
      const offerValue = JSON.parse(voucher.fAndBRedemption.offer_value);
      const eligibleIds = getEligibleMenuItemIdSet([offerValue]);
      voucherDiscounted = calculateFreeAnyEligibleItemDiscount(orders, eligibleIds);
    }

    voucherDiscounted = Number(voucherDiscounted.toFixed(2));
  } else if (voucher) {
    // fallback: normal voucher applies to everything (if you still want this behavior)
    voucherDiscounted = -Number((totalOrderAmount * voucherRate).toFixed(2));
  }

  const withTogoCharge = totalFoodOrderAmount + totalAddOnsOrderAmount;
  const togoCharge = diningOption === 'TO_GO' && withTogoCharge > 0 ? Number(store?.togoCharge) : 0;

  const subtotal = totalOrderAmount + voucherDiscounted;
  let vatNet = Number((subtotal / vatRate).toFixed(2));
  let vat = Number((vatNet * 0.12).toFixed(2));

  const discountType = (discount?.type || '').toLowerCase();
  const isSpecial = !!discount?.isSpecial;
  const isAddVat = discountType.includes('uniformed') || discountType.includes('national');

  const discounted = Number((discountRate * -vatNet).toFixed(2));
  if (isSpecial) {
    vatNet = Number((vatNet + discounted).toFixed(2));
    if (!isAddVat) {
      vat = -vat;
    }
  }

  let serviceCharge = 0;
  if (diningOption === 'FOR_HERE' && store?.serviceCharge && totalWithServiceChargeAmount > 0) {
    serviceCharge = Number((vatNet * scRate).toFixed(2));
  }

  let totalAmount = vatNet + vat + serviceCharge + togoCharge;
  if (isSpecial && !isAddVat) {
    totalAmount -= vat;
  }

  return {
    quantity,
    subtotal,
    vatNet,
    vat,
    discounted,
    voucherDiscounted,
    serviceCharge,
    togoCharge,
    totalAmount: Number(totalAmount.toFixed(2)),
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

export function getLast10Digits(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const last10 = digits.slice(-10);

  // Validate: must be exactly 10 digits and start with '9'
  if (/^9\d{9}$/.test(last10)) {
    return last10;
  }

  return null; // invalid phone number
}

export function tryParseJSON(str: string) {
  if (typeof str !== 'string') return str;

  try {
    const parsed = JSON.parse(str);
    return parsed;
  } catch {
    return [];
  }
}
