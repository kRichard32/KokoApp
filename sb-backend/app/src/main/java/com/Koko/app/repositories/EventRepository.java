package com.Koko.app.repositories;

import com.Koko.app.domain.Event;
import com.Koko.app.domain.Profile;
import com.Koko.app.domain.enumeration.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    
    /**
     * Find all active events
     */
    List<Event> findByStatusOrderByEventDateAsc(EventStatus status);
    
    /**
     * Find events by organizer
     */
    List<Event> findByOrganizerOrderByEventDateDesc(Profile organizer);
    
    /**
     * Find events where user is a participant
     */
    @Query("SELECT e FROM Event e JOIN e.participants p WHERE p = :user ORDER BY e.eventDate ASC")
    List<Event> findEventsJoinedByUser(@Param("user") Profile user);
    
    /**
     * Find events by event type
     */
    List<Event> findByEventTypeAndStatusOrderByEventDateAsc(String eventType, String status);
    
    /**
     * Find events within a date range
     */
    @Query("SELECT e FROM Event e WHERE e.eventDate BETWEEN :startDate AND :endDate AND e.status = :status ORDER BY e.eventDate ASC")
    List<Event> findEventsInDateRange(@Param("startDate") java.sql.Timestamp startDate, 
                                     @Param("endDate") java.sql.Timestamp endDate, 
                                     @Param("status") String status);
    
    /**
     * Find events near a location (using Haversine formula approximation)
     * This is a basic implementation - for production, consider using PostGIS or similar
     */
    @Query("SELECT e FROM Event e WHERE e.status = :status AND " +
           "e.latitude IS NOT NULL AND e.longitude IS NOT NULL AND " +
           "(6371 * acos(cos(radians(:latitude)) * cos(radians(e.latitude)) * " +
           "cos(radians(e.longitude) - radians(:longitude)) + " +
           "sin(radians(:latitude)) * sin(radians(e.latitude)))) <= :radiusKm " +
           "ORDER BY e.eventDate ASC")
    List<Event> findEventsNearLocation(@Param("latitude") Double latitude, 
                                      @Param("longitude") Double longitude, 
                                      @Param("radiusKm") Double radiusKm, 
                                      @Param("status") String status);
    
    /**
     * Find events with available spots
     */
    @Query("SELECT e FROM Event e WHERE e.status = :status AND " +
           "(e.maxParticipants IS NULL OR e.currentParticipants < e.maxParticipants) " +
           "ORDER BY e.eventDate ASC")
    List<Event> findAvailableEvents(@Param("status") String status);
    
    /**
     * Find events by age range
     */
    @Query("SELECT e FROM Event e WHERE e.status = :status ORDER BY e.eventDate ASC")
    List<Event> findEventsByAgeRange(@Param("userAge") Integer userAge, @Param("status") String status);
    
    /**
     * Count events by organizer
     */
    Long countByOrganizer(Profile organizer);
    
    /**
     * Count events by status
     */
    Long countByStatus(String status);
}
