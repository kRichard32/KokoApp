package com.Koko.app.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;

import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.ByteArrayContent;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;

import jakarta.annotation.PostConstruct;

@Service
public class GoogleDriveFileService {
    
    private static final String APPLICATION_NAME = "Koko-Backend";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    
    @Value("${google.drive.credentials.json}")
    private String credentialsJson;
    
    @Value("${google.drive.shared.drive.id:}")
    private String sharedDriveId; // Optional: Shared Drive ID for enterprise storage
    
    @Value("${google.drive.folder.id:}")
    private String folderId; // Optional: specific folder to store files
    
    private Drive driveService;
    
    @PostConstruct
    public void init() throws GeneralSecurityException, IOException {
        HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        
        // Create credentials from service account JSON
        GoogleCredentials credentials = GoogleCredentials
                .fromStream(new ByteArrayInputStream(credentialsJson.getBytes()))
                .createScoped(Collections.singleton(DriveScopes.DRIVE));
        
        driveService = new Drive.Builder(httpTransport, JSON_FACTORY, new HttpCredentialsAdapter(credentials))
                .setApplicationName(APPLICATION_NAME)
                .build();
                
        // Validate configuration on startup
        validateConfiguration();
    }
    
    /**
     * Validate the Google Drive configuration on startup
     */
    private void validateConfiguration() {
        try {
            // Test basic Drive API access
            driveService.about().get().setFields("user").execute();
            
            // Validate folder ID if specified
            if (folderId != null && !folderId.isEmpty()) {
                validateFolderId(folderId);
            }
            
            // Validate shared drive ID if specified
            if (sharedDriveId != null && !sharedDriveId.isEmpty()) {
                validateSharedDriveId(sharedDriveId);
            }
            
            System.out.println("Google Drive configuration validated successfully");
            
        } catch (Exception e) {
            throw new RuntimeException("Google Drive configuration validation failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Validate that a folder ID exists and is accessible
     */
    private void validateFolderId(String folderId) throws IOException {
        try {
            driveService.files()
                    .get(folderId)
                    .setSupportsAllDrives(true)
                    .setFields("id,name,mimeType")
                    .execute();
        } catch (Exception e) {
            throw new RuntimeException("Invalid folder ID '" + folderId + "': " + e.getMessage());
        }
    }
    
    /**
     * Validate that a shared drive ID exists and is accessible
     */
    private void validateSharedDriveId(String sharedDriveId) throws IOException {
        try {
            driveService.drives()
                    .get(sharedDriveId)
                    .execute();
        } catch (Exception e) {
            throw new RuntimeException("Invalid shared drive ID '" + sharedDriveId + "': " + e.getMessage());
        }
    }
    
    /**
     * Download a file from Google Drive by file ID
     * @param fileId The Google Drive file ID
     * @return byte array of the file content
     */
    public byte[] do_GET(String fileId) {
        try {
            // Download the file content directly by ID
            InputStream inputStream = driveService.files()
                    .get(fileId)
                    .setSupportsAllDrives(true) // Support shared drives
                    .executeMediaAsInputStream();
            
            return IOUtils.toByteArray(inputStream);
            
        } catch (IOException e) {
            throw new RuntimeException("Error downloading file from Google Drive with ID: " + fileId, e);
        }
    }
    
    /**
     * Upload a MultipartFile to Google Drive
     * @param file The multipart file to upload
     * @return The Google Drive file ID
     */
    public String do_POST(MultipartFile file) {
        String result;
        try {
            result = do_POST(file.getOriginalFilename(), IOUtils.toByteArray(file.getInputStream()));
        } catch (IOException e) {
            throw new RuntimeException("Error reading multipart file", e);
        }
        return result;
    }
    
    /**
     * Upload a file to Google Drive using filename and byte content
     * @param filename The name for the file
     * @param content The file content as byte array
     * @return The Google Drive file ID
     */
    public String do_POST(String filename, byte[] content) {
        try {
            // Create file metadata
            File fileMetadata = new File();
            fileMetadata.setName(filename);
            
            // Determine parent folder strategy
            String parentId = determineParentFolder();
            if (parentId != null) {
                fileMetadata.setParents(Collections.singletonList(parentId));
            }
            
            // Create file content
            ByteArrayContent mediaContent = new ByteArrayContent(
                    determineMimeType(filename), 
                    content
            );
            
            // Upload the file with proper drive support
            File uploadedFile = driveService.files()
                    .create(fileMetadata, mediaContent)
                    .setSupportsAllDrives(true) // Support shared drives
                    .setFields("id,name,size,mimeType")
                    .execute();
            
            return uploadedFile.getId();
            
        } catch (IOException e) {
            throw new RuntimeException("Error uploading file to Google Drive: " + filename + " - " + e.getMessage(), e);
        }
    }
    
    /**
     * Determine the parent folder for file uploads
     * Priority: folderId > sharedDriveId > null (My Drive root)
     */
    private String determineParentFolder() {
        if (folderId != null && !folderId.isEmpty()) {
            return folderId; // Use specific folder
        }
        if (sharedDriveId != null && !sharedDriveId.isEmpty()) {
            return sharedDriveId; // Use shared drive root
        }
        return null; // Use My Drive root (service account's drive)
    }
    
    /**
     * Find a file ID by its name in Google Drive
     * @param filename The name of the file to search for
     * @return The file ID if found, null otherwise
     */
    private String findFileIdByName(String filename) throws IOException {
        String query = "name='" + filename + "'";
        
        // Add folder restriction if specified
        if (folderId != null && !folderId.isEmpty()) {
            query += " and '" + folderId + "' in parents";
        }
        
        FileList result = driveService.files()
                .list()
                .setQ(query)
                .setFields("files(id,name)")
                .execute();
        
        List<File> files = result.getFiles();
        
        if (files == null || files.isEmpty()) {
            return null;
        }
        
        // Return the first match
        return files.get(0).getId();
    }
    
    /**
     * Determine MIME type based on file extension
     * @param filename The filename
     * @return The MIME type
     */
    private String determineMimeType(String filename) {
        if (filename == null) {
            return "application/octet-stream";
        }
        
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        
        switch (extension) {
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "gif":
                return "image/gif";
            case "pdf":
                return "application/pdf";
            case "txt":
                return "text/plain";
            case "json":
                return "application/json";
            case "xml":
                return "application/xml";
            case "mp4":
                return "video/mp4";
            case "mp3":
                return "audio/mpeg";
            default:
                return "application/octet-stream";
        }
    }
    
    /**
     * Delete a file from Google Drive by filename
     * @param filename The name of the file to delete
     * @return true if deleted successfully, false if file not found
     */
    public boolean deleteFile(String filename) {
        try {
            String fileId = findFileIdByName(filename);
            
            if (fileId == null) {
                return false;
            }
            
            driveService.files().delete(fileId).execute();
            return true;
            
        } catch (IOException e) {
            throw new RuntimeException("Error deleting file from Google Drive: " + filename, e);
        }
    }
    
    /**
     * Get file information from Google Drive
     * @param filename The name of the file
     * @return File metadata or null if not found
     */
    public File getFileInfo(String filename) {
        try {
            String fileId = findFileIdByName(filename);
            
            if (fileId == null) {
                return null;
            }
            
            return driveService.files()
                    .get(fileId)
                    .setFields("id,name,size,mimeType,createdTime,modifiedTime")
                    .execute();
                    
        } catch (IOException e) {
            throw new RuntimeException("Error getting file info from Google Drive: " + filename, e);
        }
    }
}
