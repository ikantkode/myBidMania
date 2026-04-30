import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus } from 'lucide-react';
import { calendarAPI, agencyAPI, authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: string;
    projectId: string;
    schoolName: string;
    address: string;
    agency: string;
    agencyId: string;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  const { data: events = [] } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: async () => {
      try {
        const res = await calendarAPI.getEvents();
        return res.data || [];
      } catch (error) {
        console.error('Error fetching calendar events:', error);
        return [];
      }
    },
    retry: false,
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

  // Show loading state while fetching initial data
  if (userData === null || userData === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'bid': return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'walkthrough': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'addendum': return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeBg = (type: string) => {
    switch (type) {
      case 'bid': return 'bg-red-50 border-red-200';
      case 'walkthrough': return 'bg-blue-50 border-blue-200';
      case 'addendum': return 'bg-amber-50 border-amber-200';
      default: return 'bg-gray-50';
    }
  };

  const getEventTypeText = (type: string) => {
    switch (type) {
      case 'bid': return 'Bid Due';
      case 'walkthrough': return 'Walkthrough';
      case 'addendum': return 'Addendum';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar user={user} />

      {/* Action Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h2>
            <p className="text-sm text-slate-500">Track your construction bids and deadlines</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/create-agency')}
              variant="outline"
              size="sm"
            >
              Add Agency
            </Button>
            <Button
              onClick={() => navigate('/projects/new')}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="shadow-xl shadow-slate-200/50 border-0">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/30">
                      📅
                    </div>
                    <CardTitle className="text-xl">Calendar</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-white rounded-xl shadow-inner border border-slate-200 p-4">
                  {events && events.length > 0 ? (
                    <FullCalendar
                      ref={calendarRef}
                      plugins={[dayGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      events={events}
                      eventClick={handleEventClick}
                      headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth'
                      }}
                      height="auto"
                      eventDisplay="block"
                      dayMaxEvents={true}
                      eventDidMount={(info) => {
                        info.el.style.cursor = 'pointer';
                      }}
                      eventClassNames="p-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                      dayHeaderClassNames="text-slate-700 font-semibold text-sm"
                      navLinkClassName="text-blue-600 hover:text-blue-700 font-medium"
                    />
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3">📅</div>
                      <p className="text-slate-500">No upcoming deadlines</p>
                      <Button
                        onClick={() => navigate('/projects/new')}
                        className="mt-4"
                      >
                        Create Your First Project
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="shadow-lg shadow-slate-200/50 border-0 bg-gradient-to-br from-slate-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                    <span className="text-white font-bold">{events?.filter((e: any) => e.extendedProps.type === 'bid').length || 0}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">Bid Due Dates</p>
                    <p className="text-sm text-slate-500">Upcoming deadlines</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg shadow-slate-200/50 border-0 bg-gradient-to-br from-slate-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <span className="text-white font-bold">{events?.filter((e: any) => e.extendedProps.type === 'walkthrough').length || 0}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">Walkthroughs</p>
                    <p className="text-sm text-slate-500">Site visits scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg shadow-slate-200/50 border-0 bg-gradient-to-br from-slate-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <span className="text-white font-bold">{events?.filter((e: any) => e.extendedProps.type === 'addendum').length || 0}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">Addenda</p>
                    <p className="text-sm text-slate-500">Project updates</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg shadow-slate-200/50 border-0 bg-gradient-to-br from-indigo-50 to-white">
              <CardContent className="p-6">
                <Button
                  onClick={() => navigate('/projects')}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30"
                >
                  View All Projects
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">{selectedEvent.title}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {selectedEvent && format(new Date(selectedEvent.start), 'MMMM d, yyyy @ h:mm a')}
            </p>
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">School</p>
                <p className="font-semibold">{selectedEvent.extendedProps.schoolName}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">Agency</p>
                <p className="font-semibold">{selectedEvent.extendedProps.agency}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-600">Address</p>
                <p className="font-semibold">{selectedEvent.extendedProps.address}</p>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                navigate(`/projects/${selectedEvent.extendedProps.projectId}`);
                setSelectedEvent(null);
              }}
            >
              View Project Details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
