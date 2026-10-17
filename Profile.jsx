import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, ImagePlus, ShieldCheck, Building2, UserCog } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { toast } from "@/components/ui/use-toast";

export default function Profile() {
  const { user, role, isAdmin } = useCurrentUser();
  const { checkUserAuth } = useAuth();
  const [department, setDepartment] = useState(user?.departmentOrBuilding || user?.data?.departmentOrBuilding || "");
  const [appRole, setAppRole] = useState(role);
  const [photo, setPhoto] = useState(user?.profilePhoto || user?.data?.profilePhoto || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setPhoto(file_uri);
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { departmentOrBuilding: department.trim() };
      if (!isAdmin) payload.appRole = appRole;
      if (photo) payload.profilePhoto = photo;
      await base44.auth.updateMe(payload);
      await checkUserAuth();
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <h1 className="font-display font-bold text-2xl tracking-tight mb-6">Profile & Settings</h1>

      <div className="rounded-2xl border border-border bg-card shadow-soft p-6 sm:p-8">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-foreground text-primary-foreground flex items-center justify-center font-bold text-2xl">
            {(user?.full_name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-lg truncate">{user?.full_name || "User"}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[hsl(var(--brand-blue))]/10 text-[hsl(var(--brand-blue))] capitalize">
              <ShieldCheck className="w-3.5 h-3.5" /> {role}
            </span>
          </div>
        </div>

        <div className="space-y-5 pt-6">
          <div>
            <Label>Full name</Label>
            <Input className="mt-1.5 h-11 bg-muted/40" value={user?.full_name || ""} disabled />
            <p className="text-xs text-muted-foreground mt-1">Name is managed by your account.</p>
          </div>

          <div>
            <Label>Profile photo</Label>
            <div className="mt-1.5 flex items-center gap-4">
              {photo ? (
                <img src={photo} alt="profile" className="w-16 h-16 rounded-full object-cover border border-border" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"><UserCog className="w-6 h-6 text-muted-foreground" /></div>
              )}
              <label className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-border hover:bg-muted cursor-pointer text-sm font-medium">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                {uploading ? "Uploading" : "Change photo"}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Stored privately.</p>
          </div>

          <div>
            <Label htmlFor="dept"><Building2 className="w-3.5 h-3.5 inline mr-1" />Department / Building</Label>
            <Input id="dept" className="mt-1.5 h-11" placeholder="e.g. Computer Science Dept / Hostel Block A" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>

          <div>
            <Label>Role</Label>
            {isAdmin ? (
              <div className="mt-1.5 flex items-center gap-2 h-11 px-3 rounded-xl bg-muted/40 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-[hsl(var(--brand-blue))]" /> Administrator (managed by workspace)
              </div>
            ) : (
              <Select value={appRole} onValueChange={setAppRole}>
                <SelectTrigger className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reporter">Reporter — submit & track complaints</SelectItem>
                  <SelectItem value="staff">Maintenance Staff — handle assignments</SelectItem>
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground mt-1.5">Administrator role is assigned by the workspace — users cannot self-assign it.</p>
          </div>

          <div className="pt-2">
            <Button onClick={save} disabled={saving} className="h-11 px-6 gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
