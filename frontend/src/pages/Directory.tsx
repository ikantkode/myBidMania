import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Building, Users, FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { agencyAPI, companyAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';

export default function Directory() {
  const [activeTab, setActiveTab] = useState<'agencies' | 'companies'>('agencies');

  const { data: agencies, isLoading: agenciesLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const res = await agencyAPI.getAll();
      return res.data;
    },
    enabled: activeTab === 'agencies',
  });

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await companyAPI.getAll();
      return res.data;
    },
    enabled: activeTab === 'companies',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Directory</h1>
          <p className="text-sm text-slate-500">Manage your agencies and companies</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('agencies')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'agencies'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Agencies
                {agencies && <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">{agencies.length}</span>}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'companies'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Companies
                {companies && <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">{companies.length}</span>}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'agencies' ? (
          <AgenciesTab agencies={agencies} isLoading={agenciesLoading} />
        ) : (
          <CompaniesTab companies={companies} isLoading={companiesLoading} />
        )}
      </div>
    </div>
  );
}

function AgenciesTab({ agencies, isLoading }: { agencies: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!agencies || agencies.length === 0) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Building2 className="h-16 w-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No Agencies Yet</h3>
          <p className="text-slate-500 mb-6">Create your first agency to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CompaniesTab({ companies, isLoading }: { companies: any[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <Card className="shadow-xl border-0">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Building className="h-16 w-16 text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No Companies Yet</h3>
          <p className="text-slate-500 mb-6">Add companies to your directory</p>
          <Button
            onClick={() => window.location.href = '/create-company'}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => window.location.href = '/create-company'}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company: any) => (
          <Card key={company.id} className="shadow-xl shadow-slate-200/50 border-0 hover:shadow-2xl transition-shadow">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg shadow-green-500/30">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {company._count?.projects || 0} projects
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {company.email && (
                  <div className="text-sm">
                    <span className="text-slate-600">Email:</span>
                    <span className="ml-2 text-slate-800">{company.email}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="text-sm">
                    <span className="text-slate-600">Phone:</span>
                    <span className="ml-2 text-slate-800">{company.phone}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-600 mb-2">Works with:</p>
                  <div className="flex flex-wrap gap-1">
                    {company.agencies.map((ca: any) => (
                      <span
                        key={ca.id}
                        className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                      >
                        {ca.agency.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
