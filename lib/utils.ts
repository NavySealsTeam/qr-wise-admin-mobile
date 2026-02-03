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
  OfferType,
  Order,
  Promotion,
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

function calculateBuyOneGetOneDiscount(orders: Order[] | TempOrder[], promos: Promotion[], eligibleIds: Set<string>) {
  let sameItemFree: number | null = null;
  let cheapestEligible: number | null = null;

  // ---- A) SAME-ITEM B1G1 ----
  orders.forEach((order) => {
    const menuId = order.menu?.id;
    if (!menuId) return;

    const eligible = eligibleIds === null ? true : eligibleIds.has(menuId);
    if (!eligible) return;

    const qty = Number(order.qty || 0);
    if (qty <= 0) return;

    const unitPrice = getFinalUnitPrice(order, promos);

    // A) same-item B1G1 candidate
    if (qty >= 2) {
      sameItemFree = sameItemFree === null ? unitPrice : Math.min(sameItemFree, unitPrice);
    }

    // B) cross-item candidate (any eligible)
    cheapestEligible = cheapestEligible === null ? unitPrice : Math.min(cheapestEligible, unitPrice);
  });

  // must have at least 2 eligible units total
  const totalEligibleQty = orders.reduce((sum, o) => {
    const id = o.menu?.id;
    if (!id) return sum;

    const eligible = eligibleIds === null ? true : eligibleIds.has(id);
    if (!eligible) return sum;

    return sum + Number(o.qty || 0);
  }, 0);

  if (totalEligibleQty < 2) return 0;

  // choose ONE free item only (cheapest valid)
  const freePriceCandidates = [sameItemFree, cheapestEligible].filter((v) => v !== null && typeof v === 'number');

  if (freePriceCandidates.length === 0) return 0;

  // Math.min only called if array is non-empty and contains only numbers
  const minCandidate = Math.min(...freePriceCandidates);
  return Number(minCandidate.toFixed(2));
}

function calculateFreeAnyEligibleItemDiscount(
  orders: Order[] | TempOrder[],
  promos: Promotion[],
  eligibleIds: Set<string> | null,
) {
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

    const unitRaw = menuPrice + selectionPrice + addOnPrice;

    // if you want voucher to respect promos per-item:
    const promo = resolvePromotion(menuId, unitRaw, promos);
    const unitFinal = Number(promo.finalPrice || 0);

    // if qty is 3, you still only get 1 free, so just push one unit price
    eligibleUnitPrices.push(unitFinal);
  }

  if (eligibleUnitPrices.length === 0) return 0;

  // ✅ cheapest eligible unit becomes free
  const cheapest = Math.min(...eligibleUnitPrices);

  // safety: discount cannot be negative
  return Number(Math.max(0, cheapest).toFixed(2));
}

function calculateEligibleTotal(orders: Order[] | TempOrder[], promos: Promotion[], eligibleIds: Set<string> | null) {
  return orders.reduce((acc, order) => {
    const menuId = order.menu?.id;
    if (!menuId) return acc;

    const eligible = eligibleIds === null ? true : eligibleIds.has(menuId);
    if (!eligible) return acc;

    return acc + getOrderLineTotal(order, promos);
  }, 0);
}

function getFinalUnitPrice(order: Order | TempOrder, promos: Promotion[]) {
  const options = order.options || [];
  const addOns = order.addOns || [];
  const menuPrice = Number(order.menu?.price) || 0;

  const selectionPrice = options.reduce((s, o) => s + Number(o.selectionPrice || 0), 0);
  const addOnPrice = addOns.reduce((s, a) => s + Number(a.price || 0), 0);

  const unitRaw = menuPrice + selectionPrice + addOnPrice;
  const qty = Number(order.qty || 1);

  const lineTotal = unitRaw * qty;
  const promo = resolvePromotion(order.menu!.id, lineTotal, promos);

  return promo.finalPrice / qty;
}

function getOrderLineTotal(order: Order | TempOrder, promos: Promotion[]) {
  const options = order.options || [];
  const addOns = order.addOns || [];
  const menuPrice = Number(order.menu?.price) || 0;

  const selectionPrice = options.reduce((sum, opt) => sum + Number(opt.selectionPrice || 0), 0);
  const addOnPrice = addOns.reduce((sum, addOn) => sum + Number(addOn.price || 0), 0);

  const rawTotal = order.qty * (menuPrice + selectionPrice + addOnPrice);

  // if you want voucher to respect promos:
  const promo = resolvePromotion(order.menu?.id!, rawTotal, promos);
  return promo.finalPrice;
}

function getEligibleMenuItemIdSet(menu_items: unknown) {
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
  orders: Order[] | TempOrder[],
  diningOption: DiningOption,
  store: Store | null,
  discount: Discount | null,
  voucher: Voucher | null,
  promos: Promotion[] = [],
) {
  const totalBeverageOrderAmount = calculateTotalByCategory(orders, 'BEVERAGE');
  const totalFoodOrderAmount = calculateTotalByCategory(orders, 'FOOD');
  const totalBeansOrderAmount = calculateTotalByCategory(orders, 'BEANS');
  const totalBakeryOrderAmount = calculateTotalByCategory(orders, 'BAKERY');
  const totalLiquorOrderAmount = calculateTotalByCategory(orders, 'LIQUOR');
  const totalAddOnsOrderAmount = orders.reduce((acc, order) => {
    if (!order.addOn) return acc;
    const addOnPrice = Number(order.addOn.price);
    return acc + order.qty * addOnPrice;
  }, 0);

  // with service charge
  const totalBeverageOrderWithServiceChargeAmount = calculateTotalWithServiceCharge(orders, 'BEVERAGE');
  const totalFoodOrderWithServiceChargeAmount = calculateTotalWithServiceCharge(orders, 'FOOD');
  const totalBakeryOrderWithServiceChargeAmount = calculateTotalWithServiceCharge(orders, 'BAKERY');
  const totalLiquorOrderWithServiceChargeAmount = calculateTotalWithServiceCharge(orders, 'LIQUOR');
  const totalAddOnsWithServiceChargeAmount = orders.reduce((acc, order) => {
    if (!order.addOn || order.addOn.hasServiceCharge === false) return acc;
    const addOnPrice = Number(order.addOn.price);
    return acc + order.qty * addOnPrice;
  }, 0);
  // end with service charge

  const quantity = orders.reduce((acc, order) => {
    return acc + order.qty;
  }, 0);

  const totalOrderAmount =
    totalBeverageOrderAmount +
    totalFoodOrderAmount +
    totalAddOnsOrderAmount +
    totalBeansOrderAmount +
    totalBakeryOrderAmount +
    totalLiquorOrderAmount;
  const subtotal = Number((totalOrderAmount / (Number(store?.vatTaxPercentage) / 100)).toFixed(2));
  const vat = discount && discount.isSpecial ? 0 : totalOrderAmount - subtotal;
  const discounted = Number(
    (discount ? (discount.isSpecial ? subtotal : subtotal + vat) * (Number(discount?.rate) / 100) : 0).toFixed(2),
  );

  let voucherDiscounted = 0;
  if (voucher?.fAndBRedemption && voucher?.fAndBRedemption?.offer_type) {
    const offerType = voucher.fAndBRedemption.offer_type as OfferType;
    const eligibleIds = getEligibleMenuItemIdSet(voucher.fAndBRedemption.menu_items);
    const eligibleTotal = calculateEligibleTotal(orders, promos, eligibleIds);

    if (offerType === 'FIXED_AMOUNT' || offerType === 'BUNDLE_PRICE') {
      const fixed = Math.max(0, Number(voucher.fAndBRedemption.offer_value || 0));
      voucherDiscounted = Math.min(fixed, eligibleTotal);
    } else if (offerType === 'PERCENTAGE_OFF') {
      const rate = Math.max(0, Math.min(1, Number(voucher.fAndBRedemption.offer_value || 0) / 100));
      voucherDiscounted = Math.min(Number((eligibleTotal * rate).toFixed(2)), eligibleTotal);
    } else if (offerType === 'BUY_1_GET_1') {
      voucherDiscounted = calculateBuyOneGetOneDiscount(orders, promos, eligibleIds!);
    } else if (offerType === 'FREE_ITEM') {
      const offerValue = JSON.parse(voucher.fAndBRedemption.offer_value);
      const eligibleIds = getEligibleMenuItemIdSet([offerValue]);
      voucherDiscounted = calculateFreeAnyEligibleItemDiscount(orders, promos, eligibleIds);
    }

    voucherDiscounted = Number(voucherDiscounted.toFixed(2));
  } else if (voucher) {
    // fallback: normal voucher applies to everything (if you still want this behavior)
    voucherDiscounted = Number(((subtotal + vat) * (voucher.rate / 100)).toFixed(2));
  }

  const totalWithServiceChargeAmount =
    totalBeverageOrderWithServiceChargeAmount +
    totalFoodOrderWithServiceChargeAmount +
    totalBakeryOrderWithServiceChargeAmount +
    totalLiquorOrderWithServiceChargeAmount +
    totalAddOnsWithServiceChargeAmount;
  const withTogoCharge = totalFoodOrderAmount + totalAddOnsOrderAmount;
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
    subtotal: discount?.isSpecial ? totalOrderAmount : subtotal,
    vat: discount?.isSpecial ? -(totalOrderAmount - subtotal) : vat,
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

export function resolvePromotion(
  menuItemId: string = '',
  itemPrice: number,
  promos: Promotion[],
): { promo: Promotion; finalPrice: number } {
  const promo = promos
    .filter(
      (p) =>
        p.isActive && (p.appliesTo === 'ALL' || (p.appliesTo === 'SELECTED' && p.menuItemIds.includes(menuItemId))),
    )
    .sort((a, b) => {
      const aValue = a.discountType === 'PERCENTAGE' ? itemPrice * (a.discountValue / 100) : a.discountValue;
      const bValue = b.discountType === 'PERCENTAGE' ? itemPrice * (b.discountValue / 100) : b.discountValue;
      return bValue - aValue;
    })?.[0];

  return {
    promo,
    finalPrice:
      promo?.discountType === 'PERCENTAGE'
        ? Number((itemPrice - itemPrice * (promo.discountValue / 100)).toFixed(2))
        : promo
          ? Number((itemPrice - promo.discountValue).toFixed(2))
          : itemPrice,
  };
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
