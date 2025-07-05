import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { User, Settings, Lock, CreditCard, History, Bell } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [quickAmounts, setQuickAmounts] = useState<number[]>([50, 100, 150, 200]);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Dummy Payment');
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  useEffect(() => {
    // Fetch quick amounts from API
    const fetchQuickAmounts = async () => {
      try {
        const response = await apiService.getQuickAmounts();
        setQuickAmounts(response.amounts);
      } catch (error) {
        console.error('Error fetching quick amounts:', error);
      }
    };
    fetchQuickAmounts();
  }, []);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user) {
        updateUser({ ...user, ...data });
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Password updated successfully');
      resetPasswordForm();
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddFunds = async () => {
    if (!selectedAmount) {
      toast.error('Please select an amount');
      return;
    }

    setIsAddingFunds(true);
    try {
      const result = await apiService.addFunds(selectedAmount, paymentMethod);
      
      if (result.success) {
        toast.success(`Successfully added ${selectedAmount} Taka to your balance!`);
        // Update user balance in context
        if (updateUser && user) {
          updateUser({ ...user, balance: result.newBalance });
        }
        setShowAddFundsModal(false);
        setSelectedAmount(null);
      } else {
        toast.error(`Payment failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Error processing payment. Please try again.');
    } finally {
      setIsAddingFunds(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        profileErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...registerProfile('name', { required: 'Name is required' })}
                    />
                    {profileErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        profileErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...registerProfile('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Invalid email address',
                        },
                      })}
                    />
                    {profileErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Balance
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                      <span className="text-lg font-semibold text-green-600">
                        ৳{user.balance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Since
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                      <span className="text-gray-700">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" loading={isUpdating}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    {...registerPassword('currentPassword', {
                      required: 'Current password is required',
                    })}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    {...registerPassword('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    })}
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    {...registerPassword('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === newPassword || 'Passwords do not match',
                    })}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" loading={isUpdating}>
                    Update Password
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'billing' && (
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing Information</h2>
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-green-800">Current Balance</h3>
                      <p className="text-2xl font-bold text-green-600">৳{user.balance.toFixed(2)}</p>
                    </div>
                    <Button 
                      variant="secondary" 
                      onClick={() => setShowAddFundsModal(true)}
                    >
                      Add Funds
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Quick Add Funds</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setSelectedAmount(amount)}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          selectedAmount === amount
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold">৳{amount}</div>
                        <div className="text-sm text-gray-500">Taka</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Payment Methods</h3>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600">Dummy Payment System (95% success rate)</p>
                    <p className="text-sm text-gray-500 mt-1">
                      This is a test payment system. In production, this would integrate with real payment gateways.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Billing History</h3>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600">No billing history available.</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-600">Receive updates about your print jobs</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                      <p className="text-sm text-gray-600">Get text messages for urgent updates</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Marketing Emails</h3>
                      <p className="text-sm text-gray-600">Receive promotional offers and updates</p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save Preferences</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Funds to Account</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Amount
              </label>
              <div className="grid grid-cols-2 gap-3">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      selectedAmount === amount
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">৳{amount}</div>
                    <div className="text-sm text-gray-500">Taka</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Dummy Payment">Dummy Payment (Test)</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddFundsModal(false);
                  setSelectedAmount(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddFunds}
                loading={isAddingFunds}
                disabled={!selectedAmount}
                className="flex-1"
              >
                {isAddingFunds ? 'Processing...' : 'Add Funds'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 