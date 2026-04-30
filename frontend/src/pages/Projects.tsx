import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { Plus, Search } from 'lucide-react';
import { projectAPI, agencyAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';

export default function Projects() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await projectAPI.getAll();
      return res.data;
    },
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const res = await agencyAPI.getAll();
      return res.data;
    },
  });

  const getDaysUntilDue = (bidDueDate: string) => {
    const days = differenceInDays(new Date(bidDueDate), new Date());
    if (days < 0) return { text: 'Overdue', color: 'text-red-600' };
    if (days === 0) return { text: 'Due Today', color: 'text-red-600' };
    if (days === 1) return { text: 'Due Tomorrow', color: 'text-orange-600' };
    if (days <= 3) return { text: `Due in ${days} days`, color: 'text-yellow-600' };
    return { text: `Due in ${days} days`, color: 'text-green-600' };
  };

  const filteredProjects = projects?.filter((project: any) =>
    project.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.agency.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />

      {/* Action Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Projects</h2>
            <p className="text-sm text-slate-500">Manage your construction bid projects</p>
          </div>
          <Button
            onClick={() => navigate('/projects/new')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by school name or agency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No projects found</p>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search term' : 'Get started by creating your first project'}
              </p>
              <Button onClick={() => navigate('/projects/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project: any) => {
              const daysStatus = getDaysUntilDue(project.bidDueDate);
              return (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-xl">{project.schoolName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Agency</p>
                      <p className="font-medium">{project.agency.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bid Due Date</p>
                      <p className="font-medium">
                        {format(new Date(project.bidDueDate), 'MMM d, yyyy h:mm a')}
                      </p>
                      <p className={`text-sm font-semibold ${daysStatus.color}`}>
                        {daysStatus.text}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Files</p>
                      <p className="font-medium">{project._count.files} uploaded</p>
                    </div>
                    {project.addenda.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Addenda</p>
                        <p className="font-medium">{project.addenda.length} added</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
