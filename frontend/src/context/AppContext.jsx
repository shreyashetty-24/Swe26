import { createContext, useContext, useReducer } from 'react';
import { initialHardwareSets, initialProjects, initialUsers } from '../data/mockData';

const AppContext = createContext(null);

const initialState = {
  currentUser: null,
  users: initialUsers,
  projects: initialProjects,
  hardwareSets: initialHardwareSets,
};

function makeId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function reducer(state, action) {
  switch (action.type) {
    case 'SIGNUP': {
      const newUser = { id: makeId('u'), username: action.username, password: action.password };
      return { ...state, users: [...state.users, newUser], currentUser: newUser };
    }

    case 'LOGIN': {
      return { ...state, currentUser: action.user };
    }

    case 'LOGOUT': {
      return { ...state, currentUser: null };
    }

    case 'CREATE_PROJECT': {
      const newProject = {
        id: makeId('p'),
        name: action.name,
        startDate: action.startDate,
        endDate: action.endDate,
        memberIds: [action.userId],
        checkouts: [],
      };
      return { ...state, projects: [...state.projects, newProject] };
    }

    case 'JOIN_PROJECT': {
      return {
        ...state,
        projects: state.projects.map((p) => {
          if (p.id !== action.projectId) return p;
          if (p.memberIds.includes(action.userId)) return p;
          return { ...p, memberIds: [...p.memberIds, action.userId] };
        }),
      };
    }

    case 'CHECK_OUT_HARDWARE': {
      const checkoutRecord = {
        id: makeId('c'),
        hardwareId: action.hardwareId,
        quantity: action.quantity,
        checkedOutBy: action.byUser,
        checkedOutAt: new Date().toISOString(),
      };
      return {
        ...state,
        hardwareSets: state.hardwareSets.map((h) =>
          h.id === action.hardwareId ? { ...h, available: h.available - action.quantity } : h
        ),
        projects: state.projects.map((p) =>
          p.id === action.projectId ? { ...p, checkouts: [...p.checkouts, checkoutRecord] } : p
        ),
      };
    }

    case 'CHECK_IN_HARDWARE': {
      const project = state.projects.find((p) => p.id === action.projectId);
      const checkout = project?.checkouts.find((c) => c.id === action.checkoutId);
      if (!checkout) return state;
      return {
        ...state,
        hardwareSets: state.hardwareSets.map((h) =>
          h.id === checkout.hardwareId ? { ...h, available: h.available + checkout.quantity } : h
        ),
        projects: state.projects.map((p) =>
          p.id === action.projectId
            ? { ...p, checkouts: p.checkouts.filter((c) => c.id !== action.checkoutId) }
            : p
        ),
      };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  function signup(username, password) {
    if (!username.trim() || !password.trim()) {
      return { ok: false, error: 'Username and password are required.' };
    }
    if (state.users.some((u) => u.username === username)) {
      return { ok: false, error: 'That username is already taken.' };
    }
    dispatch({ type: 'SIGNUP', username, password });
    return { ok: true };
  }

  function login(username, password) {
    const user = state.users.find((u) => u.username === username && u.password === password);
    if (!user) {
      return { ok: false, error: 'Invalid username or password.' };
    }
    dispatch({ type: 'LOGIN', user });
    return { ok: true };
  }

  function logout() {
    dispatch({ type: 'LOGOUT' });
  }

  function createProject(name, startDate, endDate) {
    if (!name.trim() || !startDate || !endDate) {
      return { ok: false, error: 'Name, start date, and end date are all required.' };
    }
    if (endDate < startDate) {
      return { ok: false, error: 'End date cannot be before the start date.' };
    }
    dispatch({ type: 'CREATE_PROJECT', name, startDate, endDate, userId: state.currentUser.id });
    return { ok: true };
  }

  function joinProject(projectId) {
    dispatch({ type: 'JOIN_PROJECT', projectId, userId: state.currentUser.id });
  }

  function checkOutHardware(projectId, hardwareId, quantity) {
    const hw = state.hardwareSets.find((h) => h.id === hardwareId);
    if (!hw) {
      return { ok: false, error: 'Selected hardware could not be found.' };
    }
    if (!quantity || quantity <= 0) {
      return { ok: false, error: 'Quantity must be at least 1.' };
    }
    if (hw.available < quantity) {
      return {
        ok: false,
        error: `Not enough available. Only ${hw.available} ${hw.name} left in the shared pool.`,
      };
    }
    dispatch({
      type: 'CHECK_OUT_HARDWARE',
      projectId,
      hardwareId,
      quantity,
      byUser: state.currentUser.username,
    });
    return { ok: true };
  }

  function checkInHardware(projectId, checkoutId) {
    dispatch({ type: 'CHECK_IN_HARDWARE', projectId, checkoutId });
  }

  const value = {
    currentUser: state.currentUser,
    users: state.users,
    projects: state.projects,
    hardwareSets: state.hardwareSets,
    signup,
    login,
    logout,
    createProject,
    joinProject,
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
