package com.Koko.app.rest;

import com.Koko.app.dataTransfer.EventTransfer;
import com.Koko.app.domain.Event;
import com.Koko.app.domain.Profile;
import com.Koko.app.domain.enumeration.EventStatus;
import com.Koko.app.service.EventService;
import com.Koko.app.service.JwtService;
import com.Koko.app.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    @Autowired
    private EventService eventService;

    @Autowired
    private ProfileService profileService;

    @Autowired
    private JwtService jwtService;

    /**
     * Get all active events
     */
    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        try {
            List<Event> events = eventService.getAllActiveEvents();
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get events by location proximity
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<Event>> getNearbyEvents(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "50") Double radiusKm) {
        try {
            List<Event> events = eventService.getEventsNearLocation(latitude, longitude, radiusKm);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get events created by the current user
     */
    @GetMapping("/my-events")
    public ResponseEntity<List<Event>> getMyEvents(@CookieValue(value = "token", required = false) String token) {
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            List<Event> events = eventService.getEventsByOrganizer(profile);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    /**
     * Get events the current user has joined
     */
    @GetMapping("/joined")
    public ResponseEntity<List<Event>> getJoinedEvents(@CookieValue(value = "token", required = false) String token) {
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile profile = profileService.getProfileByEmail((String) userInfo.get("email"));
            
            List<Event> events = eventService.getEventsJoinedByUser(profile);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    /**
     * Get a specific event by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        try {
            Optional<Event> event = eventService.getEventById(id);
            return event.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Create a new event
     */
    @PostMapping("/createEvent")
    public ResponseEntity<Map<String, Object>> createEvent(
            @CookieValue(value = "token", required = false) String token,
            @RequestBody EventTransfer request) {
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile organizer = profileService.getProfileByEmail((String) userInfo.get("email"));

            Event event = new Event();
            event.setTitle(request.getTitle());
            event.setDescription(request.getDescription());
            event.setEventDate(request.getEventDate());
            event.setLocation(request.getLocation());
            event.setLatitude(request.getLatitude());
            event.setLongitude(request.getLongitude());
            event.setMaxParticipants(request.getMaxParticipants());
            event.setEventType(request.getEventType()); // Fix: should be setEventType
            event.setMinAge(request.getMinAge());
            event.setMaxAge(request.getMaxAge());
            event.setOrganizer(organizer);

            Event savedEvent = eventService.save(event);

            Map<String, Object> response = new HashMap<>();
            response.put("id", savedEvent.getId());
            response.put("message", "Event created successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create event: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Update an existing event
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateEvent(
            @PathVariable Long id,
            @CookieValue(value = "token", required = false) String token,
            @RequestBody EventTransfer request) {
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile currentUser = profileService.getProfileByEmail((String) userInfo.get("email"));

            Optional<Event> eventOpt = eventService.getEventById(id);
            if (eventOpt.isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Event not found");
                return ResponseEntity.notFound().build();
            }

            Event event = eventOpt.get();
            
            // Only organizer can update the event
            if (!event.isOrganizer(currentUser)) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Only the organizer can update this event");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }

            // Update fields if provided
            if (request.getTitle() != null) event.setTitle(request.getTitle());
            if (request.getDescription() != null) event.setDescription(request.getDescription());
            if (request.getEventDate() != null) event.setEventDate(request.getEventDate());
            if (request.getLocation() != null) event.setLocation(request.getLocation());
            if (request.getLatitude() != null) event.setLatitude(request.getLatitude());
            if (request.getLongitude() != null) event.setLongitude(request.getLongitude());
            if (request.getMaxParticipants() != null) event.setMaxParticipants(request.getMaxParticipants());
            if (request.getEventType() != null) event.setEventType(request.getEventType());
            if (request.getMinAge() != null) event.setMinAge(request.getMinAge());
            if (request.getMaxAge() != null) event.setMaxAge(request.getMaxAge());
            if (request.getStatus() != null) event.setStatus(EventStatus.valueOf(request.getStatus()));

            Event savedEvent = eventService.save(event);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Event updated successfully");
            response.put("event", savedEvent);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to update event: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Join an event
     */
    @PostMapping("/{id}/join")
    public ResponseEntity<Map<String, String>> joinEvent(
            @PathVariable Long id,
            @CookieValue(value = "token", required = false) String token) {
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile participant = profileService.getProfileByEmail((String) userInfo.get("email"));

            Optional<Event> eventOpt = eventService.getEventById(id);
            if (eventOpt.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Event not found");
                return ResponseEntity.notFound().build();
            }

            Event event = eventOpt.get();

            if (!event.canJoin(participant)) {
                Map<String, String> error = new HashMap<>();
                if (event.isFull()) {
                    error.put("error", "Event is full");
                } else if (event.isOrganizer(participant)) {
                    error.put("error", "You cannot join your own event");
                } else if (event.isParticipant(participant)) {
                    error.put("error", "You have already joined this event");
                } else {
                    error.put("error", "Cannot join this event");
                }
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            event.addParticipant(participant);
            eventService.save(event);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Successfully joined the event");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to join event: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Leave an event
     */
    @PostMapping("/{id}/leave")
    public ResponseEntity<Map<String, String>> leaveEvent(
            @PathVariable Long id,
            @CookieValue(value = "token", required = false) String token) {
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile participant = profileService.getProfileByEmail((String) userInfo.get("email"));

            Optional<Event> eventOpt = eventService.getEventById(id);
            if (eventOpt.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Event not found");
                return ResponseEntity.notFound().build();
            }

            Event event = eventOpt.get();

            if (!event.isParticipant(participant)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "You are not a participant of this event");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            event.removeParticipant(participant);
            eventService.save(event);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Successfully left the event");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to leave event: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Cancel an event (organizer only)
     */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<Map<String, String>> cancelEvent(
            @PathVariable Long id,
            @CookieValue(value = "token", required = false) String token) {
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile organizer = profileService.getProfileByEmail((String) userInfo.get("email"));

            Optional<Event> eventOpt = eventService.getEventById(id);
            if (eventOpt.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Event not found");
                return ResponseEntity.notFound().build();
            }

            Event event = eventOpt.get();

            if (!event.isOrganizer(organizer)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Only the organizer can cancel this event");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }

            event.setStatus(EventStatus.CANCELLED);
            eventService.save(event);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Event cancelled successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to cancel event: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Delete an event (organizer only)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteEvent(
            @PathVariable Long id,
            @CookieValue(value = "token", required = false) String token) {
        try {
            Map<String, Object> userInfo = jwtService.decodeIdToken(token);
            Profile organizer = profileService.getProfileByEmail((String) userInfo.get("email"));

            Optional<Event> eventOpt = eventService.getEventById(id);
            if (eventOpt.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Event not found");
                return ResponseEntity.notFound().build();
            }

            Event event = eventOpt.get();

            if (!event.isOrganizer(organizer)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Only the organizer can delete this event");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }

            eventService.delete(event);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Event deleted successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete event: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Get participants of an event
     */
    @GetMapping("/{id}/participants")
    public ResponseEntity<List<Profile>> getEventParticipants(@PathVariable Long id) {
        try {
            Optional<Event> eventOpt = eventService.getEventById(id);
            if (eventOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Event event = eventOpt.get();
            return ResponseEntity.ok(List.copyOf(event.getParticipants()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}


