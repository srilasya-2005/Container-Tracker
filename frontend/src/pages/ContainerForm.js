import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { containerAPI } from '../utils/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import InputField from '../components/ui/InputField';

const UNIT_OPTIONS = ['Kg', 'Ton', 'Ltr', 'Pcs', 'Box', 'Unit', 'Bags'];

const ContainerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    containerNo: '',
    size: '20FT',
    type: 'Dry',
    purchasePrice: '',
    purchaseDate: '',
    purchasedFrom: '',
    paymentStatus: 'Pending',
    status: 'Available',
    notes: ''
  });
  const [items, setItems] = useState([{ name: '', quantity: '', unit: 'Kg', unitPrice: '' }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const formStartTime = useRef(Date.now());

  const fetchContainer = useCallback(async () => {
    try {
      const response = await containerAPI.getById(id);
      const container = response.data;
      setFormData({
        containerNo: container.containerNo,
        size: container.size,
        type: container.type,
        purchasePrice: container.purchasePrice,
        purchaseDate: new Date(container.purchaseDate).toISOString().split('T')[0],
        purchasedFrom: container.purchasedFrom || '',
        paymentStatus: container.paymentStatus || 'Pending',
        status: container.status,
        notes: container.notes || ''
      });
      if (container.items && container.items.length > 0) {
        setItems(container.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice || ''
        })));
      }
    } catch (error) {
      toast.error('Failed to load container');
      navigate('/containers');
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEdit) {
      fetchContainer();
    }
  }, [isEdit, fetchContainer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
    if (errors[`item_${index}_${field}`]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[`item_${index}_${field}`];
        return copy;
      });
    }
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: '', unit: 'Kg', unitPrice: '' }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) {
      toast.error('At least one item is required');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Auto-calculate purchase price from items
  const calculatedPurchasePrice = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + (qty * price);
  }, 0);

  const validate = () => {
    const newErrors = {};

    if (!formData.containerNo.trim()) {
      newErrors.containerNo = 'Container number is required';
    }
    if (calculatedPurchasePrice <= 0) {
      newErrors.purchasePrice = 'Add items with quantity and unit price to calculate purchase price';
    }
    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required';
    }

    items.forEach((item, index) => {
      if (!item.name.trim()) {
        newErrors[`item_${index}_name`] = 'Item name is required';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (!item.unitPrice && item.unitPrice !== 0) {
        newErrors[`item_${index}_unitPrice`] = 'Unit price is required';
      } else if (parseFloat(item.unitPrice) < 0) {
        newErrors[`item_${index}_unitPrice`] = 'Unit price must be non-negative';
      }
    });

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

      const timeSpent = Math.round((Date.now() - formStartTime.current) / 1000);
      const data = {
        ...formData,
        purchasePrice: calculatedPurchasePrice,
        timeSpent,
        items: items.map(item => ({
          name: item.name.trim(),
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          unitPrice: parseFloat(item.unitPrice) || 0
        }))
      };

      if (isEdit) {
        await containerAPI.update(id, data);
        toast.success('Container updated successfully');
      } else {
        await containerAPI.create(data);
        toast.success('Container created successfully');
      }

      navigate('/containers');
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${isEdit ? 'update' : 'create'} container`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="container-form-page">
      <div className="mb-8">
        <button
          onClick={() => navigate('/containers')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
          <span>Back to Containers</span>
        </button>
        <h1 className="text-2xl sm:text-4xl font-bold font-heading uppercase text-slate-900 tracking-tight" data-testid="form-title">
          {isEdit ? 'Edit Container' : 'Add Container'}
        </h1>
      </div>

      <div className="card p-4 sm:p-8 max-w-4xl">
        <form onSubmit={handleSubmit} data-testid="container-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Container Number"
              type="text"
              name="containerNo"
              value={formData.containerNo}
              onChange={handleChange}
              disabled={isEdit}
              inputClassName="uppercase"
              placeholder="TELU1234567"
              error={errors.containerNo}
              required
              data-testid="container-no-input"
            />

            <InputField
              label="Size"
              as="select"
              name="size"
              value={formData.size}
              onChange={handleChange}
              required
              data-testid="size-select"
            >
              <option value="20FT">20FT</option>
              <option value="40FT">40FT</option>
            </InputField>

            <InputField
              label="Type"
              as="select"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              data-testid="type-select"
            >
              <option value="Dry">Dry</option>
              <option value="Reefer">Reefer</option>
            </InputField>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-2" data-testid="price-label">
                Purchase Price (AED)
              </label>
              <div
                className="input-field w-full bg-slate-100 cursor-not-allowed font-semibold text-slate-900"
                data-testid="price-display"
              >
                AED {calculatedPurchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Auto-calculated from items (qty × unit price)</p>
              {errors.purchasePrice && (
                <p className="text-red-600 text-sm mt-1" data-testid="price-error">{errors.purchasePrice}</p>
              )}
            </div>

            <InputField
              label="Purchase Date"
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              error={errors.purchaseDate}
              required
              data-testid="date-input"
            />

            <InputField
              label="Purchased From"
              type="text"
              name="purchasedFrom"
              value={formData.purchasedFrom}
              onChange={handleChange}
              placeholder="Vendor / supplier name"
              data-testid="purchased-from-input"
            />

            {isEdit && (
              <InputField
                label="Payment Status"
                as="select"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleChange}
                data-testid="payment-status-select"
              >
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Full">Full</option>
              </InputField>
            )}

            {isEdit && (
              <InputField
                label="Status"
                as="select"
                name="status"
                value={formData.status}
                onChange={handleChange}
                data-testid="status-select"
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Sold">Sold</option>
              </InputField>
            )}
          </div>

          {/* Items Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Items *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-semibold transition-colors"
                data-testid="add-item-button"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200" data-testid={`item-row-${index}`}>
                  <div className="flex items-start justify-between gap-2 mb-3 sm:mb-0">
                    <div className="flex-1 sm:hidden">
                      <InputField
                        label="Item Name"
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="e.g. Rice, Sugar, Oil..."
                        error={errors[`item_${index}_name`]}
                        data-testid={`item-name-${index}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="sm:hidden p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors shrink-0"
                      data-testid={`remove-item-mobile-${index}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-start">
                    <div className="col-span-2 sm:col-span-1 hidden sm:block">
                      <InputField
                        label="Item Name"
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="e.g. Rice, Sugar, Oil..."
                        error={errors[`item_${index}_name`]}
                        data-testid={`item-name-desktop-${index}`}
                      />
                    </div>
                    <div className="sm:w-28">
                      <InputField
                        label="Quantity"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        placeholder="100"
                        min="0"
                        step="any"
                        error={errors[`item_${index}_quantity`]}
                        data-testid={`item-quantity-${index}`}
                      />
                    </div>
                    <div className="sm:w-24">
                      <InputField
                        label="Unit"
                        as="select"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        data-testid={`item-unit-${index}`}
                      >
                        {UNIT_OPTIONS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </InputField>
                    </div>
                    <div className="sm:w-32">
                      <InputField
                        label="Unit Price"
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        placeholder="10"
                        min="0"
                        step="any"
                        error={errors[`item_${index}_unitPrice`]}
                        data-testid={`item-unitprice-${index}`}
                      />
                    </div>
                    <div className="hidden sm:block pt-6">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                        data-testid={`remove-item-${index}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <InputField
              label="Notes"
              as="textarea"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              inputClassName="resize-none"
              placeholder="Additional notes..."
              data-testid="notes-textarea"
            />
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-button"
            >
              <Save size={20} />
              {loading ? 'Saving...' : (isEdit ? 'Update Container' : 'Create Container')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/containers')}
              className="btn-secondary"
              data-testid="cancel-button"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContainerForm;
