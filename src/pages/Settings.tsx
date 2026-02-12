import { useState } from "react";
import { useNotificationStore } from "@/lib/notification-store";
import { useUserContext } from "@/services/MinimalUserProvider";
import {
    Bell,
    Edit,
    Eye,
    EyeOff,
    Globe,
    Loader2,
    Save,
    Settings as SettingsIcon,
    Shield,
    User,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";

export default function Settings() {
  const i18n = {
    language: "en-GB",
    changeLanguage: (lang: string) => {
      localStorage.setItem("trinity-language", lang);
    },
  };
  const { preferences, updatePreferences } = useNotificationStore();
  const { toast } = useToast();
  const { userContext } = useUserContext();

  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    fullName: `${userContext?.firstName || ""} ${
      userContext?.lastName || ""
    }`.trim(),
    email: userContext?.email || "",
    company: userContext?.organizationName || "",
    timezone: "Eastern Time",
  });

  // Security state
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState(
    i18n.language || "en-GB"
  );

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      toast({
        title: "Changes saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (
      !security.currentPassword ||
      !security.newPassword ||
      !security.confirmPassword
    ) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (security.newPassword !== security.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (security.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "New password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });

      setSecurity({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    i18n.changeLanguage(languageCode);
    localStorage.setItem("trinity-language", languageCode);

    toast({
      title: "Language updated",
      description: `Platform language changed successfully.`,
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>
          <Button
            onClick={handleSaveChanges}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 border-gray-800 bg-gray-900">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Profile Information Section */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-emerald-400" />
                    Profile Information
                  </h3>
                  <p className="text-gray-400">
                    Update your personal information and preferences
                  </p>
                </div>
                <Button variant="outline" size="sm" className="border-gray-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="fullName" className="text-gray-300">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile({ ...profile, fullName: e.target.value })
                    }
                    className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="company" className="text-gray-300">
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) =>
                      setProfile({ ...profile, company: e.target.value })
                    }
                    className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone" className="text-gray-300">
                    Timezone
                  </Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) =>
                      setProfile({ ...profile, timezone: value })
                    }
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-900/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-900">
                      <SelectItem value="Eastern Time">Eastern Time</SelectItem>
                      <SelectItem value="Central Time">Central Time</SelectItem>
                      <SelectItem value="Mountain Time">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="Pacific Time">Pacific Time</SelectItem>
                      <SelectItem value="GMT">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Language & Region Section */}
              <div className="mt-8 border-t border-gray-700 pt-6">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
                  <Globe className="h-4 w-4 text-emerald-400" />
                  Language & Region
                </h4>
                <div className="max-w-sm">
                  <Label htmlFor="language" className="text-gray-300">
                    Language
                  </Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-900/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-900">
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="ru">Russian</SelectItem>
                      <SelectItem value="sr">Serbian</SelectItem>
                      <SelectItem value="mt">Maltese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  Change Password
                </h3>
                <p className="text-gray-400">
                  Update your account password for enhanced security
                </p>
              </div>

              {/* Password Status */}
              <div className="mb-6 rounded-lg border border-gray-700 bg-gray-900/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      Password Status
                    </p>
                    <div className="mt-1 flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">
                          Security Level
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                          <span className="text-xs font-medium text-emerald-400">
                            Strong
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">
                          Password Age
                        </span>
                        <span className="text-xs text-gray-300">Unknown</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Change Fields */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="currentPassword" className="text-gray-300">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={security.currentPassword}
                      onChange={(e) =>
                        setSecurity({
                          ...security,
                          currentPassword: e.target.value,
                        })
                      }
                      className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 pr-10"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-gray-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={security.newPassword}
                      onChange={(e) =>
                        setSecurity({
                          ...security,
                          newPassword: e.target.value,
                        })
                      }
                      className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={security.confirmPassword}
                      onChange={(e) =>
                        setSecurity({
                          ...security,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-400">
                <p>Password must be at least 8 characters long</p>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={
                    saving ||
                    !security.currentPassword ||
                    !security.newPassword ||
                    !security.confirmPassword
                  }
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saving ? "Changing Password..." : "Change Password"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Choose how and when you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        Email Notifications
                      </p>
                      <p className="text-sm text-gray-400">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) =>
                        updatePreferences({ emailNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        Push Notifications
                      </p>
                      <p className="text-sm text-gray-400">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) =>
                        updatePreferences({ pushNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        SMS Notifications
                      </p>
                      <p className="text-sm text-gray-400">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={preferences.smsNotifications}
                      onCheckedChange={(checked) =>
                        updatePreferences({ smsNotifications: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">
                  Appearance Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Customize how the platform looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Appearance settings coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
