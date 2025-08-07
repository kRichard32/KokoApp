package com.Koko.app.rest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.Koko.app.dataTransfer.ReminderTransfer;
import com.Koko.app.domain.Event;
import com.Koko.app.domain.Profile;
import com.Koko.app.domain.Reminder;
import com.Koko.app.domain.enumeration.ReminderPriority;
import com.Koko.app.domain.enumeration.ReminderType;
import com.Koko.app.service.EventService;
import com.Koko.app.service.JwtService;
import com.Koko.app.service.ProfileService;
import com.Koko.app.service.ReminderService;

@RestController
@RequestMapping("/api/reminders")
@CrossOrigin(origins = "*")
public class ReminderController {

    @Autowired
    private ReminderService reminderService;

    @Autowired
    private ProfileService profileService;

    @Autowired
    private EventService eventService;

    @Autowired
    private JwtService jwtService;

    /**
     * Create a new reminder
     */
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createReminder(
            @RequestBody ReminderTransfer reminderTransfer,
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            // Create reminder entity
            Reminder reminder = new Reminder();
            reminder.setTitle(reminderTransfer.getTitle());
            reminder.setDescription(reminderTransfer.getDescription());
            reminder.setReminderDate(reminderTransfer.getReminderDate());
            reminder.setType(reminderTransfer.getType() != null ? reminderTransfer.getType() : ReminderType.PERSONAL);
            reminder.setPriority(reminderTransfer.getPriority() != null ? reminderTransfer.getPriority() : ReminderPriority.MEDIUM);
            reminder.setUser(user);
            reminder.setLocation(reminderTransfer.getLocation());
            reminder.setIsRecurring(reminderTransfer.getIsRecurring() != null && reminderTransfer.getIsRecurring());
            reminder.setRecurrenceType(reminderTransfer.getRecurrenceType());

            // Handle related event if provided
            if (reminderTransfer.getRelatedEventId() != null) {
                Optional<Event> eventOpt = eventService.getEventById(reminderTransfer.getRelatedEventId());
                eventOpt.ifPresent(reminder::setRelatedEvent);
            }

            Reminder savedReminder = reminderService.createReminder(reminder);
            ReminderTransfer response = convertToTransfer(savedReminder);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Reminder created successfully");
            result.put("reminder", response);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error creating reminder: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get all reminders for the authenticated user
     */
    @GetMapping("/all")
    public ResponseEntity<List<ReminderTransfer>> getAllReminders(
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<Reminder> reminders = reminderService.getAllRemindersForUser(user);
            List<ReminderTransfer> reminderTransfers = reminders.stream()
                .map(this::convertToTransfer)
                .collect(Collectors.toList());

            return ResponseEntity.ok(reminderTransfers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get a specific reminder by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReminderTransfer> getReminder(
            @PathVariable Long id,
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Optional<Reminder> reminderOpt = reminderService.getReminderById(id, user);
            if (!reminderOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            ReminderTransfer reminderTransfer = convertToTransfer(reminderOpt.get());
            return ResponseEntity.ok(reminderTransfer);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update an existing reminder
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateReminder(
            @PathVariable Long id,
            @RequestBody ReminderTransfer reminderTransfer,
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            Optional<Reminder> reminderOpt = reminderService.getReminderById(id, user);
            if (!reminderOpt.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Reminder not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            Reminder reminder = reminderOpt.get();
            
            // Update fields
            if (reminderTransfer.getTitle() != null) {
                reminder.setTitle(reminderTransfer.getTitle());
            }
            if (reminderTransfer.getDescription() != null) {
                reminder.setDescription(reminderTransfer.getDescription());
            }
            if (reminderTransfer.getReminderDate() != null) {
                reminder.setReminderDate(reminderTransfer.getReminderDate());
            }
            if (reminderTransfer.getType() != null) {
                reminder.setType(reminderTransfer.getType());
            }
            if (reminderTransfer.getPriority() != null) {
                reminder.setPriority(reminderTransfer.getPriority());
            }
            if (reminderTransfer.getLocation() != null) {
                reminder.setLocation(reminderTransfer.getLocation());
            }
            if (reminderTransfer.getIsRecurring() != null) {
                reminder.setIsRecurring(reminderTransfer.getIsRecurring());
            }
            if (reminderTransfer.getRecurrenceType() != null) {
                reminder.setRecurrenceType(reminderTransfer.getRecurrenceType());
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Reminder updated successfully");
            result.put("reminder", reminder);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error updating reminder: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Delete a reminder
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteReminder(
            @PathVariable Long id,
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "User not found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            reminderService.deleteReminder(id, user);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Reminder deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Error deleting reminder: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Mark a reminder as completed
     */
    @PutMapping("/{id}/complete")
    public ResponseEntity<Map<String, Object>> markAsCompleted(
            @PathVariable Long id,
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            Reminder completedReminder = reminderService.markAsCompleted(id, user);
            ReminderTransfer response = convertToTransfer(completedReminder);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Reminder marked as completed");
            result.put("reminder", response);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error completing reminder: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Mark a reminder as cancelled
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> markAsCancelled(
            @PathVariable Long id,
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            Reminder cancelledReminder = reminderService.markAsCancelled(id, user);
            ReminderTransfer response = convertToTransfer(cancelledReminder);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Reminder marked as cancelled");
            result.put("reminder", response);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error cancelling reminder: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Snooze a reminder
     */
    @PutMapping("/{id}/snooze")
    public ResponseEntity<Map<String, Object>> snoozeReminder(
            @PathVariable Long id,
            @RequestParam(defaultValue = "15") int minutes,
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            Reminder snoozedReminder = reminderService.snoozeReminder(id, user, minutes);
            ReminderTransfer response = convertToTransfer(snoozedReminder);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Reminder snoozed for " + minutes + " minutes");
            result.put("reminder", response);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error snoozing reminder: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get pending reminders
     */
    @GetMapping("/pending")
    public ResponseEntity<List<ReminderTransfer>> getPendingReminders(
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<Reminder> reminders = reminderService.getPendingReminders(user);
            List<ReminderTransfer> reminderTransfers = reminders.stream()
                .map(this::convertToTransfer)
                .collect(Collectors.toList());

            return ResponseEntity.ok(reminderTransfers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get overdue reminders
     */
    @GetMapping("/overdue")
    public ResponseEntity<List<ReminderTransfer>> getOverdueReminders(
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<Reminder> reminders = reminderService.getOverdueReminders(user);
            List<ReminderTransfer> reminderTransfers = reminders.stream()
                .map(this::convertToTransfer)
                .collect(Collectors.toList());

            return ResponseEntity.ok(reminderTransfers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get reminders for today
     */
    @GetMapping("/today")
    public ResponseEntity<List<ReminderTransfer>> getTodaysReminders(
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<Reminder> reminders = reminderService.getRemindersForToday(user);
            List<ReminderTransfer> reminderTransfers = reminders.stream()
                .map(this::convertToTransfer)
                .collect(Collectors.toList());

            return ResponseEntity.ok(reminderTransfers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get upcoming reminders
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<ReminderTransfer>> getUpcomingReminders(
            @RequestParam(defaultValue = "24") int hoursAhead,
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<Reminder> reminders = reminderService.getUpcomingReminders(user, hoursAhead);
            List<ReminderTransfer> reminderTransfers = reminders.stream()
                .map(this::convertToTransfer)
                .collect(Collectors.toList());

            return ResponseEntity.ok(reminderTransfers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Search reminders
     */
    @GetMapping("/search")
    public ResponseEntity<List<ReminderTransfer>> searchReminders(
            @RequestParam String query,
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<Reminder> reminders = reminderService.searchReminders(user, query);
            List<ReminderTransfer> reminderTransfers = reminders.stream()
                .map(this::convertToTransfer)
                .collect(Collectors.toList());

            return ResponseEntity.ok(reminderTransfers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get reminder statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<ReminderService.ReminderStats> getReminderStats(
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            ReminderService.ReminderStats stats = reminderService.getReminderStats(user);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get reminders by priority
     */
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<ReminderTransfer>> getRemindersByPriority(
            @PathVariable ReminderPriority priority,
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<Reminder> reminders = reminderService.getRemindersByPriority(user, priority);
            List<ReminderTransfer> reminderTransfers = reminders.stream()
                .map(this::convertToTransfer)
                .collect(Collectors.toList());

            return ResponseEntity.ok(reminderTransfers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get event-related reminders
     */
    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<ReminderTransfer>> getEventReminders(
            @PathVariable Long eventId,
            @CookieValue(value = "token", required = false) String token) {
        
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile user = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<Reminder> reminders = reminderService.getEventReminders(user, eventId);
            List<ReminderTransfer> reminderTransfers = reminders.stream()
                .map(this::convertToTransfer)
                .collect(Collectors.toList());

            return ResponseEntity.ok(reminderTransfers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Convert Reminder entity to ReminderTransfer
     */
    private ReminderTransfer convertToTransfer(Reminder reminder) {
        ReminderTransfer transfer = new ReminderTransfer();
        transfer.setId(reminder.getId());
        transfer.setTitle(reminder.getTitle());
        transfer.setDescription(reminder.getDescription());
        transfer.setReminderDate(reminder.getReminderDate());
        transfer.setType(reminder.getType());
        transfer.setPriority(reminder.getPriority());
        transfer.setStatus(reminder.getStatus());
        transfer.setIsRecurring(reminder.getIsRecurring());
        transfer.setRecurrenceType(reminder.getRecurrenceType());
        transfer.setLocation(reminder.getLocation());
        transfer.setNotificationSent(reminder.getNotificationSent());

        // Set user information
        if (reminder.getUser() != null) {
            transfer.setUserId(reminder.getUser().getId());
        }

        // Set related event information
        if (reminder.getRelatedEvent() != null) {
            transfer.setRelatedEventId(reminder.getRelatedEvent().getId());
        }

        return transfer;
    }
}
