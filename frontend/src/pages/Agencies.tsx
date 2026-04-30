import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Building2, FileText, Users } from 'lucide-react';
import { agencyAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
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

export default function Agencies() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agencyToDelete, setAgencyToDelete] = useState<any>(null);

  const { data: agencies, isLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const res = await agencyAPI.getAll();
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (agencyId: string) => agencyAPI.delete(agencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] });
      setDeleteDialogOpen(false);
      setAgencyToDelete(null);
    },
  });

  const handleDeleteClick = (agency: any) => {
    if (agency._count?.projects > 0) {
      alert('Cannot delete agency with associated projects. Please delete the projects first.');
      return;
    }
    setAgencyToDelete(agency);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (agencyToDelete) {
      deleteMutation.mutate(agencyToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />

      {/* Action Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Agencies</h2>
            <p className="text-sm text-slate-500">Manage your client agencies</p>
          </div>
          <Button
            onClick={() => navigate('/create-agency')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Agency
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {agencies && agencies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agencies.map((agency: any) => (
              <Card key={agency.id} className="shadow-xl shadow-slate-200/50 border-0 hover:shadow-2xl transition-shadow">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/30">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{agency.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          ID: {agency.id.slice(0, 8)}...
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-slate-500 mt-0.5" />
                      <p className="text-sm text-slate-700">{agency.address}</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-slate-500 mt-0.5" />
                      <div className="text-sm text-slate-700">
                        <p className="font-medium">{agency.contactPersons?.length || 0} Contact Persons</p>
                        {agency.contactPersons && agency.contactPersons.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {agency.contactPersons.slice(0, 2).map((contact: any) => (
                              <p key={contact.id} className="text-xs text-slate-600">
                                {contact.name}
                                {contact.email && <span className="ml-2 text-slate-500">({contact.email})</span>}
                              </p>
                            ))}
                            {agency.contactPersons.length > 2 && (
                              <p className="text-xs text-slate-500">
                                +{agency.contactPersons.length - 2} more
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        {agency._count?.projects || 0} Projects
                      </p>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => navigate(`/agencies/${agency.id}/edit`)}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteClick(agency)}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                        disabled={agency._count?.projects > 0}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>

                    {agency._count?.projects > 0 && (
                      <p className="text-xs text-slate-500 text-center">
                        Cannot delete agency with projects
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-xl border-0">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-16 w-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Agencies Yet</h3>
              <p className="text-slate-500 mb-6">Create your first agency to get started</p>
              <Button
                onClick={() => navigate('/create-agency')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Agency
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agency</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{agencyToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setAgencyToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
