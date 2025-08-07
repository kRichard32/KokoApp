package com.Koko.app.domain;

import java.sql.Timestamp;
import java.util.Set;

import com.Koko.app.domain.enumeration.EventStatus;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private Timestamp eventDate;

    @Column(length = 200)
    private String location;

    // Geographic coordinates for location-based matching
    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Column(name = "current_participants", nullable = false)
    private Integer currentParticipants = 0;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status = EventStatus.ACTIVE;

    // Event creator/organizer
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organizer_id", nullable = false)
    private Profile organizer;

    // Users who have joined the event
    @ManyToMany
    @JoinTable(
        name = "event_participants",
        joinColumns = @JoinColumn(name = "event_id"),
        inverseJoinColumns = @JoinColumn(name = "profile_id")
    )
    private Set<Profile> participants;

    // Optional: Image for the event
    @Column(name = "image_file_id")
    private String imageFileId;

    @Column(name = "created_at", nullable = false)
    private Timestamp createdAt;

    @Column(name = "updated_at")
    private Timestamp updatedAt;

    private String duration;


    // Constructors
    public Event() {
        this.createdAt = new Timestamp(System.currentTimeMillis());
        this.currentParticipants = 0;
        this.status = EventStatus.ACTIVE;
    }

    public Event(String title, String description, Timestamp eventDate, Profile organizer) {
        this();
        this.title = title;
        this.description = description;
        this.eventDate = eventDate;
        this.organizer = organizer;
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

    public Timestamp getEventDate() {
        return eventDate;
    }

    public void setEventDate(Timestamp eventDate) {
        this.eventDate = eventDate;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Integer getMaxParticipants() {
        return maxParticipants;
    }

    public void setMaxParticipants(Integer maxParticipants) {
        this.maxParticipants = maxParticipants;
    }

    public Integer getCurrentParticipants() {
        return currentParticipants;
    }

    public void setCurrentParticipants(Integer currentParticipants) {
        this.currentParticipants = currentParticipants;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String String) {
        this.eventType = String;
    }

    public EventStatus getStatus() {
        return status;
    }

    public void setStatus(EventStatus status) {
        this.status = status;
        this.updatedAt = new Timestamp(System.currentTimeMillis());
    }

    public Profile getOrganizer() {
        return organizer;
    }

    public void setOrganizer(Profile organizer) {
        this.organizer = organizer;
    }

    public Set<Profile> getParticipants() {
        return participants;
    }

    public void setParticipants(Set<Profile> participants) {
        this.participants = participants;
    }

    public String getImageFileId() {
        return imageFileId;
    }

    public void setImageFileId(String imageFileId) {
        this.imageFileId = imageFileId;
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

    // Utility methods
    public boolean isFull() {
        return maxParticipants != null && currentParticipants >= maxParticipants;
    }

    public boolean canJoin(Profile profile) {
        return !isFull() &&
               status.equals("ACTIVE") &&
               !participants.contains(profile) &&
               !organizer.equals(profile);
    }

    public void addParticipant(Profile profile) {
        if (canJoin(profile)) {
            participants.add(profile);
            currentParticipants++;
            this.updatedAt = new Timestamp(System.currentTimeMillis());
        }
    }

    public void removeParticipant(Profile profile) {
        if (participants.remove(profile)) {
            currentParticipants = Math.max(0, currentParticipants - 1);
            this.updatedAt = new Timestamp(System.currentTimeMillis());
        }
    }

    public boolean isOrganizer(Profile profile) {
        return organizer.equals(profile);
    }

    public boolean isParticipant(Profile profile) {
        return participants.contains(profile);
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }
}



