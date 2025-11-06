import { useState, useEffect } from 'react';
import { Building2, DollarSign, Plus, Check, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PayoutAccount {
  id: string;
  payout_type: 'bank_account' | 'venmo' | 'cashapp';
  account_holder_name: string;
  bank_name?: string;
  account_number_last_four?: string;
  venmo_username?: string;
  cashapp_username?: string;
  is_default: boolean;
  is_verified: boolean;
}

export default function PayoutAccountManager() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    payout_type: 'bank_account' as 'bank_account' | 'venmo' | 'cashapp',
    account_holder_name: '',
    bank_name: '',
    routing_number: '',
    account_number: '',
    venmo_username: '',
    cashapp_username: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    if (!user) return;

    const { data } = await supabase
      .from('payout_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (data) {
      setAccounts(data);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const accountData: any = {
      user_id: user.id,
      payout_type: formData.payout_type,
      account_holder_name: formData.account_holder_name,
      is_default: accounts.length === 0
    };

    if (formData.payout_type === 'bank_account') {
      accountData.bank_name = formData.bank_name;
      accountData.routing_number = formData.routing_number;
      accountData.account_number_last_four = formData.account_number.slice(-4);
    } else if (formData.payout_type === 'venmo') {
      accountData.venmo_username = formData.venmo_username;
    } else if (formData.payout_type === 'cashapp') {
      accountData.cashapp_username = formData.cashapp_username;
    }

    const { error } = await supabase
      .from('payout_accounts')
      .insert(accountData);

    if (error) {
      alert('Failed to add payout account: ' + error.message);
    } else {
      setShowAddForm(false);
      setFormData({
        payout_type: 'bank_account',
        account_holder_name: '',
        bank_name: '',
        routing_number: '',
        account_number: '',
        venmo_username: '',
        cashapp_username: ''
      });
      loadAccounts();
    }

    setLoading(false);
  }

  async function handleSetDefault(accountId: string) {
    if (!user) return;

    await supabase
      .from('payout_accounts')
      .update({ is_default: false })
      .eq('user_id', user.id);

    await supabase
      .from('payout_accounts')
      .update({ is_default: true })
      .eq('id', accountId);

    loadAccounts();
  }

  async function handleDelete(accountId: string) {
    if (!confirm('Are you sure you want to remove this payout account?')) {
      return;
    }

    await supabase
      .from('payout_accounts')
      .delete()
      .eq('id', accountId);

    loadAccounts();
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Payout Accounts</h2>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gigmate-blue text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Account</span>
          </button>
        )}
      </div>

      {accounts.length === 0 && !showAddForm && (
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No payout accounts added yet</p>
          <p className="text-sm text-gray-500">
            Add a bank account, Venmo, or CashApp to receive payments
          </p>
        </div>
      )}

      {accounts.length > 0 && (
        <div className="space-y-3 mb-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`border-2 rounded-lg p-4 ${
                account.is_default
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-semibold text-gray-900 capitalize">
                      {account.payout_type.replace('_', ' ')}
                    </span>
                    {account.is_default && (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-semibold">
                        DEFAULT
                      </span>
                    )}
                    {account.is_verified && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mb-1">
                    {account.account_holder_name}
                  </p>

                  {account.payout_type === 'bank_account' && (
                    <p className="text-sm text-gray-600">
                      {account.bank_name} - ••••{account.account_number_last_four}
                    </p>
                  )}

                  {account.payout_type === 'venmo' && (
                    <p className="text-sm text-gray-600">
                      @{account.venmo_username}
                    </p>
                  )}

                  {account.payout_type === 'cashapp' && (
                    <p className="text-sm text-gray-600">
                      ${account.cashapp_username}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {!account.is_default && (
                    <button
                      onClick={() => handleSetDefault(account.id)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payout Method
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['bank_account', 'venmo', 'cashapp'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, payout_type: type })}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.payout_type === type
                      ? 'border-gigmate-blue bg-blue-50 text-gigmate-blue'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {type === 'bank_account' ? 'Bank Account' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name
            </label>
            <input
              type="text"
              required
              value={formData.account_holder_name}
              onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
            />
          </div>

          {formData.payout_type === 'bank_account' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing Number
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{9}"
                  value={formData.routing_number}
                  onChange={(e) => setFormData({ ...formData, routing_number: e.target.value })}
                  placeholder="9 digits"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
                />
              </div>
            </>
          )}

          {formData.payout_type === 'venmo' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venmo Username
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={formData.venmo_username}
                  onChange={(e) => setFormData({ ...formData, venmo_username: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
                />
              </div>
            </div>
          )}

          {formData.payout_type === 'cashapp' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cash App Username
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  $
                </span>
                <input
                  type="text"
                  required
                  value={formData.cashapp_username}
                  onChange={(e) => setFormData({ ...formData, cashapp_username: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-gigmate-blue focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gigmate-blue text-white py-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
