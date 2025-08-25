import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../lib/api';
import { 
  User,
  Save,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile if name changed
      if (profileData.name !== user?.name) {
        const response = await authApi.updateProfile({
          name: profileData.name
        });
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to update profile');
        }
        
        toast.success('Profile updated successfully');
      }
      
      // Change password if provided
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          toast.error('New passwords do not match');
          return;
        }
        
        if (!profileData.currentPassword) {
          toast.error('Current password is required');
          return;
        }
        
        const response = await authApi.changePassword({
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword
        });
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to change password');
        }
        
        toast.success('Password changed successfully');
        
        // Clear password fields
        setProfileData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences</p>
      </div>

      {/* Profile Settings */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Profile Information</h3>
          </div>
        </div>
        
        <form onSubmit={handleProfileUpdate} className="card-body space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input bg-gray-50"
                value={profileData.email}
                disabled
                title="Email cannot be changed"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Change Password</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={profileData.currentPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={profileData.newPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={profileData.confirmPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>
            </div>
            
            {profileData.newPassword && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Password must be at least 6 characters long. You will need to sign in again after changing your password.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;