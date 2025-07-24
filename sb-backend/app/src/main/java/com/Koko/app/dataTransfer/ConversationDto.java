package com.Koko.app.dataTransfer;

import com.Koko.app.domain.Conversation;
import com.Koko.app.domain.Profile;

public class ConversationDto {
    private Conversation conversation;

    private long currentUser;
    public ConversationDto(Conversation conversation, Profile currentUser) {
        this.conversation = conversation;
        this.currentUser = currentUser.getId();
    }

    public long getCurrentUser() {
        return currentUser;
    }

    public void setCurrentUser(Profile currentUser) {
        this.currentUser = currentUser.getId();;
    }

    public Conversation getConversation() {
        return conversation;
    }

    public void setConversation(Conversation conversation) {
        this.conversation = conversation;
    }
}
