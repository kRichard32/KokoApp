package com.kindial.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class ConversationTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    public static Conversation getConversationSample1() {
        return new Conversation()
            .id(1L)
            .lastMessageID("lastMessageID1")
            .createdAt("createdAt1")
            .updatedAt("updatedAt1")
            .conversationName("conversationName1");
    }

    public static Conversation getConversationSample2() {
        return new Conversation()
            .id(2L)
            .lastMessageID("lastMessageID2")
            .createdAt("createdAt2")
            .updatedAt("updatedAt2")
            .conversationName("conversationName2");
    }

    public static Conversation getConversationRandomSampleGenerator() {
        return new Conversation()
            .id(longCount.incrementAndGet())
            .lastMessageID(UUID.randomUUID().toString())
            .createdAt(UUID.randomUUID().toString())
            .updatedAt(UUID.randomUUID().toString())
            .conversationName(UUID.randomUUID().toString());
    }
}
