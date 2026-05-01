import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';
import { updateProfileSchema, changePasswordSchema, type UpdateProfileInput, type ChangePasswordInput } from '@taskflow/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { api, ApiError } from '@/lib/api';
import { getInitials } from '@/lib/utils';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileInput) => api.patch<{ user: typeof user }>('/auth/profile', data),
    onSuccess: (data) => {
      if (data.user) {
        updateUser(data.user);
      }
      toast.success('Profile updated successfully');
      setIsUpdatingProfile(false);
    },
    onError: (error: Error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to update profile');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordInput) => api.post('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      passwordForm.reset();
      setIsChangingPassword(false);
    },
    onError: (error: Error) => {
      toast.error(error instanceof ApiError ? error.message : 'Failed to change password');
    },
  });

  const onProfileSubmit = (data: UpdateProfileInput) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: ChangePasswordInput) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(user?.name || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-semibold">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <Separator />

            {isUpdatingProfile ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...profileForm.register('name')}
                    disabled={updateProfileMutation.isPending}
                  />
                  {profileForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    placeholder="https://example.com/avatar.jpg"
                    {...profileForm.register('avatarUrl')}
                    disabled={updateProfileMutation.isPending}
                  />
                  {profileForm.formState.errors.avatarUrl && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.avatarUrl.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsUpdatingProfile(false);
                      profileForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm text-muted-foreground">{user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUpdatingProfile(true)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          {isChangingPassword ? (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...passwordForm.register('currentPassword')}
                  disabled={changePasswordMutation.isPending}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Min 8 chars, mixed case + number"
                  {...passwordForm.register('newPassword')}
                  disabled={changePasswordMutation.isPending}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  {changePasswordMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Change Password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    passwordForm.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
              Change Password
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
