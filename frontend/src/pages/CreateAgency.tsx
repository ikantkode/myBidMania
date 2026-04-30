import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2, Plus, X } from 'lucide-react';
import { agencyAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ContactPerson {
  name: string;
  email: string;
  phone: string;
}

export default function CreateAgency() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [agencyName, setAgencyName] = useState('');
  const [address, setAddress] = useState('');
  const [contacts, setContacts] = useState<ContactPerson[]>([{ name: '', email: '', phone: '' }]);
  const [error, setError] = useState('');

  // Fetch agency data if editing
  const { data: agencyData } = useQuery({
    queryKey: ['agency', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await agencyAPI.getOne(id);
      return res.data;
    },
    enabled: isEditing,
    onSuccess: (data) => {
      if (data) {
        setAgencyName(data.name);
        setAddress(data.address);
        if (data.contactPersons && data.contactPersons.length > 0) {
          setContacts(data.contactPersons.map((c: any) => ({
            name: c.name,
            email: c.email || '',
            phone: c.phone || '',
          })));
        }
      }
    },
  });

  const createAgencyMutation = useMutation({
    mutationFn: async (agencyData: { name: string; address: string }) => {
      const response = await agencyAPI.create(agencyData);
      return response;
    },
    onSuccess: async (data) => {
      const agencyId = data.data.id;

      try {
        for (const contact of contacts) {
          if (contact.name.trim()) {
            await agencyAPI.addContact(agencyId, contact);
          }
        }
        navigate('/agencies', { replace: true });
      } catch (contactError) {
        navigate('/agencies', { replace: true });
      }
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create agency';
      setError(errorMessage);
    },
  });

  const updateAgencyMutation = useMutation({
    mutationFn: (data: { name: string; address: string }) => {
      if (!id) throw new Error('Agency ID is required');
      return agencyAPI.update(id, data);
    },
    onSuccess: async () => {
      navigate('/agencies', { replace: true });
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update agency';
      setError(errorMessage);
    },
  });

  const addContact = () => {
    setContacts([...contacts, { name: '', email: '', phone: '' }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const updateContact = (index: number, field: keyof ContactPerson, value: string) => {
    const newContacts = [...contacts];
    newContacts[index][field] = value;
    setContacts(newContacts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agencyName.trim() || !address.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (isEditing) {
      updateAgencyMutation.mutate({ name: agencyName, address });
    } else {
      createAgencyMutation.mutate({ name: agencyName, address });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {isEditing ? 'Edit Agency' : 'Create Your Agency'}
            </CardTitle>
          </div>
          <CardDescription>
            {isEditing
              ? 'Update your agency information'
              : 'Before you can create projects, you need to set up your agency information'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Agency Information</h3>
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name *</Label>
                <Input
                  id="agencyName"
                  type="text"
                  placeholder="e.g., ABC Construction Co."
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="e.g., 123 Main St, City, State ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Contact Persons (Optional)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addContact}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Contact
                </Button>
              </div>

              {contacts.map((contact, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3 relative bg-white">
                  {contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={contact.name}
                      onChange={(e) => updateContact(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email (Optional)</Label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={contact.email}
                      onChange={(e) => updateContact(index, 'email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone (Optional)</Label>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={contact.phone}
                      onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/agencies')}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={createAgencyMutation.isPending || updateAgencyMutation.isPending}
            >
              {(createAgencyMutation.isPending || updateAgencyMutation.isPending)
                ? isEditing ? 'Updating...' : 'Creating...'
                : isEditing ? 'Update Agency' : 'Create Agency'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
