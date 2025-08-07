package com.Koko.app.domain;

import java.sql.Timestamp;

import com.Koko.app.domain.enumeration.RecurrenceType;
import com.Koko.app.domain.enumeration.ReminderPriority;
import com.Koko.app.domain.enumeration.ReminderStatus;
import com.Koko.app.domain.enumeration.ReminderType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "reminders")
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "reminder_date", nullable = false)
    private Timestamp reminderDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReminderType type = ReminderType.PERSONAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReminderPriority priority = ReminderPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReminderStatus status = ReminderStatus.PENDING;

    // Owner of the reminder
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Profile user;

    // Optional: Related event if this is an event reminder
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event relatedEvent;

    @Column(name = "is_recurring")
    private Boolean isRecurring = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "recurrence_type")
    private RecurrenceType recurrenceType;

    @Column(name = "location")
    private String location;

    @Column(name = "notification_sent")
    private Boolean notificationSent = false;

    @Column(name = "created_at", nullable = false)
    private Timestamp createdAt;


    // Constructors
    public Reminder() {
        this.createdAt = new Timestamp(System.currentTimeMillis());
        this.type = ReminderType.PERSONAL;
        this.priority = ReminderPriority.MEDIUM;
        this.status = ReminderStatus.PENDING;
        this.isRecurring = false;
        this.notificationSent = false;
    }

    public Reminder(String title, String description, Timestamp reminderDate, Profile user) {
        this();
        this.title = title;
        this.description = description;
        this.reminderDate = reminderDate;
        this.user = user;
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

    public Profile getUser() {
        return user;
    }

    public void setUser(Profile user) {
        this.user = user;
    }

    public Event getRelatedEvent() {
        return relatedEvent;
    }

    public void setRelatedEvent(Event relatedEvent) {
        this.relatedEvent = relatedEvent;
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


    // Utility methods
    public boolean isOverdue() {
        if (status == ReminderStatus.COMPLETED || status == ReminderStatus.CANCELLED) {
            return false;
        }
        return reminderDate.before(new Timestamp(System.currentTimeMillis()));
    }

    public boolean isDueToday() {
        if (status == ReminderStatus.COMPLETED || status == ReminderStatus.CANCELLED) {
            return false;
        }
        
        Timestamp now = new Timestamp(System.currentTimeMillis());
        Timestamp startOfDay = new Timestamp(now.getTime() - (now.getTime() % (24 * 60 * 60 * 1000)));
        Timestamp endOfDay = new Timestamp(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);
        
        return reminderDate.after(startOfDay) && reminderDate.before(endOfDay);
    }

    public boolean isDueWithinHours(int hours) {
        if (status == ReminderStatus.COMPLETED || status == ReminderStatus.CANCELLED) {
            return false;
        }
        
        Timestamp now = new Timestamp(System.currentTimeMillis());
        Timestamp futureTime = new Timestamp(now.getTime() + (hours * 60 * 60 * 1000L));
        
        return reminderDate.after(now) && reminderDate.before(futureTime);
    }

    public void markAsCompleted() {
        this.status = ReminderStatus.COMPLETED;
    }

    public void markAsCancelled() {
        this.status = ReminderStatus.CANCELLED;
    }

    public boolean belongsToUser(Profile user) {
        return this.user != null && this.user.equals(user);
    }
}
