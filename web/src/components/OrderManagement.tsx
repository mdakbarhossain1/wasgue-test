'use client';

import { useState } from 'react';

interface OrderManagementProps {
  paymentIntentId: string;
  orderId?: number;
  orderTotal: number;
  orderStatus: string;
}

export default function OrderManagement({ 
  paymentIntentId, 
  orderId, 
  orderTotal, 
  orderStatus 
}: OrderManagementProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [refundStatus, setRefundStatus] = useState<string>('');
  const [refunds, setRefunds] = useState<any[]>([]);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('requested_by_customer');

  const fetchRefunds = async () => {
    try {
      const response = await fetch(`/api/stripe/refund?payment_intent_id=${paymentIntentId}`);
      if (response.ok) {
        const data = await response.json();
        setRefunds(data.refunds || []);
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
    }
  };

  const handleRefund = async (isPartial: boolean = false) => {
    setIsProcessing(true);
    setRefundStatus('');

    try {
      const refundData: any = {
        paymentIntentId,
        orderId,
        reason: refundReason,
      };

      if (isPartial && refundAmount) {
        const amountInCents = Math.round(parseFloat(refundAmount) * 100);
        if (amountInCents > orderTotal * 100) {
          setRefundStatus('Refund bedrag kan niet hoger zijn dan het order totaal');
          setIsProcessing(false);
          return;
        }
        refundData.amount = amountInCents;
      }

      const response = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundData),
      });

      const result = await response.json();

      if (response.ok) {
        setRefundStatus(`✅ ${result.message}`);
        setShowRefundModal(false);
        setRefundAmount('');
        await fetchRefunds(); // Refresh refunds list
      } else {
        setRefundStatus(`❌ ${result.error}: ${result.details || ''}`);
      }
    } catch (error) {
      setRefundStatus('❌ Er is een fout opgetreden bij het verwerken van de refund');
      console.error('Refund error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalRefunded = refunds.reduce((sum, refund) => sum + refund.amount, 0) / 100;
  const canRefund = orderStatus !== 'refunded' && totalRefunded < orderTotal;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Management</h3>
      
      {/* Order Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Order Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            orderStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
            orderStatus === 'refunded' ? 'bg-red-100 text-red-800' :
            orderStatus === 'partially-refunded' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {orderStatus === 'processing' ? 'In behandeling' :
             orderStatus === 'refunded' ? 'Terugbetaald' :
             orderStatus === 'partially-refunded' ? 'Gedeeltelijk terugbetaald' :
             orderStatus}
          </span>
        </div>
      </div>

      {/* Refund History */}
      {refunds.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Refund Historie:</h4>
          <div className="space-y-2">
            {refunds.map((refund) => (
              <div key={refund.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                <span>Refund #{refund.id.substring(-8)}</span>
                <span className="font-medium">€{(refund.amount / 100).toFixed(2)}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  refund.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                  refund.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {refund.status}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Totaal terugbetaald: €{totalRefunded.toFixed(2)} van €{orderTotal.toFixed(2)}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {canRefund && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => handleRefund(false)}
              disabled={isProcessing}
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Verwerken...' : 'Volledige Refund'}
            </button>
            <button
              onClick={() => setShowRefundModal(true)}
              disabled={isProcessing}
              className="flex-1 border border-red-500 text-red-500 py-2 px-4 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Gedeeltelijke Refund
            </button>
          </div>
          
          <button
            onClick={fetchRefunds}
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            🔄 Refresh Status
          </button>
        </div>
      )}

      {/* Status Message */}
      {refundStatus && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          refundStatus.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {refundStatus}
        </div>
      )}

      {/* Partial Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gedeeltelijke Refund</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Bedrag (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={orderTotal - totalRefunded}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#814e1e] focus:border-[#814e1e]"
                  placeholder={`Max: €${(orderTotal - totalRefunded).toFixed(2)}`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reden
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#814e1e] focus:border-[#814e1e]"
                >
                  <option value="requested_by_customer">Klant verzoek</option>
                  <option value="duplicate">Dubbele betaling</option>
                  <option value="fraudulent">Frauduleus</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleRefund(true)}
                disabled={isProcessing || !refundAmount}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Verwerken...' : 'Refund Verwerken'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

