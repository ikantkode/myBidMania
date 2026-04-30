import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, ArrowLeft } from 'lucide-react';
import { companyAPI, agencyAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';

export default function CreateCompany() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    agencyIds: [] as string[],
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const res = await agencyAPI.getAll();
      return res.data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (formData.agencyIds.length === 0) {
        setError('Please select at least one agency');
        setIsSubmitting(false);
        return;
      }

      await companyAPI.create(formData);
      navigate('/directory');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create company');
      setIsSubmitting(false);
    }
  };

  const toggleAgency = (agencyId: string) => {
    setFormData((prev) => ({
      ...prev,
      agencyIds: prev.agencyIds.includes(agencyId)
        ? prev.agencyIds.filter((id) => id !== agencyId)
        : [...prev.agencyIds, agencyId],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/directory')}
          className="mb-6 text-slate-600 hover:text-slate-900 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </button>

        <Card className="max-w-2xl mx-auto shadow-xl border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg shadow-green-500/30">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Add Company</CardTitle>
                <CardDescription>Add a new company to your directory</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="company@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <Label>Agencies * (select at least one)</Label>
                <p className="text-sm text-slate-500 mb-3">Choose which agencies this company works with</p>
                <div className="space-y-2">
                  {!agencies || agencies.length === 0 ? (
                    <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                      No agencies available. Please create an agency first.
                    </div>
                  ) : (
                    agencies.map((agency: any) => (
                      <label
                        key={agency.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.agencyIds.includes(agency.id)
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.agencyIds.includes(agency.id)}
                          onChange={() => toggleAgency(agency.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="flex-1 font-medium">{agency.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/directory')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !agencies || agencies.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isSubmitting ? 'Creating...' : 'Add Company'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
