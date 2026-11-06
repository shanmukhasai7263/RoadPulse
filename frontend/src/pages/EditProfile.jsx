
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Lock,
  Save,
} from "lucide-react";
import { supabase } from "../services/supabaseClient";

function EditProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Show password form only after recovery link is opened
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load profile and listen for password recovery
  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        navigate("/login");
        return;
      }

      setName(
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        ""
      );

      setEmail(data.user.email || "");
      setLoading(false);
    }

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        setMessage("Recovery link verified. You can now set a new password.");
        setError("");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  function showError(text) {
    setError(text);
    setMessage("");
  }

  // Save name
  async function saveName() {
    if (!name.trim()) {
      showError("Please enter your name.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() },
    });

    setSaving(false);

    if (error) {
      showError(error.message);
      return;
    }

    setMessage("Name updated successfully.");
  }

  // Request email change
  async function requestEmailChange() {
    if (!newEmail.trim()) {
      showError("Enter your new email address.");
      return;
    }

    if (newEmail.trim().toLowerCase() === email.toLowerCase()) {
      showError("Enter an email address different from your current one.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.updateUser(
      { email: newEmail.trim() },
      {
        emailRedirectTo: `${window.location.origin}/edit-profile`,
      }
    );

    setSaving(false);

    if (error) {
      showError(error.message);
      return;
    }

    setMessage(
      "Confirmation email requested. Check your inbox to complete the email change."
    );
  }

  // Request password recovery email
  async function requestPasswordRecovery() {
    setSaving(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/edit-profile`,
      }
    );

    setSaving(false);

    if (error) {
      showError(error.message);
      return;
    }

    // Do NOT enable the password form here.
    // It will appear only after PASSWORD_RECOVERY event.
    setMessage(
      "Password recovery requested. Open the recovery link sent to your email."
    );
  }

  // Update password after recovery link is verified
  async function updatePassword() {
    if (password.length < 6) {
      showError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setSaving(false);

    if (error) {
      showError(error.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setIsRecoveryMode(false);

    setMessage("Password changed successfully.");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-5 py-8">
      <div className="max-w-3xl mx-auto">

        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold uppercase">
              {name.charAt(0) || "U"}
            </div>

            <div>
              <h1 className="text-2xl font-bold">Edit Profile</h1>
              <p className="text-slate-400 text-sm">
                Manage your personal information and account security.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
              {message}
            </div>
          )}

          {/* Personal Information */}
          <section className="space-y-5">

            <h2 className="text-lg font-semibold flex items-center gap-2">
              <UserRound size={20} className="text-blue-400" />
              Personal Information
            </h2>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Full Name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 outline-none focus:border-blue-500"
                placeholder="Enter full name"
              />
            </div>

            <button
              onClick={saveName}
              disabled={saving}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <Save size={17} />
                Save Name
              </span>
            </button>

            <div className="border-t border-slate-800 pt-5">
              <label className="block text-sm text-slate-400 mb-2">
                Current Email
              </label>

              <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-lg p-3">
                <Mail size={18} className="text-blue-400" />
                <span>{email}</span>
              </div>

              <label className="block text-sm text-slate-400 mt-4 mb-2">
                New Email Address
              </label>

              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 outline-none focus:border-blue-500"
              />

              <button
                onClick={requestEmailChange}
                disabled={saving}
                className="mt-3 px-5 py-2.5 border border-blue-500 text-blue-400 rounded-lg hover:bg-blue-500/10 disabled:opacity-50"
              >
                Send Email Confirmation
              </button>
            </div>

          </section>

          {/* Account Security */}
          <section className="mt-8 border-t border-slate-800 pt-7 space-y-4">

            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Lock size={20} className="text-blue-400" />
              Account Security
            </h2>

            <p className="text-sm text-slate-400">
              Request a password recovery email. Open its secure link to set a new password.
            </p>

            <button
              onClick={requestPasswordRecovery}
              disabled={saving}
              className="px-5 py-2.5 border border-blue-500 text-blue-400 rounded-lg hover:bg-blue-500/10 disabled:opacity-50"
            >
              Change Password
            </button>

            {/* Only appears after Supabase confirms recovery */}
            {isRecoveryMode && (
              <div className="bg-slate-950 border border-blue-500/30 rounded-xl p-5 space-y-4">

                <h3 className="font-semibold">
                  Set New Password
                </h3>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3"
                />

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3"
                />

                <button
                  onClick={updatePassword}
                  disabled={saving}
                  className="w-full bg-blue-500 hover:bg-blue-600 rounded-lg p-3 font-semibold disabled:opacity-50"
                >
                  Update Password
                </button>

              </div>
            )}

          </section>

        </div>
      </div>
    </div>
  );
}

export default EditProfile;
