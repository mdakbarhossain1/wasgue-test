"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "context/AuthContext";
// import { useAuth } from '@/context/AuthContext';

export default function OrdersPage() {
  const { user, orders, isLoggedIn, fetchOrders } = useAuth();
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }

    // Fetch fresh orders when page loads
    fetchOrders();
  }, [isLoggedIn, router, fetchOrders]);

  if (!isLoggedIn || !user) {
    return null; // Will redirect
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600 bg-green-50";
      case "shipped":
        return "text-blue-600 bg-blue-50";
      case "processing":
        return "text-yellow-600 bg-yellow-50";
      case "pending":
        return "text-gray-600 bg-gray-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Bezorgd";
      case "shipped":
        return "Verzonden";
      case "processing":
        return "In behandeling";
      case "pending":
        return "In afwachting";
      case "cancelled":
        return "Geannuleerd";
      default:
        return status;
    }
  };

  const toggleOrderDetails = (orderId: string) => {
    setSelectedOrder(selectedOrder === orderId ? null : orderId);
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account"
            className="flex items-center text-[#814E1E] hover:text-[#D6AD61] transition-colors mb-4">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Terug naar mijn account</span>
          </Link>
          <h1 className="text-3xl font-bold text-[#814E1E] mb-2">
            Mijn bestellingen
          </h1>
          <p className="text-gray-600">
            Bekijk de status en details van al je bestellingen
          </p>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#D6AD61] transition-colors">
                  {/* Order Header */}
                  <button
                    className="w-full"
                    onClick={() => toggleOrderDetails(order.id)}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-lg text-[#814E1E]">
                          Bestelling {order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.date).toLocaleDateString("nl-NL")}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            order.status
                          )}`}>
                          {getStatusText(order.status)}
                        </span>
                        <p className="text-sm font-bold text-[#814E1E] mt-1">
                          €{order.total.toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {order.items.slice(0, 4).map((item, index) => (
                        <div
                          key={`${order.id}-${item.id}-${index}`}
                          className="flex items-center space-x-2">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain bg-[#F8F6F0] rounded"
                          />
                          <span className="text-xs text-gray-600 hidden sm:inline">
                            {item.quantity}x
                          </span>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{order.items.length - 4} meer
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Order Details (Expanded) */}
                  {selectedOrder === order.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-[#814E1E] mb-3">
                        Bestelgegevens
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">
                            Bezorgadres
                          </h5>
                          <p className="text-sm text-gray-600">
                            {order.shippingAddress.name}
                            <br />
                            {order.shippingAddress.street}
                            <br />
                            {order.shippingAddress.postalCode}{" "}
                            {order.shippingAddress.city}
                            <br />
                            {order.shippingAddress.country}
                          </p>
                        </div>
                        {order.trackingCode && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">
                              Track & Trace
                            </h5>
                            <p className="text-sm bg-gray-100 px-3 py-2 rounded font-mono">
                              {order.trackingCode}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Products Table */}
                      <h4 className="font-medium text-[#814E1E] mt-6 mb-3">
                        Producten
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="px-4 py-2">Product</th>
                              <th className="px-4 py-2 text-center">Aantal</th>
                              <th className="px-4 py-2 text-right">Prijs</th>
                              <th className="px-4 py-2 text-right">Totaal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, index) => (
                              <tr
                                key={`${order.id}-${item.id}-${index}`}
                                className="border-b">
                                <td className="px-4 py-3">
                                  <div className="flex items-center space-x-3">
                                    <Image
                                      src={item.image}
                                      alt={item.name}
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 object-contain bg-[#F8F6F0] rounded"
                                    />
                                    <span className="font-medium">
                                      {item.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  €{item.price.toFixed(2).replace(".", ",")}
                                </td>
                                <td className="px-4 py-3 text-right font-medium">
                                  €
                                  {(item.price * item.quantity)
                                    .toFixed(2)
                                    .replace(".", ",")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td
                                colSpan={3}
                                className="px-4 py-2 text-right font-medium">
                                Subtotaal
                              </td>
                              <td className="px-4 py-2 text-right font-medium">
                                €
                                {order.items
                                  .reduce(
                                    (sum, item) =>
                                      sum + item.price * item.quantity,
                                    0
                                  )
                                  .toFixed(2)
                                  .replace(".", ",")}
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={3}
                                className="px-4 py-2 text-right font-medium">
                                Verzendkosten
                              </td>
                              <td className="px-4 py-2 text-right font-medium">
                                €
                                {(
                                  order.total -
                                  order.items.reduce(
                                    (sum, item) =>
                                      sum + item.price * item.quantity,
                                    0
                                  )
                                )
                                  .toFixed(2)
                                  .replace(".", ",")}
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={3}
                                className="px-4 py-2 text-right font-medium text-lg">
                                Totaal
                              </td>
                              <td className="px-4 py-2 text-right font-bold text-[#814E1E] text-lg">
                                €{order.total.toFixed(2).replace(".", ",")}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Order Actions */}
                      <div className="mt-6 flex flex-wrap gap-3">
                        {order.status === "delivered" && (
                          <button className="px-4 py-2 text-sm font-medium border border-[#814E1E] text-[#814E1E] rounded-md hover:bg-[#FFF9F0] transition-colors">
                            Opnieuw bestellen
                          </button>
                        )}
                        {order.trackingCode &&
                          order.status !== "delivered" &&
                          order.status !== "cancelled" && (
                            <a
                              href={`https://www.postnl.nl/tracktrace/?lang=nl&B=${order.trackingCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-sm font-medium bg-[#D6AD61] text-white rounded-md hover:bg-[#814E1E] transition-colors">
                              Volg pakket
                            </a>
                          )}
                        <button className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                          Contact klantenservice
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nog geen bestellingen
              </h3>
              <p className="text-gray-600 mb-6">
                Ontdek onze luxe wasparfums en plaats je eerste bestelling!
              </p>
              <Link
                href="/wasparfum"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#814E1E] hover:bg-[#D6AD61] transition-colors">
                Bekijk wasparfums
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
