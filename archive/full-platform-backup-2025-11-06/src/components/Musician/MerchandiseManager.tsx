import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, TrendingUp, AlertCircle, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface MerchandiseItem {
  id: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  images: string[];
  variations: any;
  is_active: boolean;
  is_featured: boolean;
  management_type: 'self_service' | 'gigmate_managed';
  total_sold: number;
  total_revenue: number;
  created_at: string;
}

interface InventoryItem {
  id: string;
  variation_key: string;
  variation_label: string;
  sku: string;
  quantity_available: number;
  reorder_level: number;
}

export function MerchandiseManager() {
  const { user } = useAuth();
  const [merchandise, setMerchandise] = useState<MerchandiseItem[]>([]);
  const [inventory, setInventory] = useState<{ [key: string]: InventoryItem[] }>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MerchandiseItem | null>(null);

  useEffect(() => {
    if (user) loadMerchandise();
  }, [user]);

  async function loadMerchandise() {
    const { data: merchData, error } = await supabase
      .from('merchandise')
      .select('*')
      .eq('musician_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading merchandise:', error);
      return;
    }

    setMerchandise(merchData || []);

    if (merchData && merchData.length > 0) {
      const merchIds = merchData.map(m => m.id);
      const { data: invData } = await supabase
        .from('merchandise_inventory')
        .select('*')
        .in('merchandise_id', merchIds);

      const inventoryByMerch = (invData || []).reduce((acc: any, item) => {
        if (!acc[item.merchandise_id]) acc[item.merchandise_id] = [];
        acc[item.merchandise_id].push(item);
        return acc;
      }, {});

      setInventory(inventoryByMerch);
    }

    setLoading(false);
  }

  async function toggleActive(itemId: string, currentStatus: boolean) {
    await supabase
      .from('merchandise')
      .update({ is_active: !currentStatus })
      .eq('id', itemId);

    loadMerchandise();
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Are you sure you want to delete this merchandise item?')) return;

    await supabase.from('merchandise').delete().eq('id', itemId);
    loadMerchandise();
  }

  const totalRevenue = merchandise.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
  const totalSold = merchandise.reduce((sum, item) => sum + (item.total_sold || 0), 0);
  const activeItems = merchandise.filter(m => m.is_active).length;

  const lowStockItems = Object.entries(inventory).flatMap(([merchId, items]) =>
    items.filter(item => item.quantity_available <= item.reorder_level)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gigmate-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-gigmate-blue" />
            Merchandise Management
          </h2>
          <p className="text-gray-600 mt-1">Manage your products, inventory, and pricing</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-gigmate-blue text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Revenue</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total Sold</span>
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalSold}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Active Products</span>
            <Package className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeItems}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Low Stock Alerts</span>
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{lowStockItems.length}</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-2">Low Stock Alert</h3>
              <p className="text-sm text-orange-800">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} running low on stock.
                Consider restocking soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Management Type Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Merchandise Management Options</h3>
            <p className="text-sm text-blue-800 mb-3">
              Currently managing your merchandise: <strong>Self-Service</strong>
            </p>
            <div className="bg-white border border-blue-300 rounded-lg p-3">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Coming Soon:</strong> GigMate Managed Merchandise (Premium Feature)
              </p>
              <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                <li>Automated inventory management and reordering</li>
                <li>AI-powered pricing optimization</li>
                <li>Automated promotion campaigns</li>
                <li>Professional fulfillment services</li>
                <li>Advanced analytics and forecasting</li>
              </ul>
              <p className="text-xs text-blue-600 mt-2 italic">
                Available after 180 days of profitable operations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Merchandise List */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Your Products</h3>
        </div>

        {merchandise.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No merchandise yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-gigmate-blue text-white rounded-lg hover:bg-blue-700"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {merchandise.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gigmate-blue">${item.base_price}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span>Sold: {item.total_sold || 0}</span>
                      <span>Revenue: ${(item.total_revenue || 0).toFixed(2)}</span>
                      <span className={`px-2 py-1 rounded-full ${
                        item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Inventory Status */}
                    {inventory[item.id] && inventory[item.id].length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Inventory:</p>
                        <div className="flex flex-wrap gap-2">
                          {inventory[item.id].map((inv) => (
                            <div
                              key={inv.id}
                              className={`text-xs px-2 py-1 rounded ${
                                inv.quantity_available <= inv.reorder_level
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {inv.variation_label}: {inv.quantity_available}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="px-3 py-1.5 text-sm text-gigmate-blue hover:bg-blue-50 rounded-lg flex items-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(item.id, item.is_active)}
                        className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        {item.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal would go here */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Product</h3>
            <p className="text-gray-600 mb-4">
              Product form would go here with fields for name, description, price, category, variations, and images.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-gigmate-blue text-white rounded-lg hover:bg-blue-700">
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
