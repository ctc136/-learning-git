import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 30000
});

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Transactions
export const getTransactions = (params = {}) => api.get('/transactions', { params });
export const importTransactions = (formData) =>
  api.post('/transactions/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Rules
export const getRules = () => api.get('/rules');
export const createRule = (data) => api.post('/rules', data);
export const updateRule = (id, data) => api.put(`/rules/${id}`, data);
export const reorderRules = (updates) => api.put('/rules/reorder', updates);
export const deleteRule = (id) => api.delete(`/rules/${id}`);

// Accounts
export const getAccounts = () => api.get('/accounts');
export const createAccount = (data) => api.post('/accounts', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);

// Budgets
export const getBudgets = (month) => api.get('/budgets', { params: month ? { month } : {} });
export const updateBudget = (categoryId, budgetAmount) =>
  api.put(`/budgets/${categoryId}`, { budget_amount: budgetAmount });

// Net Worth Snapshots
export const getNetWorthSnapshots = () => api.get('/net-worth');
export const createSnapshot = (data) => api.post('/net-worth', data);
export const updateSnapshot = (id, data) => api.put(`/net-worth/${id}`, data);
export const deleteSnapshot = (id) => api.delete(`/net-worth/${id}`);

export default api;
