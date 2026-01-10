import api from './api';

export const messagingService = {
    // Get all conversations
    getConversations: async () => {
        const response = await api.get('/api/conversations');
        return response.data;
    },

    // Start or get conversation with a user
    startConversation: async (participantId) => {
        const response = await api.post('/api/conversations', { participantId });
        return response.data;
    },

    // Get message history for a conversation
    getMessages: async (conversationId) => {
        const response = await api.get(`/api/messages/${conversationId}`);
        return response.data;
    },

    // Send a message
    sendMessage: async (conversationId, content, messageType = 'text') => {
        const response = await api.post('/api/messages', {
            conversationId,
            content,
            messageType
        });
        return response.data;
    },

    // Search users for new conversation
    searchUsers: async (searchTerm) => {
        const response = await api.get(`/api/users/names?search=${searchTerm}`);
        return response.data;
    },

    // Mark messages as read
    markAsRead: async (conversationId) => {
        const response = await api.put(`/api/messages/read/${conversationId}`);
        return response.data;
    }
};
