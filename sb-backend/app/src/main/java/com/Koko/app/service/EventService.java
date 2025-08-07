package com.Koko.app.service;

import com.Koko.app.domain.Event;
import com.Koko.app.domain.Profile;
import com.Koko.app.domain.enumeration.EventStatus;
import com.Koko.app.repositories.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    /**
     * Get all active events
     */
    public List<Event> getAllActiveEvents() {
        return eventRepository.findByStatusOrderByEventDateAsc(EventStatus.valueOf("ACTIVE"));
    }

    /**
     * Get events near a specific location
     */
    public List<Event> getEventsNearLocation(Double latitude, Double longitude, Double radiusKm) {
        return eventRepository.findEventsNearLocation(latitude, longitude, radiusKm, "ACTIVE");
    }

    /**
     * Get events created by a specific organizer
     */
    public List<Event> getEventsByOrganizer(Profile organizer) {
        return eventRepository.findByOrganizerOrderByEventDateDesc(organizer);
    }

    /**
     * Get events that a user has joined
     */
    public List<Event> getEventsJoinedByUser(Profile user) {
        return eventRepository.findEventsJoinedByUser(user);
    }

    /**
     * Get event by ID
     */
    public Optional<Event> getEventById(Long id) {
        return eventRepository.findById(id);
    }

    /**
     * Save an event
     */
    public Event save(Event event) {
        return eventRepository.save(event);
    }

    /**
     * Delete an event
     */
    public void delete(Event event) {
        eventRepository.delete(event);
    }

    /**
     * Get events by type
     */
    public List<Event> getEventsByType(String eventType) {
        return eventRepository.findByEventTypeAndStatusOrderByEventDateAsc(eventType, "ACTIVE");
    }

    /**
     * Get events in a date range
     */
    public List<Event> getEventsInDateRange(Timestamp startDate, Timestamp endDate) {
        return eventRepository.findEventsInDateRange(startDate, endDate, "ACTIVE");
    }

    /**
     * Get available events (with spots remaining)
     */
    public List<Event> getAvailableEvents() {
        return eventRepository.findAvailableEvents("ACTIVE");
    }

    /**
     * Get events suitable for a user's age
     */
    public List<Event> getEventsByUserAge(Integer userAge) {
        return eventRepository.findEventsByAgeRange(userAge, "ACTIVE");
    }

    /**
     * Count events by organizer
     */
    public Long countEventsByOrganizer(Profile organizer) {
        return eventRepository.countByOrganizer(organizer);
    }

    /**
     * Count events by status
     */
    public Long countEventsByStatus(String status) {
        return eventRepository.countByStatus(status);
    }

    /**
     * Check if user can join event
     */
    public boolean canUserJoinEvent(Event event, Profile user) {
        return event.canJoin(user);
    }

    /**
     * Add participant to event
     */
    public boolean addParticipantToEvent(Event event, Profile participant) {
        if (event.canJoin(participant)) {
            event.addParticipant(participant);
            save(event);
            return true;
        }
        return false;
    }

    /**
     * Remove participant from event
     */
    public boolean removeParticipantFromEvent(Event event, Profile participant) {
        if (event.isParticipant(participant)) {
            event.removeParticipant(participant);
            save(event);
            return true;
        }
        return false;
    }

    /**
     * Cancel an event
     */
    public void cancelEvent(Event event) {
        event.setStatus(EventStatus.CANCELLED);
        save(event);
    }

    /**
     * Complete an event
     */
    public void completeEvent(Event event) {
        event.setStatus(EventStatus.COMPLETED);
        save(event);
    }

    /**
     * Get events for a specific location and user preferences
     */
    public List<Event> getRecommendedEvents(Profile user, Double latitude, Double longitude, Double radiusKm) {
        // Get nearby events
        List<Event> nearbyEvents = getEventsNearLocation(latitude, longitude, radiusKm);
        
        // For now, just return nearby events
        // You can enhance this method later to include user preferences, calculated age from birthdate, etc.
        return nearbyEvents;
    }
}
