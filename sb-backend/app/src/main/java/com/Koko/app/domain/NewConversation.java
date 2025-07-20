package com.Koko.app.domain;

import com.Koko.app.dataTransfer.ConversationTransfer;
import com.Koko.app.dataTransfer.MessageTransfer;

public class NewConversation {
    private ConversationTransfer conversationTransfer;
    private MessageTransfer messageTransfer;

    public MessageTransfer getMessageTransfer() {
        return messageTransfer;
    }

    public ConversationTransfer getConversationTransfer() {
        return conversationTransfer;
    }
    public NewConversation(ConversationTransfer conversationTransfer, MessageTransfer messageTransfer) {
        this.conversationTransfer = conversationTransfer;
        this.messageTransfer = messageTransfer;
    }
}
