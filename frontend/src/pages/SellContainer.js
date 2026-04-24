import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { containerAPI, saleAPI } from '../utils/api';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import InputField from '../components/ui/InputField';

const SellContainer = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const formStartTime = useRef(Date.now());
  const [containers, setContainers] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    containerId: '',
    buyerName: '',
    buyerPhone: '',
    buyerEmail: '',
    sellingDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'Pending',
    amountReceived: '0',
    paymentMode: 'Bank Transfer',
    paymentModeOther: '',
    referenceId: '',
    dueDate: '',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAvailableContainers();
  }, []);

  const fetchAvailableContainers = async () => {
    try {
      const response = await containerAPI.getAll({ limit: 1000 });
      // Show containers that are Available or Reserved, or have items with remaining quantity
      const available = response.data.containers.filter(
        c => c.status === 'Available' || c.status === 'Reserved' ||
        (c.items && c.items.some(item => item.quantity > 0))
      );
      setContainers(available);
    } catch (error) {
      toast.error('Failed to load containers');
    }
  };

  const handleContainerChange = (e) => {
    const containerId = e.target.value;
    setFormData(prev => ({ ...prev, containerId }));
    const container = containers.find(c => c._id === containerId);
    setSelectedContainer(container);
    setSelectedItems([]);
    if (errors.containerId) {
      setErrors(prev => ({ ...prev, containerId: '' }));
    }
  };

  const handleItemToggle = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(si => si.itemId === item._id);
      if (exists) {
        return prev.filter(si => si.itemId !== item._id);
      }
      return [...prev, {
        itemId: item._id,
        name: item.name,
        quantity: '',
        unit: item.unit,
        available: item.quantity,
        unitPrice: item.unitPrice || 0,
        sellingPrice: ''
      }];
    });
    if (errors.items) {
      setErrors(prev => ({ ...prev, items: '' }));
    }
  };

  const handleItemQuantityChange = (itemId, quantity) => {
    setSelectedItems(prev =>
      prev.map(si =>
        si.itemId === itemId ? { ...si, quantity } : si
      )
    );
  };

  const handleItemSellingPriceChange = (itemId, sellingPrice) => {
    setSelectedItems(prev =>
      prev.map(si =>
        si.itemId === itemId ? { ...si, sellingPrice } : si
      )
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.containerId) {
      newErrors.containerId = 'Please select a container';
    }
    if (!formData.buyerName.trim()) {
      newErrors.buyerName = 'Buyer name is required';
    }
    if (!formData.buyerEmail.trim()) {
      newErrors.buyerEmail = 'Buyer email is required for payment reminders';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.buyerEmail.trim())) {
      newErrors.buyerEmail = 'Please enter a valid email address';
    }
    if (!formData.sellingDate) {
      newErrors.sellingDate = 'Selling date is required';
    }
    if (parseFloat(formData.amountReceived) < 0) {
      newErrors.amountReceived = 'Amount received cannot be negative';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Payment due date is required';
    } else if (formData.sellingDate && new Date(formData.dueDate) < new Date(formData.sellingDate)) {
      newErrors.dueDate = 'Due date cannot be before the selling date';
    }

    if (formData.paymentMode === 'Other' && !formData.paymentModeOther.trim()) {
      newErrors.paymentModeOther = 'Please describe the payment mode';
    }

    // Validate items if container has items
    if (selectedContainer && selectedContainer.items && selectedContainer.items.length > 0) {
      if (selectedItems.length === 0) {
        newErrors.items = 'Please select at least one item to sell';
      } else {
        selectedItems.forEach(si => {
          const qty = parseFloat(si.quantity);
          if (!si.quantity || qty <= 0) {
            newErrors[`item_qty_${si.itemId}`] = 'Quantity must be greater than 0';
          } else if (qty > si.available) {
            newErrors[`item_qty_${si.itemId}`] = `Cannot exceed available: ${si.available} ${si.unit}`;
          }
          const sp = parseFloat(si.sellingPrice);
          if (!si.sellingPrice || sp <= 0) {
            newErrors[`item_sp_${si.itemId}`] = 'Selling price is required';
          }
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      setLoading(true);

      const itemsData = selectedItems.map(si => ({
        itemId: si.itemId,
        name: si.name,
        quantity: parseFloat(si.quantity),
        unit: si.unit,
        unitPrice: si.unitPrice,
        sellingPrice: parseFloat(si.sellingPrice)
      }));

      const totalSellingPrice = itemsData.reduce((sum, i) => sum + (i.sellingPrice || 0), 0);

      const timeSpent = Math.round((Date.now() - formStartTime.current) / 1000);
      const resolvedPaymentMode = formData.paymentMode === 'Other'
        ? formData.paymentModeOther.trim()
        : formData.paymentMode;

      const data = {
        containerId: formData.containerId,
        buyerName: formData.buyerName,
        buyerPhone: formData.buyerPhone,
        buyerEmail: formData.buyerEmail.trim().toLowerCase(),
        sellingDate: formData.sellingDate,
        dueDate: formData.dueDate,
        paymentMode: resolvedPaymentMode,
        referenceId: formData.referenceId.trim(),
        remarks: formData.remarks,
        sellingPrice: totalSellingPrice,
        amountReceived: parseFloat(formData.amountReceived),
        paymentStatus: derivedPaymentStatus,
        items: itemsData,
        timeSpent
      };

      // If no items on the container, pass legacy quantity/unit
      if (!selectedContainer?.items || selectedContainer.items.length === 0) {
        data.quantity = 1;
        data.unit = 'Unit';
      }

      await saleAPI.create(data);
      toast.success('Sale created successfully');
      navigate('/sales');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  const hasItems = selectedContainer && selectedContainer.items && selectedContainer.items.length > 0;
  const availableItems = hasItems ? selectedContainer.items.filter(item => item.quantity > 0) : [];

  // Calculate per-item and total values
  const itemDetails = selectedItems.map(si => {
    const qty = parseFloat(si.quantity) || 0;
    const costPrice = (si.unitPrice || 0) * qty;
    const sp = parseFloat(si.sellingPrice) || 0;
    const itemProfit = sp - costPrice;
    return { ...si, costPrice, itemSellingPrice: sp, itemProfit };
  });

  const totalCostBasis = itemDetails.reduce((sum, d) => sum + d.costPrice, 0);
  const totalSellingPrice = itemDetails.reduce((sum, d) => sum + d.itemSellingPrice, 0);
  const totalProfit = itemDetails.reduce((sum, d) => sum + d.itemProfit, 0);
  const showProfit = user?.role === 'admin';

  const amountReceivedNum = parseFloat(formData.amountReceived) || 0;
  const balanceDue = totalSellingPrice - amountReceivedNum;

  // Auto-derive payment status
  const derivedPaymentStatus = (() => {
    if (totalSellingPrice > 0 && amountReceivedNum >= totalSellingPrice) return 'Full';
    if (amountReceivedNum > 0) return 'Partial';
    return 'Pending';
  })();

  return (
    <div data-testid="sell-container-page">
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <h1 className="text-2xl sm:text-4xl font-bold font-heading uppercase text-slate-900 tracking-tight" data-testid="page-title">
          Sell Container
        </h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base" data-testid="page-subtitle">Create a new sale transaction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="card p-4 sm:p-8">
            <form onSubmit={handleSubmit} data-testid="sell-form">
              <div className="space-y-6">
                <InputField
                  label="Select Container"
                  as="select"
                  name="containerId"
                  value={formData.containerId}
                  onChange={handleContainerChange}
                  error={errors.containerId}
                  required
                  data-testid="container-select"
                >
                  <option value="">Choose a container...</option>
                  {containers.map(container => (
                    <option key={container._id} value={container._id}>
                      {container.containerNo} - {container.size} {container.type} - AED {container.purchasePrice}
                      {container.items && container.items.length > 0
                        ? ` (${container.items.filter(i => i.quantity > 0).length} items)`
                        : ''}
                    </option>
                  ))}
                </InputField>

                {/* Items selection when container has items */}
                {hasItems && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">
                      Select Items to Sell *
                    </label>
                    {errors.items && (
                      <p className="text-red-600 text-sm mb-2">{errors.items}</p>
                    )}
                    {availableItems.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">All items in this container have been sold.</p>
                    ) : (
                      <div className="space-y-3">
                        {availableItems.map((item) => {
                          const isSelected = selectedItems.some(si => si.itemId === item._id);
                          const selectedItem = selectedItems.find(si => si.itemId === item._id);
                          const itemCost = isSelected ? (item.unitPrice || 0) * (parseFloat(selectedItem?.quantity) || 0) : 0;
                          return (
                            <div
                              key={item._id}
                              className={`p-4 rounded-lg border-2 transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleItemToggle(item)}
                                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <Package size={16} className="text-slate-400" />
                                    <span className="font-medium text-sm text-slate-900">{item.name}</span>
                                    {item.unitPrice > 0 && (
                                      <span className="text-xs text-slate-400">@ AED {item.unitPrice}/{item.unit}</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Available: {item.quantity} {item.unit}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="mt-3 ml-7 grid grid-cols-2 gap-3">
                                  <div>
                                    <InputField
                                      label="Sell Quantity"
                                      type="number"
                                      value={selectedItem?.quantity || ''}
                                      onChange={(e) => handleItemQuantityChange(item._id, e.target.value)}
                                      placeholder={`Max ${item.quantity}`}
                                      min="0"
                                      max={item.quantity}
                                      step="any"
                                      error={errors[`item_qty_${item._id}`]}
                                      inputClassName="text-sm"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Unit: {item.unit}</p>
                                  </div>
                                  <div>
                                    <InputField
                                      label="Selling Price (AED)"
                                      type="number"
                                      value={selectedItem?.sellingPrice || ''}
                                      onChange={(e) => handleItemSellingPriceChange(item._id, e.target.value)}
                                      placeholder="0"
                                      min="0"
                                      step="0.01"
                                      error={errors[`item_sp_${item._id}`]}
                                      inputClassName="text-sm"
                                    />
                                  </div>
                                  {itemCost > 0 && (
                                    <p className="col-span-2 text-xs text-slate-500">
                                      Cost: AED {itemCost.toLocaleString()} ({parseFloat(selectedItem?.quantity) || 0} × {item.unitPrice})
                                      {showProfit && parseFloat(selectedItem?.sellingPrice) > 0 && (
                                        <span className={`ml-2 font-semibold ${(parseFloat(selectedItem.sellingPrice) - itemCost) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                          Profit: AED {(parseFloat(selectedItem.sellingPrice) - itemCost).toLocaleString()}
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Buyer Name"
                    type="text"
                    name="buyerName"
                    value={formData.buyerName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    error={errors.buyerName}
                    required
                    data-testid="buyer-name-input"
                  />

                  <InputField
                    label="Buyer Phone"
                    type="tel"
                    name="buyerPhone"
                    value={formData.buyerPhone}
                    onChange={handleChange}
                    placeholder="+1-555-0123"
                    data-testid="buyer-phone-input"
                  />
                </div>

                <InputField
                  label="Buyer Email"
                  type="email"
                  name="buyerEmail"
                  value={formData.buyerEmail}
                  onChange={handleChange}
                  placeholder="buyer@example.com"
                  error={errors.buyerEmail}
                  required
                  data-testid="buyer-email-input"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Payment Mode"
                    as="select"
                    name="paymentMode"
                    value={formData.paymentMode}
                    onChange={handleChange}
                    required
                    data-testid="payment-mode-select"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </InputField>

                  {formData.paymentMode === 'Other' ? (
                    <InputField
                      label="Specify Payment Mode"
                      type="text"
                      name="paymentModeOther"
                      value={formData.paymentModeOther}
                      onChange={handleChange}
                      placeholder="e.g. Cheque, Cash, Credit Card"
                      error={errors.paymentModeOther}
                      required
                      data-testid="payment-mode-other-input"
                    />
                  ) : (
                    <InputField
                      label="Reference ID"
                      type="text"
                      name="referenceId"
                      value={formData.referenceId}
                      onChange={handleChange}
                      placeholder="Transaction / reference number"
                      data-testid="reference-id-input"
                    />
                  )}
                </div>

                {formData.paymentMode === 'Other' && (
                  <InputField
                    label="Reference ID"
                    type="text"
                    name="referenceId"
                    value={formData.referenceId}
                    onChange={handleChange}
                    placeholder="Transaction / reference number"
                    data-testid="reference-id-input"
                  />
                )}

                <InputField
                  label="Payment Due Date"
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  min={formData.sellingDate}
                  error={errors.dueDate}
                  required
                  data-testid="due-date-input"
                />

                {/* Total selling price display */}
                {selectedItems.length > 0 && totalSellingPrice > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Total Selling Price</span>
                      <span className="text-lg font-bold text-slate-900">AED {totalSellingPrice.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Sum of individual item selling prices</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="Selling Date"
                    type="date"
                    name="sellingDate"
                    value={formData.sellingDate}
                    onChange={handleChange}
                    error={errors.sellingDate}
                    required
                    data-testid="selling-date-input"
                  />

                  <InputField
                    label="Amount Received (AED)"
                    type="number"
                    name="amountReceived"
                    value={formData.amountReceived}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    error={errors.amountReceived}
                    data-testid="amount-received-input"
                  />
                </div>

                {/* Auto-derived payment status display */}
                {totalSellingPrice > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">Payment Status:</span>
                    <span className={`text-sm font-semibold ${
                      derivedPaymentStatus === 'Full' ? 'text-emerald-600' :
                      derivedPaymentStatus === 'Partial' ? 'text-amber-600' : 'text-red-600'
                    }`}>{derivedPaymentStatus}</span>
                  </div>
                )}

                <InputField
                  label="Remarks"
                  as="textarea"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows="3"
                  inputClassName="resize-none"
                  placeholder="Additional notes about the sale..."
                  data-testid="remarks-textarea"
                />
              </div>

              <div className="mt-8 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="submit-button"
                >
                  <ShoppingCart size={20} />
                  {loading ? 'Creating Sale...' : 'Create Sale'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn-secondary"
                  data-testid="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6" data-testid="summary-card">
            <h3 className="text-lg font-bold font-heading text-slate-900 mb-4">Sale Summary</h3>
            {selectedContainer ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                    Container
                  </p>
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {selectedContainer.containerNo}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedContainer.size} - {selectedContainer.type}
                  </p>
                </div>

                {/* Items in container */}
                {hasItems && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-2">
                      Container Items
                    </p>
                    <div className="space-y-1.5">
                      {selectedContainer.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 px-3 py-1.5 rounded">
                          <div>
                            <span className="text-slate-700">{item.name}</span>
                            {item.unitPrice > 0 && (
                              <span className="text-xs text-slate-400 ml-1">@ AED {item.unitPrice}</span>
                            )}
                          </div>
                          <span className={`font-medium ${item.quantity > 0 ? 'text-slate-900' : 'text-red-400 line-through'}`}>
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected items with profit breakdown */}
                {selectedItems.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-2">
                      Items Breakdown
                    </p>
                    <div className="space-y-2">
                      {itemDetails.map((d, idx) => (
                        <div key={idx} className="text-sm bg-primary/5 px-3 py-2 rounded border border-primary/20">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900">{d.name}</span>
                            <span className="font-medium text-primary">
                              {d.quantity || '—'} {d.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                            <span>Cost: AED {d.costPrice.toLocaleString()}</span>
                            <span>Sell: AED {d.itemSellingPrice.toLocaleString()}</span>
                          </div>
                          {showProfit && d.itemSellingPrice > 0 && (
                            <div className="text-right mt-0.5">
                              <span className={`text-xs font-semibold ${d.itemProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                Profit: AED {d.itemProfit.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Total Cost</span>
                    <span className="font-medium text-slate-900">AED {totalCostBasis.toLocaleString()}</span>
                  </div>
                  {totalSellingPrice > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Total Selling</span>
                        <span className="font-medium text-slate-900">AED {totalSellingPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Amount Received</span>
                        <span className="font-medium text-slate-900">AED {amountReceivedNum.toLocaleString()}</span>
                      </div>
                      {balanceDue > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Balance Due</span>
                          <span className="font-semibold text-amber-600">AED {balanceDue.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Payment Status</span>
                        <span className={`font-semibold ${
                          derivedPaymentStatus === 'Full' ? 'text-emerald-600' :
                          derivedPaymentStatus === 'Partial' ? 'text-amber-600' : 'text-red-600'
                        }`}>{derivedPaymentStatus}</span>
                      </div>
                      {showProfit && (
                        <div className="pt-3 border-t border-slate-200">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                            Total Profit
                          </p>
                          <p className={`text-2xl font-bold font-heading ${
                            totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            AED {totalProfit.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Selling (AED {totalSellingPrice.toLocaleString()}) - Cost (AED {totalCostBasis.toLocaleString()})
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a container to see sale details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellContainer;
