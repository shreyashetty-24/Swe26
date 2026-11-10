import { createContext, useContext, useEffect, useReducer } from 'react';
import { loginRequest, signupRequest } from '../api/authApi';
import {
  checkInHardwareRequest,
  checkOutHardwareRequest,
  createProjectRequest,
  fetchHardware,
  fetchProjects,
  joinProjectRequest,
  leaveProjectRequest,
} from '../api/appApi';

const AppContext = createContext(null);

const initialState = {
  currentUser: null,
  projects: [],
  hardwareSets: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN': {
      return { ...state, currentUser: action.user };
    }

    case 'LOGOUT': {
      return { ...state, currentUser: null };
    }

    case 'SET_PROJECTS': {
      return { ...state, projects: action.projects };
    }

    case 'SET_HARDWARE': {
      return { ...state, hardwareSets: action.hardwareSets };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  async function refreshProjects() {
    const result = await fetchProjects();
    if (result.ok) {
      dispatch({ type: 'SET_PROJECTS', projects: result.projects });
    }
  }

  async function refreshHardware() {
    const result = await fetchHardware();
    if (result.ok) {
      dispatch({ type: 'SET_HARDWARE', hardwareSets: result.hardwareSets });
    }
  }

  // Projects & hardware sets now live on the backend (simple local JSON
  // files -- see backend/project_store.py and backend/hardware_store.py)
  // instead of in-memory mock data, so load them once up front.
  useEffect(() => {
    refreshProjects();
    refreshHardware();
  }, []);

  // Signup/login both call the very basic backend API (see ../../backend)
  // instead of keeping credentials in memory. The backend persists users
  // to a local encrypted text file.
  async function signup(username, password) {
    if (!username.trim() || !password.trim()) {
      return { ok: false, error: 'Username and password are required.' };
    }
    const result = await signupRequest(username, password);
    if (!result.ok) {
      return result;
    }
    dispatch({ type: 'LOGIN', user: result.user });
    return { ok: true };
  }

  async function login(username, password) {
    if (!username.trim() || !password.trim()) {
      return { ok: false, error: 'Username and password are required.' };
    }
    const result = await loginRequest(username, password);
    if (!result.ok) {
      return result;
    }
    dispatch({ type: 'LOGIN', user: result.user });
    return { ok: true };
  }

  function logout() {
    dispatch({ type: 'LOGOUT' });
  }

  async function createProject(name, startDate, endDate) {
    if (!name.trim() || !startDate || !endDate) {
      return { ok: false, error: 'Name, start date, and end date are all required.' };
    }
    if (endDate < startDate) {
      return { ok: false, error: 'End date cannot be before the start date.' };
    }
    const result = await createProjectRequest(name, startDate, endDate, state.currentUser.id);
    if (!result.ok) {
      return result;
    }
    await refreshProjects();
    return { ok: true, project: result.project };
  }

  // Projects can only be joined by entering the exact project ID (no browse-and-join button).
  async function joinProject(rawId) {
    const projectId = rawId.trim().toUpperCase();
    if (!projectId) {
      return { ok: false, error: 'Please enter a project ID.' };
    }
    const result = await joinProjectRequest(projectId, state.currentUser.id);
    if (!result.ok) {
      return result;
    }
    await refreshProjects();
    return { ok: true, project: result.project };
  }

  async function leaveProject(projectId) {
    const result = await leaveProjectRequest(projectId, state.currentUser.id);
    if (!result.ok) {
      return result;
    }
    await refreshProjects();
    return { ok: true, project: result.project };
  }

  async function checkOutHardware(projectId, hardwareId, quantity) {
    if (!quantity || quantity <= 0) {
      return { ok: false, error: 'Quantity must be at least 1.' };
    }
    const result = await checkOutHardwareRequest(projectId, hardwareId, quantity);
    if (!result.ok) {
      return result;
    }
    await Promise.all([refreshProjects(), refreshHardware()]);
    return { ok: true };
  }

  async function checkInHardware(projectId, checkoutId) {
    const result = await checkInHardwareRequest(projectId, checkoutId);
    if (!result.ok) {
      return result;
    }
    await Promise.all([refreshProjects(), refreshHardware()]);
    return { ok: true };
  }

  const value = {
    currentUser: state.currentUser,
    projects: state.projects,
    hardwareSets: state.hardwareSets,
    signup,
    login,
    logout,
    createProject,
    joinProject,
    leaveProject,
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
