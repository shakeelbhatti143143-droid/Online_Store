'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  CreditCard,
  Truck,
  User,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { formatPrice, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type CheckoutStep = 1 | 2 | 3 | 4;

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    discountAmount,
    taxAmount,
    appliedCoupon,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 1: Customer Information
  const [email, setEmail] = useState(
    user?.email || 'alexandra.vance@luxury.com'
  );
  const [fullName, setFullName] = useState(
    user?.fullName || 'Alexandra Vance'
  );
  const [phone, setPhone] = useState(
    user?.phone || '+1 (555) 234-5678'
  );

  // Step 2: Shipping Address
  const [addressLine1, setAddressLine1] = useState('740 Park Avenue');
  const [addressLine2, setAddressLine2] = useState('Penthouse 14B');
  const [city, setCity] = useState('New York');
  const [state, setState] = useState('NY');
  const [postalCode, setPostalCode] = useState('10021');
  const [country, setCountry] = useState('United States');

  // Step 3: Delivery Method
  const [deliveryMethod, setDeliveryMethod] = useState<
    'standard' | 'express' | 'priority'
  >('express');

  // Step 4: Payment Details
  const [paymentMethod, setPaymentMethod] = useState<
    'card' | 'apple_pay' | 'paypal' | 'cod'
  >('card');
  const [cardNumber, setCardNumber] = useState(
    '4242 •••• •••• 4242'
  );
  const [cardHolder, setCardHolder] = useState(
    user?.fullName || 'ALEXANDRA VANCE'
  );
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 min-h-[70vh] flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">
            Your bag is empty
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Add items to your bag before proceeding to the checkout concierge.
          </p>
          <Link href="/shop" className="mt-6 inline-block">
            <Button variant="gold" size="md">
              Return to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Delivery method cost modifier
  const deliveryCosts = {
    standard: 0,
    express: 15,
    priority: 25,
  };
  const finalShipping = deliveryCosts[deliveryMethod];
  const finalTotal = Math.max(
    0,
    subtotal - discountAmount + finalShipping + taxAmount
  );

  // Form Validation
  const canProceedStep1 = Boolean(
    email.trim() && fullName.trim() && phone.trim()
  );
  const canProceedStep2 = Boolean(
    addressLine1.trim() &&
      city.trim() &&
      state.trim() &&
      postalCode.trim()
  );

  const handleNext = () => {
    if (currentStep === 1 && !canProceedStep1) {
      showToast({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please complete all customer details.',
      });
      return;
    }
    if (currentStep === 2 && !canProceedStep2) {
      showToast({
        type: 'warning',
        title: 'Incomplete Address',
        message: 'Please fill in required address fields.',
      });
      return;
    }
    setCurrentStep((prev) => Math.min(4, prev + 1) as CheckoutStep);
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      const createdOrder = await storeDb.createOrder({
        customerEmail: email,
        customerName: fullName,
        customerPhone: phone,
        paymentMethod,
        deliveryMethod,
        couponCode: appliedCoupon?.code,
        shippingAddress: {
          fullName,
          email,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country,
        },
        items: items.map((item) => ({
          productId: item.product.id,
          variantId: item.selectedVariant?.id,
          quantity: item.quantity,
        })),
      });

      try {
        sessionStorage.setItem(
          'luxe_last_order',
          JSON.stringify(createdOrder)
        );
      } catch {
        // ignore
      }

      // Clear local cart
      clearCart();

      // Show success toast
      showToast({
        type: 'success',
        title: 'Order Confirmed!',
        message: `Order ${createdOrder.orderNumber} successfully processed.`,
      });

      // Redirect to confirmation receipt
      router.push(
        `/order-success?orderNumber=${createdOrder.orderNumber}`
      );
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Payment Error',
        message:
          err instanceof Error
            ? err.message
            : 'Could not process transaction. Please try again.',
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-28 pb-24 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Step Indicator Header */}
        <div className="mb-10 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-widest mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Encrypted Multi-Step Checkout</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
            Secure Payment & Delivery
          </h1>

          {/* Stepper Wizard Bar */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-6 max-w-2xl">
            {[
              { num: 1, title: 'Customer', icon: User },
              { num: 2, title: 'Shipping', icon: MapPin },
              { num: 3, title: 'Delivery', icon: Truck },
              { num: 4, title: 'Payment', icon: CreditCard },
            ].map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <button
                  key={step.num}
                  disabled={step.num > currentStep}
                  onClick={() =>
                    setCurrentStep(step.num as CheckoutStep)
                  }
                  className={cn(
                    'flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all',
                    isCurrent
                      ? 'bg-amber-50/80 border-amber-600 text-amber-900 shadow-xs'
                      : isDone
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-60 cursor-not-allowed'
                  )}
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      isCurrent
                        ? 'bg-amber-600 text-white'
                        : isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                    )}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <span className="text-xs font-semibold truncate hidden sm:inline">
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Main Wizard Forms (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">

              {/* STEP 1: CUSTOMER DETAILS */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <User className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-bold text-slate-900">
                      Step 1 — Customer Identification
                    </h2>
                  </div>

                  <Input
                    label="Full Legal Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alexandra Vance"
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="VIP Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. alexandra@luxury.com"
                      required
                    />
                    <Input
                      label="Contact Telephone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      required
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    Order confirmation and courier live dispatch notifications will be delivered to this email.
                  </p>
                </motion.div>
              )}

              {/* STEP 2: SHIPPING ADDRESS */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-bold text-slate-900">
                      Step 2 — Shipping Destination
                    </h2>
                  </div>

                  <Input
                    label="Street Address"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="e.g. 740 Park Avenue"
                    required
                  />

                  <Input
                    label="Apartment, Suite, Unit, Penthouse (Optional)"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="e.g. Penthouse 14B"
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <Input
                      label="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="New York"
                      required
                    />
                    <Input
                      label="State / Region"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="NY"
                      required
                    />
                    <Input
                      label="Postal Code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="10021"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-600"
                    >
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="France">France</option>
                      <option value="Germany">Germany</option>
                      <option value="Japan">Japan</option>
                      <option value="United Arab Emirates">
                        United Arab Emirates
                      </option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: DELIVERY METHOD */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Truck className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-bold text-slate-900">
                      Step 3 — Delivery Concierge
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        id: 'standard',
                        title: 'Standard Insured Delivery',
                        time: '3–5 Business Days',
                        price: 0,
                        desc: 'Full transit insurance with tracked signature handover.',
                      },
                      {
                        id: 'express',
                        title: 'Global Express Air Priority',
                        time: '1–2 Business Days',
                        price: 15,
                        desc: 'Expedited air courier with direct customs pre-clearance.',
                      },
                      {
                        id: 'priority',
                        title: 'White-Glove VIP Dedicated Courier',
                        time: 'Next Day Morning',
                        price: 25,
                        desc: 'Direct armored courier escort and unboxing appointment.',
                      },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setDeliveryMethod(option.id as any)
                        }
                        className={cn(
                          'w-full p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-4',
                          deliveryMethod === option.id
                            ? 'bg-amber-50/80 border-amber-600 shadow-sm ring-1 ring-amber-600/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {option.title}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-medium">
                              {option.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {option.desc}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-900 shrink-0">
                          {option.price === 0
                            ? 'FREE'
                            : formatPrice(option.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 4: PAYMENT SELECTION & CARD FLIP */}
              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-bold text-slate-900">
                      Step 4 — Payment Concierge
                    </h2>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'card', label: 'Credit Card' },
                      { id: 'apple_pay', label: 'Apple Pay' },
                      { id: 'paypal', label: 'PayPal' },
                      { id: 'cod', label: 'Vault COD' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setPaymentMethod(m.id as any)
                        }
                        className={cn(
                          'py-2.5 px-3 rounded-xl border text-xs font-bold transition-all',
                          paymentMethod === m.id
                            ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-xs ring-1 ring-amber-600/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50'
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === 'card' ? (
                    <div className="space-y-5">
                      {/* Interactive Obsidian Credit Card Mockup */}
                      <div className="relative aspect-[1.58/1] w-full max-w-sm mx-auto rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-zinc-900 p-6 border border-amber-500/40 shadow-xl flex flex-col justify-between overflow-hidden text-white">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="flex justify-between items-center z-10">
                          <span className="text-xs font-mono font-bold tracking-widest text-amber-400">
                            LUXE BLACK TITANIUM
                          </span>
                          <Sparkles className="w-5 h-5 text-amber-400" />
                        </div>

                        <div className="z-10">
                          <p className="font-mono text-base sm:text-lg tracking-widest text-white font-bold">
                            {cardNumber || '•••• •••• •••• ••••'}
                          </p>
                        </div>

                        <div className="flex justify-between items-end z-10 text-[11px] font-mono">
                          <div>
                            <p className="text-[9px] uppercase tracking-wider text-slate-400">
                              Cardholder
                            </p>
                            <p className="font-bold text-white uppercase">
                              {cardHolder || 'CARDHOLDER'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-wider text-slate-400">
                              Expires
                            </p>
                            <p className="font-bold text-white">
                              {cardExpiry || 'MM/YY'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Inputs */}
                      <div className="space-y-3">
                        <Input
                          label="Card Number"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Expiration Date"
                            value={cardExpiry}
                            onChange={(e) =>
                              setCardExpiry(e.target.value)
                            }
                            placeholder="MM/YY"
                          />
                          <Input
                            label="Security CVC"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            placeholder="CVC"
                          />
                        </div>

                        <Input
                          label="Cardholder Name"
                          value={cardHolder}
                          onChange={(e) =>
                            setCardHolder(e.target.value)
                          }
                          placeholder="Name on card"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                      <p className="text-sm font-bold text-slate-900">
                        {paymentMethod === 'apple_pay' &&
                          'Apple Pay One-Touch Express'}
                        {paymentMethod === 'paypal' &&
                          'PayPal Secure Wallet'}
                        {paymentMethod === 'cod' &&
                          'Pay on Delivery Inspection'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {paymentMethod === 'apple_pay' &&
                          'Authenticate using FaceID or TouchID upon completing order.'}
                        {paymentMethod === 'paypal' &&
                          'You will be redirected securely to complete authorization.'}
                        {paymentMethod === 'cod' &&
                          'Present payment to courier after inspecting seals and authenticity certificate.'}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Navigation Controls */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() =>
                      setCurrentStep(
                        (prev) => (prev - 1) as CheckoutStep
                      )
                    }
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Previous Step
                  </Button>
                ) : (
                  <Link href="/cart">
                    <Button
                      variant="ghost"
                      size="md"
                      leftIcon={<ArrowLeft className="w-4 h-4" />}
                    >
                      Return to Bag
                    </Button>
                  </Link>
                )}

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    variant="gold"
                    size="md"
                    onClick={handleNext}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue to{' '}
                    {currentStep === 1
                      ? 'Shipping'
                      : currentStep === 2
                        ? 'Delivery'
                        : 'Payment'}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="gold"
                    size="lg"
                    isLoading={isProcessing}
                    onClick={handlePlaceOrder}
                    className="shadow-md shadow-amber-600/20 font-bold"
                    rightIcon={<ShieldCheck className="w-5 h-5" />}
                  >
                    Authorize & Complete Order ({formatPrice(finalTotal)})
                  </Button>
                )}
              </div>

            </div>
          </div>

          {/* Right Summary Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-slate-50/80 p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Order Line Items ({items.length})
              </h3>

              <div className="max-h-72 overflow-y-auto space-y-3 divide-y divide-slate-200/60 pr-1 scrollbar-thin">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="pt-3 first:pt-0 flex items-center gap-3.5"
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                      />
                      <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.product.title}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {item.selectedVariant?.name ||
                          item.product.brandName}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 shrink-0">
                      {formatPrice(item.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-200/60 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>
                      Privilege Coupon ({appliedCoupon?.code})
                    </span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping ({deliveryMethod.toUpperCase()})</span>
                  <span className="font-semibold text-slate-900">
                    {finalShipping === 0
                      ? 'FREE'
                      : formatPrice(finalShipping)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span className="font-semibold text-slate-900">
                    {formatPrice(taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-200">
                  <span>Final Total</span>
                  <span className="text-xl text-amber-800 font-display font-bold">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>

              <div className="pt-2 p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fully Insured Worldwide Dispatch</span>
                </div>
                <p className="text-slate-500">
                  Serial numbers registered to purchaser ledger upon shipment release.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
