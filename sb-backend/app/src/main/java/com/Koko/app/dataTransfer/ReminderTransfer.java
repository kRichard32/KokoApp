package com.Koko.app.dataTransfer;

import java.sql.Timestamp;
import com.Koko.app.domain.enumeration.ReminderType;
import com.Koko.app.domain.enumeration.ReminderPriority;
import com.Koko.app.domain.enumeration.ReminderStatus;
import com.Koko.app.domain.enumeration.RecurrenceType;

public class ReminderTransfer {
    
    private Long id;
    private String title;
    private String description;
    private Timestamp reminderDate;
    private ReminderType type;
    private ReminderPriority priority;
    private ReminderStatus status;
    private Long userId;
    private String userFirstName;
    private String userLastName;
    private Long relatedEventId;
    private String relatedEventTitle;
    private Boolean isRecurring;
    private RecurrenceType recurrenceType;
    private String location;
    private Boolean notificationSent;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private Timestamp completedAt;

    // Default constructor
    public ReminderTransfer() {}

    // Constructor for creating new reminders
    public ReminderTransfer(String title, String description, Timestamp reminderDate, 
                           ReminderType type, ReminderPriority priority) {
        this.title = title;
        this.description = description;
        this.reminderDate = reminderDate;
        this.type = type;
        this.priority = priority;
    }

    // Full constructor
    public ReminderTransfer(Long id, String title, String description, Timestamp reminderDate,
                           ReminderType type, ReminderPriority priority, ReminderStatus status,
                           Long userId, String userFirstName, String userLastName,
                           Long relatedEventId, String relatedEventTitle,
                           Boolean isRecurring, RecurrenceType recurrenceType,
                           String location, Boolean notificationSent,
                           Timestamp createdAt, Timestamp updatedAt, Timestamp completedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.reminderDate = reminderDate;
        this.type = type;
        this.priority = priority;
        this.status = status;
        this.userId = userId;
        this.userFirstName = userFirstName;
        this.userLastName = userLastName;
        this.relatedEventId = relatedEventId;
        this.relatedEventTitle = relatedEventTitle;
        this.isRecurring = isRecurring;
        this.recurrenceType = recurrenceType;
        this.location = location;
        this.notificationSent = notificationSent;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.completedAt = completedAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Timestamp getReminderDate() {
        return reminderDate;
    }

    public void setReminderDate(Timestamp reminderDate) {
        this.reminderDate = reminderDate;
    }

    public ReminderType getType() {
        return type;
    }

    public void setType(ReminderType type) {
        this.type = type;
    }

    public ReminderPriority getPriority() {
        return priority;
    }

    public void setPriority(ReminderPriority priority) {
        this.priority = priority;
    }

    public ReminderStatus getStatus() {
        return status;
    }

    public void setStatus(ReminderStatus status) {
        this.status = status;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserFirstName() {
        return userFirstName;
    }

    public void setUserFirstName(String userFirstName) {
        this.userFirstName = userFirstName;
    }

    public String getUserLastName() {
        return userLastName;
    }

    public void setUserLastName(String userLastName) {
        this.userLastName = userLastName;
    }

    public Long getRelatedEventId() {
        return relatedEventId;
    }

    public void setRelatedEventId(Long relatedEventId) {
        this.relatedEventId = relatedEventId;
    }

    public String getRelatedEventTitle() {
        return relatedEventTitle;
    }

    public void setRelatedEventTitle(String relatedEventTitle) {
        this.relatedEventTitle = relatedEventTitle;
    }

    public Boolean getIsRecurring() {
        return isRecurring;
    }

    public void setIsRecurring(Boolean isRecurring) {
        this.isRecurring = isRecurring;
    }

    public RecurrenceType getRecurrenceType() {
        return recurrenceType;
    }

    public void setRecurrenceType(RecurrenceType recurrenceType) {
        this.recurrenceType = recurrenceType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Boolean getNotificationSent() {
        return notificationSent;
    }

    public void setNotificationSent(Boolean notificationSent) {
        this.notificationSent = notificationSent;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Timestamp getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Timestamp completedAt) {
        this.completedAt = completedAt;
    }

    // Utility methods
    public String getFullUserName() {
        if (userFirstName != null && userLastName != null) {
            return userFirstName + " " + userLastName;
        }
        return userFirstName != null ? userFirstName : "";
    }

    public boolean isOverdue() {
        if (status == ReminderStatus.COMPLETED || status == ReminderStatus.CANCELLED) {
            return false;
        }
        return reminderDate != null && reminderDate.before(new Timestamp(System.currentTimeMillis()));
    }

    public boolean isDueToday() {
        if (status == ReminderStatus.COMPLETED || status == ReminderStatus.CANCELLED || reminderDate == null) {
            return false;
        }
        
        Timestamp now = new Timestamp(System.currentTimeMillis());
        Timestamp startOfDay = new Timestamp(now.getTime() - (now.getTime() % (24 * 60 * 60 * 1000)));
        Timestamp endOfDay = new Timestamp(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);
        
        return reminderDate.after(startOfDay) && reminderDate.before(endOfDay);
    }
}
