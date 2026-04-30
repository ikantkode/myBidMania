import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Shield, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import { settingsAPI, authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'email'>('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Email settings form state
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    emailFrom: '',
  });

  // Fetch user data and settings
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await settingsAPI.getProfile();
      return res.data;
    },
    onSuccess: (data) => {
      setProfileData({
        name: data.name || '',
        email: data.email || '',
      });
    },
  });

  const { data: emailSettingsData, isLoading: emailLoading } = useQuery({
    queryKey: ['emailSettings'],
    queryFn: async () => {
      const res = await settingsAPI.getEmailSettings();
      return res.data;
    },
    onSuccess: (data) => {
      setEmailSettings({
        smtpHost: data.smtpHost || '',
        smtpPort: data.smtpPort || '',
        smtpUser: data.smtpUser || '',
        smtpPass: '',
        emailFrom: data.emailFrom || '',
      });
    },
    enabled: userData?.role === 'ADMIN',
  });

  const user = userData;
  const isAdmin = user?.role === 'ADMIN';

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: settingsAPI.updateProfile,
    onSuccess: () => {
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to update profile');
      setTimeout(() => setErrorMessage(''), 3000);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: settingsAPI.changePassword,
    onSuccess: () => {
      setSuccessMessage('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to change password');
      setTimeout(() => setErrorMessage(''), 3000);
    },
  });

  // Update email settings mutation
  const updateEmailSettingsMutation = useMutation({
    mutationFn: settingsAPI.updateEmailSettings,
    onSuccess: (data: any) => {
      setSuccessMessage(data.data.message || 'Email settings updated');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || 'Failed to update email settings');
      setTimeout(() => setErrorMessage(''), 3000);
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const updateData: any = { name: profileData.name };
    if (isAdmin && profileData.email !== user?.email) {
      updateData.email = profileData.email;
    }

    updateProfileMutation.mutate(updateData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleEmailSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const updateData: any = {
      smtpHost: emailSettings.smtpHost,
      smtpPort: emailSettings.smtpPort,
      smtpUser: emailSettings.smtpUser,
      emailFrom: emailSettings.emailFrom,
    };

    if (emailSettings.smtpPass) {
      updateData.smtpPass = emailSettings.smtpPass;
    }

    updateEmailSettingsMutation.mutate(updateData);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar user={user} />

      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-3">
          <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
          <p className="text-sm text-slate-500">Manage your account and preferences</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {errorMessage}
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Profile
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('email')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'email'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Email Settings
              </button>
            )}
          </div>

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!isAdmin}
                        className={!isAdmin ? 'bg-slate-50' : ''}
                      />
                      {!isAdmin && (
                        <p className="text-xs text-slate-500 mt-1">
                          Contact your admin to change your email
                        </p>
                      )}
                      {isAdmin && (
                        <p className="text-xs text-slate-500 mt-1">
                          As admin, you can change your own email
                        </p>
                      )}
                    </div>
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Ensure your account is using a secure password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password *</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password *</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      variant="destructive"
                    >
                      {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {isAdmin && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Shield className="h-5 w-5" />
                      Admin Privileges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-800">
                      You have administrator access. You can manage team members, change email addresses,
                      and configure email settings for the entire system.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'email' && isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure SMTP settings for system notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {emailLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : (
                  <form onSubmit={handleEmailSettingsSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="smtpHost">SMTP Host *</Label>
                        <Input
                          id="smtpHost"
                          placeholder="smtp.example.com"
                          value={emailSettings.smtpHost}
                          onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPort">SMTP Port *</Label>
                        <Input
                          id="smtpPort"
                          placeholder="465 or 587"
                          value={emailSettings.smtpPort}
                          onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="smtpUser">SMTP Username *</Label>
                      <Input
                        id="smtpUser"
                        placeholder="user@example.com"
                        value={emailSettings.smtpUser}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailFrom">From Email *</Label>
                      <Input
                        id="emailFrom"
                        placeholder="noreply@example.com"
                        value={emailSettings.emailFrom}
                        onChange={(e) => setEmailSettings({ ...emailSettings, emailFrom: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPass">SMTP Password</Label>
                      <Input
                        id="smtpPass"
                        type="password"
                        placeholder="Leave empty to keep current password"
                        value={emailSettings.smtpPass}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpPass: e.target.value })}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Leave empty to keep the current password
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={updateEmailSettingsMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {updateEmailSettingsMutation.isPending ? 'Updating...' : 'Update Email Settings'}
                    </Button>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
                        <strong>Note:</strong> After updating email settings, you will need to restart the application
                        for the changes to take effect. Contact your system administrator to restart the services.
                      </p>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Logout Section */}
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <LogOut className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">Logout</h3>
                  <p className="text-sm text-red-700">Sign out of your account</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setLogoutDialogOpen(true)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
