import React from 'react';
import { PAYMENT_SOURCES } from '../../utils/paymentSource';

const PaymentSourceFields = ({
  paymentSource,
  paymentSourceLabel,
  onSourceChange,
  onLabelChange,
  required = false,
}) => (
  <>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Payment Source{required ? ' *' : ''}
      </label>
      <select
        value={paymentSource}
        onChange={(e) => onSourceChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        {PAYMENT_SOURCES.map((source) => (
          <option key={source} value={source}>
            {source}
          </option>
        ))}
      </select>
    </div>
    {paymentSource === 'Custom' && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Custom Label *</label>
        <input
          type="text"
          value={paymentSourceLabel}
          onChange={(e) => onLabelChange(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g. Bank transfer, UPI manual"
        />
      </div>
    )}
  </>
);

export default PaymentSourceFields;
