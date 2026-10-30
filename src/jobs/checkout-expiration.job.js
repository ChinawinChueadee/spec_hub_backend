import { config } from "../configs/index.js";

import {
  expireStripeCheckoutSession,
  getStripeCheckoutSession,
} from "../providers/stripe.provider.js";

import {
  expireUnpaidCheckout,
  findExpiredAwaitingPaymentCheckouts,
  findOldestAwaitingPaymentCheckout,
  findPaymentByCheckoutId,
} from "../services/payment.service.js";

let jobStarted = false;
let cleanupTimer = null;
let cleanupDueAt = null;
let cleanupRunning = false;

const getReservationDurationMs = () =>
  config.checkout_reservation_minutes * 60 * 1000;

const getRetryDelayMs = () => config.checkout_cleanup_interval_seconds * 1000;

const clearCleanupTimer = () => {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
  }

  cleanupTimer = null;
  cleanupDueAt = null;
};

/*
 * Wake up once at dueAt instead of polling.
 * The database is left alone while nothing is waiting,
 * so a serverless database (Neon) can scale to zero.
 */
const scheduleCleanupAt = (dueAt) => {
  if (!jobStarted) {
    return;
  }

  if (cleanupDueAt !== null && cleanupDueAt <= dueAt) {
    return;
  }

  clearCleanupTimer();

  cleanupDueAt = dueAt;
  cleanupTimer = setTimeout(
    () => {
      cleanupTimer = null;
      cleanupDueAt = null;
      void runCleanupCycle();
    },
    Math.max(dueAt - Date.now(), 0),
  );

  /*
   * The timer itself should not prevent Node
   * from shutting down.
   */
  cleanupTimer.unref();
};

const scheduleNextCleanup = async () => {
  const oldestCheckout = await findOldestAwaitingPaymentCheckout();

  if (!oldestCheckout) {
    return;
  }

  const expiresAt =
    new Date(oldestCheckout.createdAt).getTime() + getReservationDurationMs();

  /*
   * A Checkout that is already past its deadline failed
   * to expire this cycle. Retry later instead of looping.
   */
  scheduleCleanupAt(Math.max(expiresAt, Date.now() + getRetryDelayMs()));
};

const runCleanupCycle = async () => {
  try {
    await cleanupExpiredCheckouts();
    await scheduleNextCleanup();
  } catch (error) {
    console.error("Checkout cleanup failed:", error);
    scheduleCleanupAt(Date.now() + getRetryDelayMs());
  }
};

const processExpiredCheckout = async (checkout) => {
  const payment = await findPaymentByCheckoutId(checkout.id);

  /*
   * Never expire a Checkout whose Payment
   * is already PAID or RELEASED.
   */
  if (payment && payment.status !== "PENDING") {
    console.warn(
      `Skipped Checkout ${checkout.id}: ` +
        `Payment status is ${payment.status}.`,
    );

    return;
  }

  if (payment?.providerRef) {
    const session = await getStripeCheckoutSession(payment.providerRef);

    /*
     * The Buyer may have completed payment while
     * the expiration job was starting.
     */
    if (session.status === "complete" || session.payment_status === "paid") {
      console.warn(
        `Skipped Checkout ${checkout.id}: ` +
          "Stripe Session is complete or paid.",
      );

      return;
    }

    if (session.status === "open") {
      const expiredSession = await expireStripeCheckoutSession(
        payment.providerRef,
      );

      if (expiredSession.status !== "expired") {
        return;
      }
    } else if (session.status !== "expired") {
      return;
    }
  }

  const expired = await expireUnpaidCheckout({
    checkoutId: checkout.id,
    paymentId: payment?.id ?? null,
  });

  if (expired) {
    console.log(
      `Expired Checkout ${checkout.id}; ` +
        "Orders cancelled and Listings released.",
    );
  }
};

export const cleanupExpiredCheckouts = async () => {
  if (cleanupRunning) {
    return;
  }

  cleanupRunning = true;

  try {
    const expirationCutoff = new Date(Date.now() - getReservationDurationMs());

    const expiredCheckouts =
      await findExpiredAwaitingPaymentCheckouts(expirationCutoff);

    for (const checkout of expiredCheckouts) {
      try {
        await processExpiredCheckout(checkout);
      } catch (error) {
        /*
         * Leave this Checkout unchanged.
         * The next cleanup cycle can retry it.
         */
        console.error(`Failed to expire Checkout ${checkout.id}:`, error);
      }
    }
  } finally {
    cleanupRunning = false;
  }
};

// Call after a Checkout is created so its expiration is scheduled.
export const scheduleCheckoutExpiration = (createdAt) => {
  scheduleCleanupAt(new Date(createdAt).getTime() + getReservationDurationMs());
};

export const startCheckoutExpirationJob = () => {
  if (jobStarted) {
    return;
  }

  jobStarted = true;

  console.log(
    "Checkout expiration job started: " +
      `${config.checkout_reservation_minutes} minute reservation, ` +
      `${config.checkout_cleanup_interval_seconds} second retry delay.`,
  );

  /*
   * Clean existing abandoned Checkouts immediately
   * when the backend starts, then schedule the next one.
   */
  void runCleanupCycle();
};

export const stopCheckoutExpirationJob = () => {
  if (!jobStarted) {
    return;
  }

  jobStarted = false;
  clearCleanupTimer();

  console.log("Checkout expiration job stopped.");
};
