import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { loginRequest, signupRequest } from '../api/authApi';
import { fetchHardware } from '../api/hardwareApi';
import {
  checkInRequest,
  checkOutRequest,
  createProjectRequest,
  fetchProjects,
  joinProjectRequest,
  leaveProjectRequest,
} from '../api/projectsApi';

const AppContext = createContext(null);

// Projects and hardware now live in MongoDB (via the backend); this state is
// just a cache of what the server last told us for the logged-in user.
const initialState = {
  currentUser: null,
  projects: [],
  hardwareSets: [],
  isLoading: false,
  loadError: '',
};

function upsertProject(projects, project) {
  const exists = projects.some((p) => p.id === project.id);
  return exists ? projects.map((p) => (p.id === project.id ? project : p)) : [...projects, project];
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...initialState, currentUser: action.user, isLoading: true };

    case 'LOGOUT':
      return initialState;

    case 'DATA_LOADED':
      return {
        ...state,
        isLoading: false,
        loadError: action.error,
        projects: action.projects,
        hardwareSets: action.hardwareSets,
      };

    case 'PROJECT_SAVED':
      return { ...state, projects: upsertProject(state.projects, action.project) };

    case 'PROJECT_REMOVED':
      return { ...state, projects: state.projects.filter((p) => p.id !== action.projectId) };

    case 'HARDWARE_SET':
      return { ...state, hardwareSets: action.hardwareSets };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const userId = state.currentUser?.id;

  // Load this user's projects and the global hardware pool after login.
  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;

    Promise.all([fetchProjects(userId), fetchHardware(userId)]).then(([p, h]) => {
      if (cancelled) return;
      dispatch({
        type: 'DATA_LOADED',
        projects: p.ok ? p.projects : [],
        hardwareSets: h.ok ? h.hardwareSets : [],
        error: p.ok && h.ok ? '' : p.error || h.error,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ---- auth --------------------------------------------------------------

  async function authenticate(requestFn, username, password) {
    if (!username.trim() || !password.trim()) {
      return { ok: false, error: 'Username and password are required.' };
    }
    const result = await requestFn(username, password);
    if (!result.ok) return result;
    dispatch({ type: 'LOGIN', user: result.user });
    return { ok: true };
  }

  const signup = (username, password) => authenticate(signupRequest, username, password);
  const login = (username, password) => authenticate(loginRequest, username, password);

  function logout() {
    dispatch({ type: 'LOGOUT' });
  }

  // ---- projects ----------------------------------------------------------

  // Project ids are chosen by the user; the server validates and enforces
  // uniqueness (case-insensitive).
  async function createProject({ id, name, startDate, endDate }) {
    const result = await createProjectRequest(userId, { id, name, startDate, endDate });
    if (result.ok) dispatch({ type: 'PROJECT_SAVED', project: result.project });
    return result;
  }

  // Projects can only be joined by entering the exact project ID.
  async function joinProject(rawId) {
    if (!rawId.trim()) return { ok: false, error: 'Please enter a project ID.' };
    const result = await joinProjectRequest(userId, rawId.trim());
    if (result.ok) dispatch({ type: 'PROJECT_SAVED', project: result.project });
    return result;
  }

  // Members can leave; the server refuses if you're the project's leader.
  async function leaveProject(projectId) {
    const result = await leaveProjectRequest(userId, projectId);
    if (result.ok) dispatch({ type: 'PROJECT_REMOVED', projectId });
    return result;
  }

  function getProject(id) {
    const wanted = (id ?? '').toLowerCase();
    return state.projects.find((p) => p.id.toLowerCase() === wanted);
  }

  function isLeader(project) {
    return project.leaderId === userId;
  }

  // ---- hardware ----------------------------------------------------------

  const refreshHardware = useCallback(async () => {
    if (!userId) return;
    const result = await fetchHardware(userId);
    if (result.ok) dispatch({ type: 'HARDWARE_SET', hardwareSets: result.hardwareSets });
  }, [userId]);

  async function applyHardwareChange(requestFn, projectId, hardwareId, quantity) {
    const result = await requestFn(userId, projectId, hardwareId, quantity);
    if (result.ok) {
      dispatch({ type: 'PROJECT_SAVED', project: result.project });
      dispatch({ type: 'HARDWARE_SET', hardwareSets: result.hardwareSets });
    }
    return result;
  }

  const checkOutHardware = (projectId, hardwareId, quantity) =>
    applyHardwareChange(checkOutRequest, projectId, hardwareId, quantity);

  // Check in any amount up to what the project currently holds.
  const checkInHardware = (projectId, hardwareId, quantity) =>
    applyHardwareChange(checkInRequest, projectId, hardwareId, quantity);

  const value = {
    currentUser: state.currentUser,
    projects: state.projects,
    hardwareSets: state.hardwareSets,
    isLoading: state.isLoading,
    loadError: state.loadError,
    signup,
    login,
    logout,
    getProject,
    isLeader,
    createProject,
    joinProject,
    leaveProject,
    refreshHardware,
    checkOutHardware,
    checkInHardware,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
