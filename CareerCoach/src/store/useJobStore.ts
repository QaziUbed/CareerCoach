import { create } from 'zustand';
import { get, post, patch, del } from '../services/api';
import notificationService from '../services/notificationService';

export interface Application {
  id: string;
  company_name: string;
  job_title: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected';
  applied_date: string;
  has_optimization?: boolean;
  ats_score?: number;
  notification_id?: string; // Store notification ID for cancellation
}

interface JobState {
  applications: Application[];
  loading: boolean;
  error: string | null;
  fetchApplications: (userId: string) => Promise<void>;
  addApplication: (appData: Omit<Application, 'id'>) => Promise<void>;
  updateApplication: (id: string, appData: Partial<Application>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
}

const useJobStore = create<JobState>((set, getStore) => ({
  applications: [],
  loading: false,
  error: null,

  fetchApplications: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await get<Application[]>('/api/applications');
      set({ applications: response || [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch', loading: false });
    }
  },

  addApplication: async (appData) => {
    const tempId = `temp-${Date.now()}`;
    const newApp = { ...appData, id: tempId } as Application;
    
    // Optimistic UI updates (update list immediately)
    set((state) => ({ applications: [newApp, ...state.applications] }));
    
    try {
      // Sync in background
      const createdApp = await post<Application>('/api/applications', appData);
      
      // Schedule follow-up reminder for 7 days
      const notificationId = await notificationService.scheduleFollowUpReminder(
        createdApp.id,
        createdApp.company_name,
        7
      );
      
      // Update app with notification ID
      const appWithNotification = { ...createdApp, notification_id: notificationId || undefined };
      
      set((state) => ({
        applications: state.applications.map((app) => 
          app.id === tempId ? appWithNotification : app
        )
      }));
    } catch (error) {
      // Rollback on error
      set((state) => ({
        applications: state.applications.filter((app) => app.id !== tempId)
      }));
      throw error;
    }
  },

  updateApplication: async (id, appData) => {
    const previousApps = getStore().applications;
    const app = previousApps.find((a) => a.id === id);
    
    // Cancel notification if status changes to interview/offer/rejected
    if (appData.status && ['interview', 'offer', 'rejected'].includes(appData.status)) {
      if (app?.notification_id) {
        await notificationService.cancelReminder(app.notification_id);
      }
    }
    
    // Optimistic Update
    set((state) => ({
      applications: state.applications.map((app) => 
        app.id === id ? { ...app, ...appData, notification_id: appData.status && ['interview', 'offer', 'rejected'].includes(appData.status) ? undefined : app.notification_id } : app
      )
    }));

    try {
      // Sync in background
      await patch(`/api/applications/${id}`, appData);
    } catch (error) {
      // Rollback
      set({ applications: previousApps });
      throw error;
    }
  },

  deleteApplication: async (id) => {
    const previousApps = getStore().applications;
    
    // Optimistic Update
    set((state) => ({
      applications: state.applications.filter((app) => app.id !== id)
    }));
    
    try {
      // Sync in background
      await del(`/api/applications/${id}`);
    } catch (error) {
      // Rollback
      set({ applications: previousApps });
      throw error;
    }
  }
}));

export default useJobStore;
