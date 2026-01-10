import api from './api';

export const userDocumentsService = {
    getUserDocuments: (userId) => api.get(`/api/user-documents/user/${userId}`),
    addDocument: (docData) => api.post('/api/user-documents', docData),
    deleteDocument: (id) => api.delete(`/api/user-documents/${id}`)
};
