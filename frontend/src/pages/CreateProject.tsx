import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Upload, Building2 } from 'lucide-react';
import { projectAPI, agencyAPI, companyAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Addendum {
  addendumDate: string;
  noAttachment: boolean;
  attachment: File | null;
}

export default function CreateProject() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    schoolName: '',
    description: '',
    bidDueDate: '',
    preBidWalkthroughDate: '',
    address: '',
    agencyId: '',
    contactPersonId: '',
    companyIds: [] as string[],
  });

  const [addenda, setAddenda] = useState<Addendum[]>([]);
  const [error, setError] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);

  const { data: agencies, isLoading: agenciesLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const res = await agencyAPI.getAll();
      return res.data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ['companies', formData.agencyId],
    queryFn: async () => {
      if (!formData.agencyId) return [];
      const res = await companyAPI.getByAgency(formData.agencyId);
      return res.data;
    },
    enabled: !!formData.agencyId,
  });

  // Check if no agencies exist
  useEffect(() => {
    if (!agenciesLoading && !isEditing && agencies && agencies.length === 0) {
      // Show the prompt (handled in render)
    }
  }, [agencies, agenciesLoading, isEditing]);

  // Show prompt if no agencies
  if (!agenciesLoading && !isEditing && agencies && agencies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">No Agency Found</CardTitle>
            <CardDescription>
              You need to create an agency before you can create projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-slate-600">
              Agencies help organize your construction bids and track projects by client or organization.
            </p>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/projects')}
              className="flex-1"
            >
              Back to Projects
            </Button>
            <Button
              onClick={() => navigate('/create-agency')}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Create Agency
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Fetch project data if editing
  const { data: projectData } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await projectAPI.getOne(id);
      return res.data;
    },
    enabled: isEditing,
    onSuccess: (data) => {
      if (data) {
        setFormData({
          schoolName: data.schoolName || '',
          description: data.description || '',
          bidDueDate: data.bidDueDate ? new Date(data.bidDueDate).toISOString().slice(0, 16) : '',
          preBidWalkthroughDate: data.preBidWalkthroughDate ? new Date(data.preBidWalkthroughDate).toISOString().slice(0, 16) : '',
          address: data.address || '',
          agencyId: data.agencyId || '',
          contactPersonId: '',
          companyIds: data.companies?.map((pc: any) => pc.companyId) || [],
        });
        if (data.addenda && data.addenda.length > 0) {
          setAddenda(data.addenda.map((a: any) => ({
            addendumDate: new Date(a.addendumDate).toISOString().slice(0, 16),
            noAttachment: a.noAttachment || false,
            attachment: null,
          })));
        }
      }
    },
  });

  const selectedAgency = agencies?.find((a: any) => a.id === formData.agencyId);

  const createProjectMutation = useMutation({
    mutationFn: projectAPI.create,
    onSuccess: async (data) => {
      const projectId = data.data.id;
      await handleAddenda(projectId);
      setShowFileUpload(true);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${projectId}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create project');
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: any) => projectAPI.update(id!, data),
    onSuccess: async (data) => {
      const projectId = id!;
      await handleAddenda(projectId);
      setShowFileUpload(true);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      navigate(`/projects/${projectId}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update project');
    },
  });

  const handleAddenda = async (projectId: string) => {
    if (addenda.length > 0) {
      for (const addendum of addenda) {
        if (addendum.attachment && !addendum.noAttachment) {
          await projectAPI.uploadFile(projectId, addendum.attachment, 'spec');
        }

        await projectAPI.addAddendum(projectId, {
          addendumDate: addendum.addendumDate,
          noAttachment: addendum.noAttachment,
          hasAttachment: !!addendum.attachment,
          attachmentPath: addendum.attachment && !addendum.noAttachment ? 'pending' : null,
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'agencyId') {
      // Reset companyIds when agency changes
      setFormData(prev => ({ ...prev, [field]: value, companyIds: [] }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAddAddendum = () => {
    setAddenda([...addenda, { addendumDate: '', noAttachment: false, attachment: null }]);
  };

  const handleRemoveAddendum = (index: number) => {
    setAddenda(addenda.filter((_, i) => i !== index));
  };

  const handleUpdateAddendum = (index: number, field: keyof Addendum, value: any) => {
    const newAddenda = [...addenda];
    newAddenda[index][field] = value;
    setAddenda(newAddenda);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.agencyId) {
      setError('Please select an agency');
      return;
    }

    for (const addendum of addenda) {
      if (addendum.addendumDate && !addendum.noAttachment && !addendum.attachment) {
        setError('All addenda must have an attachment unless "No attachment" is checked');
        return;
      }
    }

    const projectData = {
      ...formData,
      bidDueDate: new Date(formData.bidDueDate).toISOString(),
      preBidWalkthroughDate: new Date(formData.preBidWalkthroughDate).toISOString(),
      companyIds: formData.companyIds,
      addenda: addenda.filter(a => a.addendumDate).map(a => ({
        addendumDate: new Date(a.addendumDate).toISOString(),
        noAttachment: a.noAttachment,
        hasAttachment: !!a.attachment,
        attachmentPath: null,
      })),
    };

    if (isEditing) {
      updateProjectMutation.mutate(projectData);
    } else {
      createProjectMutation.mutate(projectData);
    }
  };

  if (showFileUpload) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Upload drawings and specifications for your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Project Created Successfully!</p>
                <p className="text-muted-foreground mb-4">
                  You can upload files from the project detail page
                </p>
                <Button onClick={() => navigate('/')}>
                  Go to Calendar
                </Button>
                <Button
                  variant="outline"
                  className="ml-2"
                  onClick={() => navigate('/projects')}
                >
                  View All Projects
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{isEditing ? 'Edit Project' : 'Create New Project'}</CardTitle>
            <CardDescription>
              {isEditing ? 'Update the project details' : 'Enter the details for your construction bid project'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name/Code *</Label>
                <Input
                  id="schoolName"
                  placeholder="e.g., Lincoln Elementary School - LES-001"
                  value={formData.schoolName}
                  onChange={(e) => handleInputChange('schoolName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bidDueDate">Bid Due Date *</Label>
                  <Input
                    id="bidDueDate"
                    type="datetime-local"
                    value={formData.bidDueDate}
                    onChange={(e) => handleInputChange('bidDueDate', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preBidWalkthroughDate">Pre-Bid Walkthrough Date *</Label>
                  <Input
                    id="preBidWalkthroughDate"
                    type="datetime-local"
                    value={formData.preBidWalkthroughDate}
                    onChange={(e) => handleInputChange('preBidWalkthroughDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agency">Agency *</Label>
                  <Select
                    value={formData.agencyId}
                    onValueChange={(value) => handleInputChange('agencyId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agency" />
                    </SelectTrigger>
                    <SelectContent>
                      {agencies?.map((agency: any) => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAgency && selectedAgency.contactPersons.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person (Optional)</Label>
                    <Select
                      value={formData.contactPersonId}
                      onValueChange={(value) => handleInputChange('contactPersonId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No contact</SelectItem>
                        {selectedAgency.contactPersons.map((contact: any) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {companies && companies.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold">Companies (Optional)</h3>
                    <p className="text-sm text-slate-500">Select companies that work with this agency</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {companies.map((company: any) => (
                      <label
                        key={company.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.companyIds.includes(company.id)
                            ? 'bg-green-50 border-green-500'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Checkbox
                          id={`company-${company.id}`}
                          checked={formData.companyIds.includes(company.id)}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              companyIds: checked
                                ? [...prev.companyIds, company.id]
                                : prev.companyIds.filter(id => id !== company.id)
                            }));
                          }}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-sm">{company.name}</span>
                          {company.email && (
                            <div className="text-xs text-slate-500">{company.email}</div>
                          )}
                          {company.phone && (
                            <div className="text-xs text-slate-500">{company.phone}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Addenda (Optional)</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAddendum}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Addendum
                  </Button>
                </div>

                {addenda.map((addendum, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveAddendum(index)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="space-y-2">
                      <Label>Addendum Date</Label>
                      <Input
                        type="datetime-local"
                        value={addendum.addendumDate}
                        onChange={(e) => handleUpdateAddendum(index, 'addendumDate', e.target.value)}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`no-attachment-${index}`}
                        checked={addendum.noAttachment}
                        onCheckedChange={(checked) =>
                          handleUpdateAddendum(index, 'noAttachment', checked)
                        }
                      />
                      <Label htmlFor={`no-attachment-${index}`} className="text-sm">
                        No attachment for this addendum
                      </Label>
                    </div>

                    {!addendum.noAttachment && (
                      <div className="space-y-2">
                        <Label>Attachment</Label>
                        <Input
                          type="file"
                          onChange={(e) =>
                            handleUpdateAddendum(index, 'attachment', e.target.files?.[0] || null)
                          }
                          disabled={addendum.noAttachment}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                className="flex-1"
              >
                {(createProjectMutation.isPending || updateProjectMutation.isPending)
                  ? isEditing ? 'Updating...' : 'Creating...'
                  : isEditing ? 'Update Project' : 'Create Project'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
