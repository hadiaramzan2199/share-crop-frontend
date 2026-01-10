import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

export const userDocumentsService = {
    getUserDocuments: (userId) => axios.get(`${API_URL}/user-documents/user/${userId}`),
    addDocument: (docData) => axios.post(`${API_URL}/user-documents`, docData),
    deleteDocument: (id) => axios.delete(`${API_URL}/user-documents/${id}`)
};
