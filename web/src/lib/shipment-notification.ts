import { prisma } from "@/src/lib/prisma";
import { normalizeMobilePhone } from "@/src/lib/phone-verification";
import { validateShipment } from "@/src/lib/delivery-carriers";
import { AlimtalkError, getAlimtalkResult, sendAlimtalk, shipmentMessage, SHIPMENT_TEMPLATE_CODE } from "@/src/lib/sens-alimtalk";

export async function dispatchShipmentNotification(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { shipmentNotification: true } });
  if (order?.status !== "SHIPPED" || order.paymentStatus !== "PAID" || !order.shipmentNotification) return;
  const phone = normalizeMobilePhone(order.phone);
  if (!phone) return;
  const shipment = validateShipment(order.carrier, order.trackingNumber);
  const notice = order.shipmentNotification;
  if (notice.carrier !== shipment.carrier || notice.trackingNumber !== shipment.trackingNumber) return;

  const claimed = await prisma.shipmentNotification.updateMany({
    where: {
      id: notice.id, status: { in: ["READY", "FAILED"] },
      carrier: shipment.carrier, trackingNumber: shipment.trackingNumber,
      order: { is: { status: "SHIPPED", paymentStatus: "PAID", carrier: shipment.carrier, trackingNumber: shipment.trackingNumber } },
    },
    data: { status: "SENDING", errorCode: null, attempts: { increment: 1 }, requestId: null, messageId: null },
  });
  if (claimed.count !== 1) return;
  try {
    const result = await sendAlimtalk(SHIPMENT_TEMPLATE_CODE, shipmentMessage(phone, shipment.carrier, shipment.trackingNumber, shipment.trackingUrl));
    await prisma.shipmentNotification.update({ where: { id: notice.id }, data: { ...result, status: "ACCEPTED", acceptedAt: new Date() } });
  } catch (error) {
    // After a crash/timeout the request may have been accepted. Require console
    // reconciliation instead of automatic retries that could duplicate notices.
    const uncertain = !(error instanceof AlimtalkError) || error.uncertain;
    const code = error instanceof AlimtalkError ? error.code : "RESULT_UNKNOWN";
    await prisma.shipmentNotification.update({ where: { id: notice.id }, data: { status: uncertain ? "UNKNOWN" : "FAILED", errorCode: code } });
    console.error("[shipment-alimtalk] request failed", { code });
  }
}

export async function refreshShipmentNotifications() {
  // A process can stop between claiming and persisting the external request.
  await prisma.shipmentNotification.updateMany({
    where: { status: "SENDING", updatedAt: { lt: new Date(Date.now() - 120_000) } },
    data: { status: "UNKNOWN", errorCode: "PROCESS_INTERRUPTED" },
  });
  const pending = await prisma.shipmentNotification.findMany({
    where: { status: "ACCEPTED", messageId: { not: null } }, orderBy: { updatedAt: "asc" }, take: 10,
  });
  await Promise.all(pending.map(async (notice) => {
    try {
      const result = await getAlimtalkResult(notice.messageId!);
      await prisma.shipmentNotification.updateMany({
        where: { id: notice.id, status: "ACCEPTED", messageId: notice.messageId },
        data: { status: result.status, errorCode: result.code, ...(result.status === "SENT" ? { deliveredAt: new Date() } : {}) },
      });
    } catch {
      // Keep the accepted request; a refresh error must never cause a resend.
    }
  }));
}
