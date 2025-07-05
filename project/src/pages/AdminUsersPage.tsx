import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useApi';
import { Users, Search, Plus, Edit, Trash2, Shield, User } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdminLayout from '../components/layout/AdminLayout';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { User as UserType } from '../types';
import { format } from 'date-fns';
import Layout from '../components/layout/Layout';

interface UserFormData {
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  balance: number;
}

const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>();

  useEffect(() => {
    if (editingUser) {
      setValue('name', editingUser.name);
      setValue('email', editingUser.email);
      setValue('role', editingUser.role);
      setValue('balance', editingUser.balance);
    } else {
      reset();
    }
  }, [editingUser, setValue, reset]);


  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const stats = useMemo(() => {
    if (!users) return [];
    return [
      {
        label: 'Total Users',
        value: users.length,
        color: 'text-blue-600',
      },
      {
        label: 'Active Users',
        value: users.filter(u => u.active).length,
        color: 'text-green-600',
      },
      {
        label: 'Admins',
        value: users.filter(u => u.role === 'ADMIN').length,
        color: 'text-purple-600',
      },
      {
        label: 'Inactive',
        value: users.filter(u => !u.active).length,
        color: 'text-red-600',
      },
    ];
  }, [users]);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (editingUser) {
        await updateUser.mutateAsync({ userId: editingUser.id, userData: data });
      } else {
        await createUser.mutateAsync(data);
      }
      reset();
      setShowAddForm(false);
      setEditingUser(null);
    } catch (error) {
      // Error toast is handled by the hook
    }
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setShowAddForm(true);
  };

  const handleDelete = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteUser.mutateAsync(userId);
    }
  };

  const toggleUserStatus = async (userToToggle: UserType) => {
    await updateUser.mutateAsync({ 
      userId: userToToggle.id, 
      userData: { ...userToToggle, active: !userToToggle.active } 
    });
  };

  return (
    <Layout>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600">Manage user accounts and permissions</p>
            </div>
            <Button onClick={() => { setEditingUser(null); setShowAddForm(true); reset(); }} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} padding="md">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Add/Edit User Form */}
          {showAddForm && (
            <Card className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...register('name', { required: 'Name is required' })}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Invalid email address',
                        },
                      })}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.role ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...register('role', { required: 'Role is required' })}
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Balance (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.balance ? 'border-red-300' : 'border-gray-300'
                      }`}
                      {...register('balance', {
                        required: 'Balance is required',
                        min: { value: 0, message: 'Balance must be positive' },
                      })}
                    />
                    {errors.balance && (
                      <p className="mt-1 text-sm text-red-600">{errors.balance.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingUser(null);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSubmitting}>
                    {editingUser ? 'Update User' : 'Create User'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="USER">Users</option>
                  <option value="ADMIN">Admins</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>
          </Card>

          {/* Users Table */}
          <Card>
            {usersLoading ? (
              <div className="text-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : usersError ? (
              <div className="text-center py-12 text-red-600">
                <p>Error loading users. Please try again later.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Balance</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Last Login</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{user.name}</p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              {user.role === 'ADMIN' ? (
                                <Shield className="h-4 w-4 text-purple-600" />
                              ) : (
                                <User className="h-4 w-4 text-gray-600" />
                              )}
                              <span className={`font-medium ${
                                user.role === 'ADMIN' ? 'text-purple-600' : 'text-gray-600'
                              }`}>
                                {user.role}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-medium text-green-600">৳{user.balance.toFixed(2)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">
                              {user.lastLogin 
                                ? format(new Date(user.lastLogin), 'MMM dd, yyyy p')
                                : 'Never'
                              }
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(user)}
                                className="flex items-center space-x-1"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(user.id)}
                                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No users found</p>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </AdminLayout>
    </Layout>
  );
};

export default AdminUsersPage;
