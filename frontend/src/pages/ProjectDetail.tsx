import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Upload, Trash2, FileText, FileImage, Download, Building2, Calendar, MapPin, User, Edit, FolderOpen, FileCode } from 'lucide-react';
import { projectAPI, authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Navbar from '@/components/Navbar';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'drawing' | 'spec'>('drawing');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await projectAPI.getOne(id!);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: userData } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await authAPI.getMe();
        return res.data;
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    retry: false,
  });

  const user = userData?.user;

  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => projectAPI.uploadFile(id!, file, fileType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => projectAPI.deleteFile(id!, fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectAPI.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
  });

  const handleFileUpload = () => {
    if (selectedFile) {
      uploadFileMutation.mutate(selectedFile);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'tiff'].includes(ext || '')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const getFileUrl = (filePath: string) => {
    return `${import.meta.env.VITE_API_URL || ''}/${filePath}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar user={user} />

      {/* Action Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/projects')}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              Projects
            </button>
            <span className="text-slate-400">/</span>
            <h1 className="text-lg font-semibold text-slate-800">{project.schoolName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/projects/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this project?')) {
                  deleteProjectMutation.mutate();
                }
              }}
              disabled={deleteProjectMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload File</DialogTitle>
                  <DialogDescription>
                    Upload drawings or specifications for this project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">File Type</label>
                    <select
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value as 'drawing' | 'spec')}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="drawing">Drawing</option>
                      <option value="spec">Specification</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">File</label>
                    <Input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <Button
                    onClick={handleFileUpload}
                    disabled={!selectedFile || uploadFileMutation.isPending}
                    className="w-full"
                  >
                    {uploadFileMutation.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/projects')}
              className="text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              Projects
            </button>
            <span className="text-slate-400">/</span>
            <span className="text-lg font-semibold text-slate-800">{project.schoolName}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Agency</p>
                    <p className="font-medium">{project.agency.name}</p>
                    <p className="text-sm text-muted-foreground">{project.agency.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Project Address</p>
                    <p className="font-medium">{project.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Bid Due Date</p>
                    <p className="font-medium">
                      {format(new Date(project.bidDueDate), 'MMMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pre-Bid Walkthrough</p>
                    <p className="font-medium">
                      {format(new Date(project.preBidWalkthroughDate), 'MMMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>

                {project.agency.contactPersons && project.agency.contactPersons.length > 0 && (
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Persons</p>
                      <div className="space-y-1">
                        {project.agency.contactPersons.map((contact: any) => (
                          <div key={contact.id}>
                            <p className="font-medium">{contact.name}</p>
                            {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                            {contact.phone && <p className="text-sm text-muted-foreground">{contact.phone}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{project.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Files & Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Drawings Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-blue-600" />
                    Drawings
                  </h3>
                  {project.files.filter((f: any) => f.fileType === 'drawing').length === 0 ? (
                    <div className="text-center py-8 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                      <FileCode className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No drawings uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {project.files.filter((f: any) => f.fileType === 'drawing').map((file: any) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getFileIcon(file.fileName)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.fileName}</p>
                              <p className="text-xs text-muted-foreground">Drawing</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(getFileUrl(file.filePath), '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteFileMutation.mutate(file.id)}
                              disabled={deleteFileMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Specs Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    Specifications
                  </h3>
                  {project.files.filter((f: any) => f.fileType === 'spec').length === 0 ? (
                    <div className="text-center py-8 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                      <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No specifications uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {project.files.filter((f: any) => f.fileType === 'spec').map((file: any) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getFileIcon(file.fileName)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.fileName}</p>
                              <p className="text-xs text-muted-foreground">Specification</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(getFileUrl(file.filePath), '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteFileMutation.mutate(file.id)}
                              disabled={deleteFileMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Addendums Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    Addendums
                  </h3>
                  {project.addenda.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                      <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No addendums added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {project.addenda.map((addendum: any) => (
                        <div key={addendum.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {format(new Date(addendum.addendumDate), 'MMMM d, yyyy')}
                              </p>
                              {addendum.attachmentPath && !addendum.noAttachment && (
                                <a
                                  href={getFileUrl(addendum.attachmentPath)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                                >
                                  <Download className="h-3 w-3" />
                                  View attachment
                                </a>
                              )}
                              {addendum.noAttachment && (
                                <p className="text-sm text-muted-foreground mt-1">No attachment</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Drawings</span>
                  </div>
                  <span className="font-semibold">{project.files.filter((f: any) => f.fileType === 'drawing').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Specifications</span>
                  </div>
                  <span className="font-semibold">{project.files.filter((f: any) => f.fileType === 'spec').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">Addendums</span>
                  </div>
                  <span className="font-semibold">{project.addenda.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
