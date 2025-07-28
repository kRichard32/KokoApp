package com.Koko.app.service;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.Koko.app.domain.Profile;
import com.Koko.app.domain.Reminder;
import com.Koko.app.domain.enumeration.ReminderStatus;
import com.Koko.app.domain.enumeration.ReminderPriority;
import com.Koko.app.repositories.ReminderRepository;

@Service
@Transactional
public class ReminderService {

    @Autowired
    private ReminderRepository reminderRepository;

    /**
     * Create a new reminder
     */
    public Reminder createReminder(Reminder reminder) {
        if (reminder.getCreatedAt() == null) {
            reminder.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        }
        return reminderRepository.save(reminder);
    }

    /**
     * Update an existing reminder
     */
    public Reminder updateReminder(Reminder reminder) {
        reminder.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
        return reminderRepository.save(reminder);
    }

    /**
     * Get all reminders for a user
     */
    @Transactional(readOnly = true)
    public List<Reminder> getAllRemindersForUser(Profile user) {
        return reminderRepository.findByUserOrderByReminderDateAsc(user);
    }

    /**
     * Get a specific reminder by ID for a user
     */
    @Transactional(readOnly = true)
    public Optional<Reminder> getReminderById(Long id, Profile user) {
        return reminderRepository.findByIdAndUser(id, user);
    }

    /**
     * Get pending reminders for a user
     */
    @Transactional(readOnly = true)
    public List<Reminder> getPendingReminders(Profile user) {
        return reminderRepository.findByUserAndStatus(user, ReminderStatus.PENDING);
    }

    /**
     * Get overdue reminders for a user
     */
    @Transactional(readOnly = true)
    public List<Reminder> getOverdueReminders(Profile user) {
        return reminderRepository.findOverdueReminders(user, new Timestamp(System.currentTimeMillis()));
    }

    /**
     * Get reminders due today for a user
     */
    @Transactional(readOnly = true)
    public List<Reminder> getRemindersForToday(Profile user) {
        return reminderRepository.findRemindersDueToday(user, new Timestamp(System.currentTimeMillis()));
    }

    /**
     * Get upcoming reminders (due within next X hours)
     */
    @Transactional(readOnly = true)
    public List<Reminder> getUpcomingReminders(Profile user, int hoursAhead) {
        Timestamp now = new Timestamp(System.currentTimeMillis());
        Timestamp futureTime = new Timestamp(now.getTime() + (hoursAhead * 60 * 60 * 1000L));
        return reminderRepository.findUpcomingReminders(user, now, futureTime);
    }

    /**
     * Get reminders by priority for a user
     */
    @Transactional(readOnly = true)
    public List<Reminder> getRemindersByPriority(Profile user, ReminderPriority priority) {
        return reminderRepository.findByUserAndPriorityOrderByReminderDateAsc(user, priority);
    }

    /**
     * Get reminders within a date range
     */
    @Transactional(readOnly = true)
    public List<Reminder> getRemindersBetweenDates(Profile user, Timestamp startDate, Timestamp endDate) {
        return reminderRepository.findRemindersBetweenDates(user, startDate, endDate);
    }

    /**
     * Search reminders by title or description
     */
    @Transactional(readOnly = true)
    public List<Reminder> searchReminders(Profile user, String searchTerm) {
        return reminderRepository.searchReminders(user, searchTerm);
    }

    /**
     * Mark a reminder as completed
     */
    public Reminder markAsCompleted(Long reminderId, Profile user) {
        Optional<Reminder> reminderOpt = reminderRepository.findByIdAndUser(reminderId, user);
        if (reminderOpt.isPresent()) {
            Reminder reminder = reminderOpt.get();
            reminder.markAsCompleted();
            return reminderRepository.save(reminder);
        }
        throw new RuntimeException("Reminder not found or access denied");
    }

    /**
     * Mark a reminder as cancelled
     */
    public Reminder markAsCancelled(Long reminderId, Profile user) {
        Optional<Reminder> reminderOpt = reminderRepository.findByIdAndUser(reminderId, user);
        if (reminderOpt.isPresent()) {
            Reminder reminder = reminderOpt.get();
            reminder.markAsCancelled();
            return reminderRepository.save(reminder);
        }
        throw new RuntimeException("Reminder not found or access denied");
    }

    /**
     * Delete a reminder
     */
    public void deleteReminder(Long reminderId, Profile user) {
        Optional<Reminder> reminderOpt = reminderRepository.findByIdAndUser(reminderId, user);
        if (reminderOpt.isPresent()) {
            reminderRepository.deleteById(reminderId);
        } else {
            throw new RuntimeException("Reminder not found or access denied");
        }
    }

    /**
     * Get reminder statistics for a user
     */
    @Transactional(readOnly = true)
    public ReminderStats getReminderStats(Profile user) {
        Long totalPending = reminderRepository.countPendingReminders(user);
        Long totalOverdue = reminderRepository.countOverdueReminders(user, new Timestamp(System.currentTimeMillis()));
        
        return new ReminderStats(totalPending, totalOverdue);
    }

    /**
     * Get recurring reminders for a user
     */
    @Transactional(readOnly = true)
    public List<Reminder> getRecurringReminders(Profile user) {
        return reminderRepository.findRecurringReminders(user);
    }

    /**
     * Get reminders for a specific event
     */
    @Transactional(readOnly = true)
    public List<Reminder> getEventReminders(Profile user, Long eventId) {
        return reminderRepository.findByUserAndRelatedEventId(user, eventId);
    }

    /**
     * Snooze a reminder (postpone for specified minutes)
     */
    public Reminder snoozeReminder(Long reminderId, Profile user, int minutes) {
        Optional<Reminder> reminderOpt = reminderRepository.findByIdAndUser(reminderId, user);
        if (reminderOpt.isPresent()) {
            Reminder reminder = reminderOpt.get();
            
            // Add minutes to current reminder date
            long currentTime = reminder.getReminderDate().getTime();
            long snoozeTime = currentTime + (minutes * 60 * 1000L);
            
            reminder.setReminderDate(new Timestamp(snoozeTime));
            reminder.setStatus(ReminderStatus.SNOOZED);
            reminder.setNotificationSent(false); // Reset notification flag
            reminder.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
            
            return reminderRepository.save(reminder);
        }
        throw new RuntimeException("Reminder not found or access denied");
    }

    /**
     * Get reminders that need notifications
     */
    @Transactional(readOnly = true)
    public List<Reminder> getRemindersNeedingNotification(int minutesAhead) {
        Timestamp now = new Timestamp(System.currentTimeMillis());
        Timestamp notificationWindow = new Timestamp(now.getTime() + (minutesAhead * 60 * 1000L));
        return reminderRepository.findRemindersNeedingNotification(now, notificationWindow);
    }

    /**
     * Mark notification as sent for a reminder
     */
    public void markNotificationSent(Long reminderId) {
        Optional<Reminder> reminderOpt = reminderRepository.findById(reminderId);
        if (reminderOpt.isPresent()) {
            Reminder reminder = reminderOpt.get();
            reminder.setNotificationSent(true);
            reminderRepository.save(reminder);
        }
    }

    /**
     * Clean up old completed reminders
     */
    public void cleanupOldCompletedReminders(int daysOld) {
        Timestamp cutoffDate = new Timestamp(System.currentTimeMillis() - (daysOld * 24 * 60 * 60 * 1000L));
        reminderRepository.deleteOldCompletedReminders(cutoffDate);
    }

    // Inner class for reminder statistics
    public static class ReminderStats {
        private Long totalPending;
        private Long totalOverdue;

        public ReminderStats(Long totalPending, Long totalOverdue) {
            this.totalPending = totalPending;
            this.totalOverdue = totalOverdue;
        }

        public Long getTotalPending() {
            return totalPending;
        }

        public Long getTotalOverdue() {
            return totalOverdue;
        }
    }
}
