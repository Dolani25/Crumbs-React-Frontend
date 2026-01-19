
import { dummyCourses } from './dummyCourses.js';

const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

// Create Wrapper for verify-less requests (if needed) or just standard axios instance
// For now, simple fetch wrapper
const api = {
    get: async (url) => {
        const token = localStorage.getItem('crumbs_token');
        const res = await fetch(`${API_URL}${url}`, {
            headers: { 'x-auth-token': token }
        });
        if (!res.ok) throw new Error(res.statusText);
        return { data: await res.json() };
    },
    post: async (url, body) => {
        const token = localStorage.getItem('crumbs_token');
        const res = await fetch(`${API_URL}${url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(res.statusText);
        return { data: await res.json() };
    },
    put: async (url, body) => {
        const token = localStorage.getItem('crumbs_token');
        const res = await fetch(`${API_URL}${url}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(res.statusText);
        return { data: await res.json() };
    },
    delete: async (url) => {
        const token = localStorage.getItem('crumbs_token');
        const res = await fetch(`${API_URL}${url}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });
        if (!res.ok) throw new Error(res.statusText);
        return { data: await res.json() };
    }
};

// Auth Services
export const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
        localStorage.setItem('crumbs_token', res.data.token);
    }
    return res.data;
};

export const signup = async (username, email, password) => {
    const res = await api.post('/auth/signup', { username, email, password });
    if (res.data.token) {
        localStorage.setItem('crumbs_token', res.data.token);
    }
    return res.data;
};

export const loadUser = async () => {
    try {
        const res = await api.get('/auth/me');
        return res.data;
    } catch (err) {
        // If token fails, clear it
        localStorage.removeItem('crumbs_token');
        throw err;
    }
};

export const logout = () => {
    localStorage.removeItem('crumbs_token');
    localStorage.removeItem('crumbs_courses'); // Fix: Privacy Leak
};

export const updateXP = async (amount, action) => {
    const res = await api.post('/auth/xp', { amount, action });
    return res.data;
};

export const syncPlanner = async (plannerData) => {
    const res = await api.put('/auth/planner', { planner: plannerData });
    return res.data;
};

export const getPlanner = async () => {
    const res = await api.get('/auth/planner');
    return res.data;
};

// Course Services
export const getCourses = async () => {
    const res = await api.get('/courses');
    return res.data;
};

export const createCourse = async (courseData) => {
    const res = await api.post('/courses', courseData);
    return res.data;
};

export const deleteCourse = async (courseId) => {
    const res = await api.delete(`/courses/${courseId}`);
    return res.data;
};

// Sync Service
export const syncCourses = async (courses) => {
    const res = await api.post('/courses/sync', { courses });
    return res.data; // Returns merged/synced courses
};


// --- COMMUNITY ---
export const getPublicCourses = async () => {
    // If mock mode or no backend, return empty array to prevent crash
    try {
        const res = await api.get('/courses/public');
        return res.data;
    } catch (e) {
        console.warn("Could not fetch public courses", e);
        return [];
    }
};

export const publishCourse = async (courseId) => {
    const res = await api.put(`/courses/publish/${courseId}`);
    return res.data;
};

export const likeCourse = async (courseId) => {
    const res = await api.put(`/courses/like/${courseId}`);
    return res.data; // Returns updated likes array
};

export default api;
