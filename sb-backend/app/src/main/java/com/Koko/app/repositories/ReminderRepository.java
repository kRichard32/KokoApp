package com.Koko.app.repositories;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.Koko.app.domain.Profile;
import com.Koko.app.domain.Reminder;
import com.Koko.app.domain.enumeration.ReminderStatus;
import com.Koko.app.domain.enumeration.ReminderPriority;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    
    // Find all reminders for a specific user
    List<Reminder> findByUserOrderByReminderDateAsc(Profile user);
    
    // Find reminders by user and status
    List<Reminder> findByUserAndStatusOrderByReminderDateAsc(Profile user, ReminderStatus status);
    
    // Find pending reminders for a user
    List<Reminder> findByUserAndStatus(Profile user, ReminderStatus status);
    
    // Find reminders by priority for a user
    List<Reminder> findByUserAndPriorityOrderByReminderDateAsc(Profile user, ReminderPriority priority);
    
    // Find overdue reminders for a user
    @Query("SELECT r FROM Reminder r WHERE r.user = :user AND r.status = 'PENDING' AND r.reminderDate < :currentTime ORDER BY r.reminderDate ASC")
    List<Reminder> findOverdueReminders(@Param("user") Profile user, @Param("currentTime") Timestamp currentTime);
    
    // Find reminders due today for a user
    @Query("SELECT r FROM Reminder r WHERE r.user = :user AND r.status = 'PENDING' AND DATE(r.reminderDate) = DATE(:today) ORDER BY r.reminderDate ASC")
    List<Reminder> findRemindersDueToday(@Param("user") Profile user, @Param("today") Timestamp today);
    
    // Find reminders within a date range for a user
    @Query("SELECT r FROM Reminder r WHERE r.user = :user AND r.reminderDate BETWEEN :startDate AND :endDate ORDER BY r.reminderDate ASC")
    List<Reminder> findRemindersBetweenDates(@Param("user") Profile user, @Param("startDate") Timestamp startDate, @Param("endDate") Timestamp endDate);
    
    // Find reminders by user and event
    List<Reminder> findByUserAndRelatedEventId(Profile user, Long eventId);
    
    // Find upcoming reminders (due within next X hours)
    @Query("SELECT r FROM Reminder r WHERE r.user = :user AND r.status = 'PENDING' AND r.reminderDate BETWEEN :now AND :futureTime ORDER BY r.reminderDate ASC")
    List<Reminder> findUpcomingReminders(@Param("user") Profile user, @Param("now") Timestamp now, @Param("futureTime") Timestamp futureTime);
    
    // Find recurring reminders for a user
    @Query("SELECT r FROM Reminder r WHERE r.user = :user AND r.isRecurring = true ORDER BY r.reminderDate ASC")
    List<Reminder> findRecurringReminders(@Param("user") Profile user);
    
    // Find reminders that need notifications (not yet sent and due within notification window)
    @Query("SELECT r FROM Reminder r WHERE r.status = 'PENDING' AND r.notificationSent = false AND r.reminderDate BETWEEN :now AND :notificationWindow ORDER BY r.reminderDate ASC")
    List<Reminder> findRemindersNeedingNotification(@Param("now") Timestamp now, @Param("notificationWindow") Timestamp notificationWindow);
    
    // Find a specific reminder by ID and user (for security)
    Optional<Reminder> findByIdAndUser(Long id, Profile user);
    
    // Count pending reminders for a user
    @Query("SELECT COUNT(r) FROM Reminder r WHERE r.user = :user AND r.status = 'PENDING'")
    Long countPendingReminders(@Param("user") Profile user);
    
    // Count overdue reminders for a user
    @Query("SELECT COUNT(r) FROM Reminder r WHERE r.user = :user AND r.status = 'PENDING' AND r.reminderDate < :currentTime")
    Long countOverdueReminders(@Param("user") Profile user, @Param("currentTime") Timestamp currentTime);
    
    // Search reminders by title or description
    @Query("SELECT r FROM Reminder r WHERE r.user = :user AND (LOWER(r.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(r.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) ORDER BY r.reminderDate ASC")
    List<Reminder> searchReminders(@Param("user") Profile user, @Param("searchTerm") String searchTerm);
    
    // Delete completed reminders older than specified date
    @Modifying
    @Query("DELETE FROM Reminder r WHERE r.status = 'COMPLETED' AND r.completedAt < :cutoffDate")
    void deleteOldCompletedReminders(@Param("cutoffDate") Timestamp cutoffDate);
}
